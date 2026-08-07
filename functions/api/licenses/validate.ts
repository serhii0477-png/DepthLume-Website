import type { Env } from '../../_lib/types';
import { json, readJson } from '../../_lib/http';
import { text } from '../../_lib/validation';
import { rateLimit } from '../../_lib/rate-limit';
import { issueDesktopSession, licenseCode, RADAR_PRODUCT, responseBody, usable } from '../../_lib/licenses';
import type { LicenseRow } from '../../_lib/licenses';
import { sha256 } from '../../_lib/security';

type SessionRow = LicenseRow & { activation_id: string; device_id_hash: string };
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try { await rateLimit(request, env, 'license-validate', 60, 3600); }
  catch { return licenseCode('rate_limited', 429); }
  try {
    const body = await readJson<Record<string, unknown>>(request);
    const token = text(body.token, 'token', 20, 300);
    const deviceId = text(body.device_id, 'device_id', 16, 180);
    const appVersion = text(body.app_version, 'app_version', 1, 60);
    const now = new Date().toISOString();
    const row = await env.DB.prepare(`SELECT l.id license_id,l.user_id,u.email,u.email_verified,u.access_status,l.type,l.status license_status,l.starts_at,l.expires_at,l.max_devices,'active' key_status,a.id activation_id,a.device_id_hash FROM desktop_sessions s JOIN device_activations a ON a.id=s.device_activation_id JOIN licenses l ON l.id=a.license_id JOIN users u ON u.id=l.user_id WHERE s.token_hash=?1 AND s.expires_at>?2 AND s.revoked_at IS NULL AND a.revoked_at IS NULL AND l.product=?3 LIMIT 1`).bind(await sha256(token), now, RADAR_PRODUCT).first<SessionRow>();
    if (!row || row.device_id_hash !== await sha256(deviceId)) return licenseCode('invalid_token', 401);
    const state = usable(row, now); if (state) return licenseCode(state, 403);
    await env.DB.prepare('UPDATE device_activations SET last_seen_at=?1,app_version=?2 WHERE id=?3').bind(now, appVersion, row.activation_id).run();
    const next = await issueDesktopSession(env, row.user_id, row.activation_id, now);
    return json(responseBody(row, next));
  } catch { return licenseCode('invalid_request'); }
};
