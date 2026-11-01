import type { RequestContext } from '../models/environment.ts';
import { requireSameOrigin } from '../auth/identity.ts';
import { newToken, sessionCookie, sessionKey, sessionToken, SESSION_SECONDS, verifyPassword } from '../auth/password.ts';
import { credentials } from '../repositories/credentials.repository.ts';
import { limitAttempts } from '../auth/attempts.ts';
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
  const account = await credentials(env);
  const body = await readJson(request,4096);
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Informe login e senha.');
  const data = body as Record<string,unknown>;
  const username = data['username'], password = data['password'];
  if (typeof username !== 'string' || username.length > 80 || typeof password !== 'string' || !password || password.length > 256) fail('Informe login e senha válidos.');
  const key = await limitAttempts(request,env);
  const valid = await verifyPassword(password,account.password_hash);
  if (!valid || username.trim() !== account.username) fail('Login ou senha incorretos.',401);
  const now=Date.now();
  const token = newToken();
  const [, inserted] = await env.DB.batch([
    env.DB.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now),
    env.DB.prepare("INSERT INTO admin_sessions (token_hash,expires_at) SELECT ?,? WHERE EXISTS (SELECT 1 FROM admin_credentials WHERE id='main' AND revision=?)").bind(await sessionKey(token,env),now+SESSION_SECONDS*1000,account.revision),
    env.DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key),
  ]);
  if (!inserted?.meta.changes) fail('Credenciais alteradas. Entre novamente.',409);
  const response = json({isAdmin:true,signedIn:true,name:account.username,email:''});
  response.headers.set('set-cookie',sessionCookie(token));
  return response;
}
