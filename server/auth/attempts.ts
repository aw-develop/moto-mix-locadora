import type { BackendEnvironment } from '../models/environment.ts';
import { digest } from './password.ts';
import { fail } from '../http/errors.ts';
export async function limitAttempts(request: Request, env: BackendEnvironment): Promise<string> {
  const key=await digest(request.headers.get('cf-connecting-ip') || 'unknown');
  const now=Date.now(), windowStart=now-15*60*1000;
  const [attempts] = await env.DB.batch<{attempts:number}>([
    env.DB.prepare('INSERT INTO login_attempts (key, attempts, window_start) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts = CASE WHEN window_start < ? THEN 1 ELSE attempts + 1 END, window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END RETURNING attempts').bind(key,now,windowStart,windowStart),
    env.DB.prepare('DELETE FROM login_attempts WHERE window_start < ?').bind(now-24*60*60*1000),
  ]);
  if ((attempts?.results[0]?.attempts || 0) > 10) fail('Muitas tentativas. Aguarde 15 minutos e tente novamente.',429);
  return key;
}
