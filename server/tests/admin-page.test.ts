import test from 'node:test';
import assert from 'node:assert/strict';
import { environment } from './helpers.ts';
import { adminPageGate } from '../auth/admin-page.ts';
import { passwordHash } from '../auth/password.ts';
import { handleApi } from '../router.ts';
import { secureResponse } from '../http/security.ts';
test('all protected admin documents reject anonymous access before the Angular application is served',async()=>{
 const {env}=environment();
 for(const path of ['/admin','/admin/dashboard','/admin/motos','/admin/banners','/admin/configuracoes','/%61dmin/dashboard','/admin;mode=test/dashboard','/admin/dashboard?_rsc=1']){
  const request=new Request('https://mix.test'+path);
  const gate=await adminPageGate(request,env);assert.ok(gate,path);
  assert.equal(gate.status,303,path);assert.equal(gate.headers.get('location'),'/admin/login');
  const protectedResponse=secureResponse(gate,request);
  assert.match(protectedResponse.headers.get('x-robots-tag')!,/noindex/);
  assert.equal(protectedResponse.headers.get('cache-control'),'no-store');
 }
 for(const path of ['/','/admin/login','/admin/login/','/assets/hero.webp','/api/session'])assert.equal(await adminPageGate(new Request('https://mix.test'+path),env),null,path);
});
test('page access requires a current server session and is denied after logout or expiry',async()=>{
 const {env:base,db}=environment();const salt='test-salt';
 const env={...base,ADMIN_USERNAME:'admin',ADMIN_PASSWORD_HASH:salt+':'+await passwordHash('fixture-password',salt)};
 const login=await handleApi(new Request('https://mix.test/api/auth/login',{method:'POST',headers:{origin:'https://mix.test','content-type':'application/json'},body:JSON.stringify({username:'admin',password:'fixture-password'})}),env);
 assert.equal(login?.status,200);
 const cookie=login!.headers.get('set-cookie')!.split(';')[0]!;
 const request=()=>new Request('https://mix.test/admin/motos',{headers:{cookie}});
 assert.equal(await adminPageGate(request(),env),null);
 const invalid=await adminPageGate(new Request('https://mix.test/admin/motos',{headers:{cookie:'__Host-mix_admin='+'f'.repeat(64)}}),env);assert.equal(invalid?.status,303);
 db.prepare('UPDATE admin_sessions SET expires_at=1').run();assert.equal((await adminPageGate(request(),env))?.status,303);
 db.prepare('UPDATE admin_sessions SET expires_at=?').run(Date.now()+60000);
 await handleApi(new Request('https://mix.test/api/auth/logout',{method:'POST',headers:{origin:'https://mix.test',cookie}}),env);
 assert.equal((await adminPageGate(request(),env))?.status,303);
});
test('unapproved accounts and session storage failures never receive a protected document',async()=>{
 const {env}=environment();
 const visitor=new Request('https://mix.test/admin/dashboard',{headers:{'oai-authenticated-user-id':'visitor','oai-authenticated-user-email':'visitor@example.com'}});
 assert.equal((await adminPageGate(visitor,env))?.status,303);
 const owner=new Request('https://mix.test/admin/dashboard',{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'admin@example.com'}});
 assert.equal(await adminPageGate(owner,env),null);
 const broken={...env,DB:{prepare:()=>{throw new Error('private database detail');}} as unknown as D1Database};
 const failed=await adminPageGate(new Request('https://mix.test/admin/motos',{headers:{cookie:'__Host-mix_admin='+'a'.repeat(64)}}),broken);
 assert.equal(failed?.status,503);assert.ok(!(await failed!.text()).includes('private database detail'));
});
