import type { Env } from '../../_lib/types';
import { json, readJson } from '../../_lib/http';
import { text } from '../../_lib/validation';
import { rateLimit } from '../../_lib/rate-limit';
import { licenseCode } from '../../_lib/licenses';
import { sha256 } from '../../_lib/security';

type Session = { id: string; activation_id: string; device_id_hash: string };
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try { await rateLimit(request, env, 'license-deactivate', 10, 3600); }
  catch { return licenseCode('rate_limited', 429); }
  try {
    const body = await readJson<Record<string, unknown>>(request);
    const token = text(body.token, 'token', 20, 300); const deviceId = text(body.device_id, 'device_id', 16, 180); const now = new Date().toISOString();
    const session = await env.DB.prepare('SELECT s.id,a.id activation_id,a.device_id_hash FROM desktop_sessions s JOIN device_activations a ON a.id=s.device_activation_id WHERE s.token_hash=?1 AND s.expires_at>?2 AND s.revoked_at IS NULL LIMIT 1').bind(await sha256(token), now).first<Session>();
    if (!session || session.device_id_hash !== await sha256(deviceId)) return licenseCode('invalid_token', 401);
    await env.DB.batch([env.DB.prepare('UPDATE desktop_sessions SET revoked_at=?1 WHERE device_activation_id=?2 AND revoked_at IS NULL').bind(now, session.activation_id), env.DB.prepare('UPDATE device_activations SET revoked_at=?1 WHERE id=?2').bind(now, session.activation_id)]);
    return json({ status: 'ok' });
  } catch { return licenseCode('invalid_request'); }
};
