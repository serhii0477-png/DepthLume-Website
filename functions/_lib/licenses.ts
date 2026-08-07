import type { Env } from './types';
import { randomToken, sha256 } from './security';

export const RADAR_PRODUCT = 'depthlume-radar';
export const DESKTOP_TOKEN_MS = 24 * 60 * 60 * 1000;

export const licenseKey = () => `DL-${randomToken(24)}`;
export const licenseCode = (code: string, status = 400) => Response.json({ code }, { status, headers: { 'cache-control': 'no-store' } });

export type LicenseRow = { license_id: string; user_id: string; email: string; email_verified: number; access_status: string; type: string; license_status: string; starts_at: string; expires_at: string | null; max_devices: number; key_status: string };

export const usable = (row: LicenseRow, now: string): string | null => {
  if (!row.email_verified) return 'email_unverified';
  if (row.access_status !== 'beta') return 'no_radar_access';
  if (row.key_status !== 'active') return 'invalid_license_key';
  if (row.license_status === 'suspended') return 'suspended';
  if (row.license_status === 'revoked') return 'revoked';
  if (row.license_status !== 'active' || row.starts_at > now || (row.expires_at && row.expires_at <= now)) return 'expired';
  return null;
};

export const responseBody = (row: LicenseRow, token: string) => ({ status: 'active', access_token: token, owner: row.email, license_name: row.type, expires_at: row.expires_at });

export async function issueDesktopSession(env: Env, userId: string, activationId: string, now: string): Promise<string> {
  const token = randomToken();
  const expires = new Date(Date.parse(now) + DESKTOP_TOKEN_MS).toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE desktop_sessions SET revoked_at=?1 WHERE device_activation_id=?2 AND revoked_at IS NULL').bind(now, activationId),
    env.DB.prepare('INSERT INTO desktop_sessions(id,user_id,token_hash,device_activation_id,expires_at,created_at,last_seen_at) VALUES(?1,?2,?3,?4,?5,?6,?6)').bind(crypto.randomUUID(), userId, await sha256(token), activationId, expires, now),
  ]);
  return token;
}
