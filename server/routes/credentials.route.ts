import type { RequestContext } from '../models/environment.ts';
import { requireAdmin, requireSameOrigin } from '../auth/identity.ts';
import { passwordHash, newToken, sessionCookie, verifyPassword } from '../auth/password.ts';
import { limitAttempts } from '../auth/attempts.ts';
import { credentials, changeCredentials } from '../repositories/credentials.repository.ts';
import { readJson } from '../http/body.ts';
import { fail } from '../http/errors.ts';
import { json } from '../http/responses.ts';
export async function credentialsRoute({request,env,identity}: RequestContext): Promise<Response> {
  requireSameOrigin(request); requireAdmin(identity);
  const body=await readJson(request,4096);
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Informe os dados de acesso.');
  const data=body as Record<string,unknown>;
  const username=data['username'], current=data['currentPassword'], next=data['newPassword'], confirmation=data['confirmPassword'];
  if (typeof username !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._@-]{2,79}$/.test(username)) fail('O login deve ter de 3 a 80 caracteres: letras, números, ponto, @, hífen ou sublinhado.');
  if (typeof current !== 'string' || !current || current.length>256) fail('Informe a senha atual.');
  if (typeof next !== 'string' || next.length<12 || next.length>128 || !/\S/.test(next)) fail('A nova senha deve ter de 12 a 128 caracteres.');
  if (next!==confirmation) fail('A confirmação da senha não confere.');
  if (next===current) fail('Escolha uma senha diferente da atual.');
  await limitAttempts(request,env);
  const account=await credentials(env);
  if (!await verifyPassword(current,account.password_hash)) fail('Senha atual incorreta.',401);
  const salt=newToken();
  await changeCredentials(env,account,username,salt+':'+await passwordHash(next,salt));
  const response=json({success:true});
  response.headers.set('set-cookie',sessionCookie('',0));
  return response;
}
