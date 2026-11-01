import test from 'node:test';
import assert from 'node:assert/strict';
import { environment } from './helpers.ts';
import { handleApi } from '../router.ts';
import { passwordHash } from '../auth/password.ts';
async function setup() {
 const {env,db}=environment();
 const configured={...env,ADMIN_USERNAME:'admin',ADMIN_PASSWORD_HASH:'test-salt:'+await passwordHash('fixture-password','test-salt')};
 return {env:configured,db};
}
function login(password='fixture-password', origin='https://mix.test') {
 return new Request('https://mix.test/api/auth/login',{method:'POST',headers:{origin,'content-type':'application/json','cf-connecting-ip':'192.0.2.1'},body:JSON.stringify({username:'admin',password})});
}
test('password login issues secure opaque cookie; session authorizes writes and logout revokes it', async()=>{
 const {env,db}=await setup();
 const response=await handleApi(login(),env);
 assert.equal(response?.status,200);
 const cookie=response!.headers.get('set-cookie')!;
 assert.match(cookie,/HttpOnly; Secure; SameSite=Strict/);
 assert.equal(db.prepare('SELECT count(*) AS count FROM admin_sessions').get()?.['count'],1);
 const stored=db.prepare('SELECT token_hash FROM admin_sessions').get()?.['token_hash'];
 assert.ok(!cookie.includes(String(stored)));
 const headers={cookie:cookie.split(';')[0]!};
 const session=await handleApi(new Request('https://mix.test/api/session',{headers}),env);
 assert.equal((await session!.json() as {isAdmin:boolean}).isAdmin,true);
 const state=await handleApi(new Request('https://mix.test/api/state',{headers}),env);
 const payload=await state!.json();
 const write=await handleApi(new Request('https://mix.test/api/state',{method:'PUT',headers:{...headers,origin:'https://mix.test','content-type':'application/json'},body:JSON.stringify(payload)}),env);
 assert.equal(write?.status,200);
 const logout=await handleApi(new Request('https://mix.test/api/auth/logout',{method:'POST',headers:{...headers,origin:'https://mix.test'}}),env);
 assert.equal(logout?.status,200); assert.match(logout!.headers.get('set-cookie')!,/Max-Age=0/);
 const expired=await handleApi(new Request('https://mix.test/api/session',{headers}),env);
 assert.equal((await expired!.json() as {isAdmin:boolean}).isAdmin,false);
});
test('invalid credentials and foreign origin never create sessions; attempts are throttled',async()=>{
 const {env,db}=await setup();
 assert.equal((await handleApi(login('bad','https://attacker.test'),env))?.status,403);
 for(let i=0;i<10;i++) assert.equal((await handleApi(login('bad'),env))?.status,401);
 assert.equal((await handleApi(login(),env))?.status,429);
 assert.equal(db.prepare('SELECT count(*) AS count FROM admin_sessions').get()?.['count'],0);
 db.prepare('UPDATE login_attempts SET window_start = ?').run(Date.now()-16*60*1000);
 assert.equal((await handleApi(login(),env))?.status,200);
});
test('expired sessions, fabricated cookies and password rotation cannot authorize a request',async()=>{
 const {env,db}=await setup();
 const response=await handleApi(login(),env);
 const cookie=response!.headers.get('set-cookie')!.split(';')[0]!;
 const session=(cookie:string, runtime=env)=>handleApi(new Request('https://mix.test/api/session',{headers:{cookie}}),runtime);
 const rotated=await session(cookie,{...env,ADMIN_PASSWORD_HASH:'different:hash'});
 assert.equal((await rotated!.json() as {isAdmin:boolean}).isAdmin,false);
 db.prepare('UPDATE admin_sessions SET expires_at = 1').run();
 assert.equal((await (await session(cookie))!.json() as {isAdmin:boolean}).isAdmin,false);
 assert.equal((await (await session('__Host-mix_admin='+'f'.repeat(64)))!.json() as {isAdmin:boolean}).isAdmin,false);
});
test('oversized and malformed authentication payloads are rejected before password work',async()=>{
 const {env}=await setup();
 const request=(body:string)=>new Request('https://mix.test/api/auth/login',{method:'POST',headers:{origin:'https://mix.test','content-type':'application/json'},body});
 assert.equal((await handleApi(request('x'.repeat(4097)),env))?.status,413);
 assert.equal((await handleApi(request('{'),env))?.status,400);
 assert.equal((await handleApi(request('{}'),env))?.status,400);
});
