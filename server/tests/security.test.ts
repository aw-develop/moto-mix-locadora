import test from 'node:test';
import assert from 'node:assert/strict';
import { environment, request, seedState } from './helpers.ts';
import { handleApi } from '../router.ts';
import { DOCUMENT_CSP, secureResponse, protectedSourcePath } from '../http/security.ts';
test('public data omits drafts, history and secrets; authenticated administrator still receives drafts',async()=>{
 const {env}=environment(), initial=seedState();
 const state={...initial,banners:[...initial.banners,{...initial.banners[0]!,id:'draft',title:'PRIVATE-CAMPAIGN',active:false}],activities:[{id:'private-event',type:'settings' as const,title:'PRIVATE-ACTIVITY',detail:'Internal note',at:'2026-11-01'}]};
 assert.equal((await handleApi(request('PUT',{version:0,state}),env))?.status,200);
 const publicResponse=await handleApi(request('GET',undefined,false),env);
 const body=await publicResponse!.text();
 for(const forbidden of ['PRIVATE-CAMPAIGN','PRIVATE-ACTIVITY','ADMIN_EMAILS','admin@example.com','password_hash','token_hash','admin_credentials'])assert.ok(!body.includes(forbidden),forbidden);
 const admin=await handleApi(request(),env);const full=await admin!.text();assert.match(full,/PRIVATE-CAMPAIGN/);assert.match(full,/PRIVATE-ACTIVITY/);
 const session=await handleApi(new Request('https://mix.test/api/session',{headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'admin@example.com'}}),env);
 assert.ok(!(await session!.text()).includes('admin@example.com'));
});
test('HTML responses enforce browser defenses without allowing inline scripts or eval',()=>{
 const request=new Request('https://mix.test/admin/dashboard');
 const response=secureResponse(new Response('<html></html>',{headers:{'content-type':'text/html'}}),request);
 assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 assert.equal(response.headers.get('referrer-policy'),'no-referrer');
 assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
 assert.match(response.headers.get('strict-transport-security')!,/max-age/);
 const scripts=DOCUMENT_CSP.split('; ').find(value=>value.startsWith('script-src'))!;
 assert.equal(scripts,"script-src 'self'");assert.match(DOCUMENT_CSP,/object-src 'none'/);assert.match(DOCUMENT_CSP,/connect-src 'self'/);
});
test('security wrapper preserves session cookie and API/media cache contracts',()=>{
 const api=secureResponse(new Response('{}',{headers:{'content-type':'application/json','set-cookie':'session=test; HttpOnly','cache-control':'no-store'}}),new Request('https://mix.test/api/session'));
 assert.equal(api.headers.get('set-cookie'),'session=test; HttpOnly');assert.equal(api.headers.get('cache-control'),'no-store');
 const image=secureResponse(new Response('image',{headers:{'content-type':'image/png','content-security-policy':"default-src 'none'",'cache-control':'public, max-age=31536000, immutable'}}),new Request('https://mix.test/api/media/test.png'));
 assert.equal(image.headers.get('content-security-policy'),"default-src 'none'");assert.match(image.headers.get('cache-control')!,/immutable/);
});
test('private source paths are rejected while application routes and public assets remain allowed',()=>{
 for(const path of ['/.env','/.env.production','/.git/config','/.openai/hosting.json','/server/auth/password.ts','/%73erver/auth/password.ts','/drizzle/0000.sql','/client/main.js.map','/package-lock.json'])assert.equal(protectedSourcePath(path),true,path);
 for(const path of ['/','/admin/login','/admin/configuracoes','/api/session','/client/main.js','/assets/bootstrap-icons.svg'])assert.equal(protectedSourcePath(path),false,path);
});
