import type { BackendEnvironment } from '../models/environment.ts';
import { fail } from '../http/errors.ts';
export interface AdminCredentials { username: string; password_hash: string; revision: string; }
/** Private credentials never enter the public catalog snapshot. Runtime secrets bootstrap once. */
export async function credentials(env: BackendEnvironment): Promise<AdminCredentials> {
  let value = await env.DB.prepare("SELECT username,password_hash,revision FROM admin_credentials WHERE id = 'main'").first<AdminCredentials>();
  if (!value && env.ADMIN_USERNAME && env.ADMIN_PASSWORD_HASH) {
    await env.DB.batch([env.DB.prepare("INSERT OR IGNORE INTO admin_credentials (id,username,password_hash,revision) VALUES ('main',?,?,?)").bind(env.ADMIN_USERNAME,env.ADMIN_PASSWORD_HASH,crypto.randomUUID())]);
    value = await env.DB.prepare("SELECT username,password_hash,revision FROM admin_credentials WHERE id = 'main'").first<AdminCredentials>();
  }
  if (!value) fail('Acesso por senha ainda não configurado.',503);
  return value;
}
export async function changeCredentials(env: BackendEnvironment, previous: AdminCredentials, username: string, hash: string): Promise<void> {
  const revision=crypto.randomUUID();
  const [result] = await env.DB.batch([
    env.DB.prepare("UPDATE admin_credentials SET username=?,password_hash=?,revision=? WHERE id='main' AND revision=?").bind(username,hash,revision,previous.revision),
    env.DB.prepare("DELETE FROM admin_sessions WHERE EXISTS (SELECT 1 FROM admin_credentials WHERE id='main' AND revision=?)").bind(revision),
  ]);
  if (!result?.meta.changes) fail('As credenciais foram alteradas em outra sessão. Entre novamente.',409);
}
