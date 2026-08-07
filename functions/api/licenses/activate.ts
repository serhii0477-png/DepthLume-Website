import type { Env } from '../../_lib/types';
import { json, readJson } from '../../_lib/http';
import { text } from '../../_lib/validation';
import { rateLimit } from '../../_lib/rate-limit';
import { licenseCode, RADAR_PRODUCT, responseBody, issueDesktopSession, usable } from '../../_lib/licenses';
import type { LicenseRow } from '../../_lib/licenses';
import { sha256 } from '../../_lib/security';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try { await rateLimit(request, env, 'license-activate', 10, 3600); }
  catch { return licenseCode('rate_limited', 429); }
  try {
    const body = await readJson<Record<string, unknown>>(request);
    const key = text(body.license_key, 'license_key', 12, 180);
    const deviceId = text(body.device_id, 'device_id', 16, 180);
    const appVersion = text(body.app_version, 'app_version', 1, 60);
    const row = await env.DB.prepare(`SELECT l.id license_id,l.user_id,u.email,u.email_verified,u.access_status,l.type,l.status license_status,l.starts_at,l.expires_at,l.max_devices,k.status key_status FROM license_keys k JOIN licenses l ON l.id=k.license_id JOIN users u ON u.id=l.user_id WHERE k.key_hash=?1 AND l.product=?2 LIMIT 1`).bind(await sha256(key), RADAR_PRODUCT).first<LicenseRow>();
    if (!row) return licenseCode('invalid_license_key', 401);
    const now = new Date().toISOString(); const state = usable(row, now);
    if (state) return licenseCode(state, state === 'invalid_license_key' ? 401 : 403);
    const deviceHash = await sha256(deviceId);
    const existing = await env.DB.prepare('SELECT id FROM device_activations WHERE license_id=?1 AND device_id_hash=?2 LIMIT 1').bind(row.license_id, deviceHash).first<{ id: string }>();
    let activationId = existing?.id;
    if (activationId) await env.DB.prepare('UPDATE device_activations SET revoked_at=NULL,last_seen_at=?1,app_version=?2 WHERE id=?3').bind(now, appVersion, activationId).run();
    else {
      activationId = crypto.randomUUID();
      const inserted = await env.DB.prepare(`INSERT INTO device_activations(id,license_id,user_id,device_id_hash,app_version,activated_at,last_seen_at) SELECT ?1,?2,?3,?4,?5,?6,?6 WHERE (SELECT COUNT(*) FROM device_activations WHERE license_id=?2 AND revoked_at IS NULL) < (SELECT max_devices FROM licenses WHERE id=?2)`).bind(activationId, row.license_id, row.user_id, deviceHash, appVersion, now).run();
      if (!(inserted.meta as { changes?: number }).changes) return licenseCode('device_limit_reached', 409);
    }
    const token = await issueDesktopSession(env, row.user_id, activationId, now);
    return json(responseBody(row, token));
  } catch {
    return licenseCode('invalid_request');
  }
};
