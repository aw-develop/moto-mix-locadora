import type { RequestContext } from '../models/environment.ts';
import { requireSameOrigin } from '../auth/identity.ts';
import { digest, newToken, sessionCookie, sessionKey, sessionToken, SESSION_SECONDS, verifyPassword } from '../auth/password.ts';
import { readJson } from '../http/body.ts';
import { fail } from '../http/errors.ts';
import { json } from '../http/responses.ts';
export async function authRoute({request,env,url}: RequestContext): Promise<Response> {
  requireSameOrigin(request);
  if (url.pathname === '/api/auth/logout') {
    const token = sessionToken(request);
    if (token) await env.DB.batch([env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(await sessionKey(token,env))]);
    const response = json({success:true});
    response.headers.set('set-cookie',sessionCookie('',0));
    return response;
  }
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD_HASH) fail('Acesso por senha ainda não configurado.',503);
  const body = await readJson(request,4096);
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Informe login e senha.');
  const data = body as Record<string,unknown>;
  const username = data['username'], password = data['password'];
  if (typeof username !== 'string' || username.length > 80 || typeof password !== 'string' || !password || password.length > 256) fail('Informe login e senha válidos.');
  const key = await digest(request.headers.get('cf-connecting-ip') || 'unknown');
  const now=Date.now(), windowStart=now-15*60*1000;
  const [attempts] = await env.DB.batch<{attempts:number}>([
    env.DB.prepare('INSERT INTO login_attempts (key, attempts, window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts = CASE WHEN window_start < ? THEN 1 ELSE attempts + 1 END, window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END RETURNING attempts').bind(key,now,windowStart,windowStart),
    env.DB.prepare('DELETE FROM login_attempts WHERE window_start < ?').bind(now-24*60*60*1000),
  ]);
  if ((attempts?.results[0]?.attempts || 0) > 10) fail('Muitas tentativas. Aguarde 15 minutos e tente novamente.',429);
  const valid = await verifyPassword(password,env.ADMIN_PASSWORD_HASH);
  if (!valid || username.trim() !== env.ADMIN_USERNAME) fail('Login ou senha incorretos.',401);
  const token = newToken();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now),
    env.DB.prepare('INSERT INTO admin_sessions (token_hash,expires_at) VALUES (?,?)').bind(await sessionKey(token,env),now+SESSION_SECONDS*1000),
    env.DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key),
  ]);
  const response = json({isAdmin:true,signedIn:true,name:env.ADMIN_USERNAME,email:''});
  response.headers.set('set-cookie',sessionCookie(token));
  return response;
}
