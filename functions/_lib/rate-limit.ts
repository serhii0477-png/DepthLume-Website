import type { Env } from './types';
import { clientIp, publicError } from './http';

export async function rateLimit(request: Request, env: Env, action: string, limit: number, windowSeconds: number): Promise<void> {
  const key = clientIp(request);
  const since = Math.floor(Date.now() / 1000) - windowSeconds;
  const count = await env.DB.prepare('SELECT COUNT(*) AS count FROM rate_limits WHERE action=?1 AND client_key=?2 AND created_at>?3')
    .bind(action, key, since).first<{ count: number }>();
  if ((count?.count || 0) >= limit) throw publicError('Забагато спроб. Спробуйте пізніше.');
  await env.DB.batch([
    env.DB.prepare('INSERT INTO rate_limits(action,client_key,created_at) VALUES(?1,?2,?3)').bind(action, key, Math.floor(Date.now() / 1000)),
    env.DB.prepare('DELETE FROM rate_limits WHERE created_at<?1').bind(Math.floor(Date.now() / 1000) - 86400),
  ]);
}

