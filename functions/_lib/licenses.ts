import type { Env } from './types';
import { randomToken, sha256 } from './security';

export const RADAR_PRODUCT = 'depthlume-radar';
export const DESKTOP_TOKEN_MS = 24 * 60 * 60 * 1000;

export const licenseKey = () => `DL-${randomToken(24)}`;
export const licenseCode = (code: string, status = 400) => Response.json({ code }, { status, headers: { 'cache-control': 'no-store' } });

export type LicenseRow = { license_id: string; user_id: string; email: string; email_verified: number; access_status: string; commercial_enabled_at?: string | null; type: string; license_status: string; starts_at: string; expires_at: string | null; max_devices: number; key_status: string; access_type?: string; billing_status?: string; cancel_at_period_end?: number };

export const usable = (row: LicenseRow, now: string): string | null => {
  if (!row.email_verified) return 'email_unverified';
  // Beta users retain their present access. Commercial access is issued only
  // by the verified server-side trial/payment workflow.
  if (row.access_status !== 'beta' && !row.commercial_enabled_at) return 'no_radar_access';
  if (row.key_status !== 'active') return 'invalid_license_key';
  if (row.license_status === 'suspended') return 'suspended';
  if (row.license_status === 'revoked') return 'revoked';
  if (row.license_status !== 'active' || row.starts_at > now || (row.expires_at && row.expires_at <= now)) return 'expired';
  return null;
};

export const responseBody = (row: LicenseRow, token: string) => {
  // Licenses issued before commercial billing have no subscription metadata or
  // end date. They remain usable for beta participants, but must never be
  // presented as a paid subscription.
  const accessType = row.access_type || (row.expires_at ? 'subscription' : 'complimentary');
  const billingStatus = row.billing_status || (accessType === 'complimentary' ? 'complimentary' : 'active');
  return { status: 'active', access_token: token, owner: row.email, license_name: row.type, expires_at: row.expires_at, access_type: accessType, billing_status: billingStatus, cancel_at_period_end: Boolean(row.cancel_at_period_end) };
};

export async function issueDesktopSession(env: Env, userId: string, activationId: string, now: string): Promise<string> {
  const token = randomToken();
  const expires = new Date(Date.parse(now) + DESKTOP_TOKEN_MS).toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE desktop_sessions SET revoked_at=?1 WHERE device_activation_id=?2 AND revoked_at IS NULL').bind(now, activationId),
    env.DB.prepare('INSERT INTO desktop_sessions(id,user_id,token_hash,device_activation_id,expires_at,created_at,last_seen_at) VALUES(?1,?2,?3,?4,?5,?6,?6)').bind(crypto.randomUUID(), userId, await sha256(token), activationId, expires, now),
  ]);
  return token;
}
