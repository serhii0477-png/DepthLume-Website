import type { Env, SessionUser } from './types';
import { randomToken, sha256 } from './security';
import { clientIp } from './http';

const COOKIE = 'depthlume_session';

function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') || '';
  for (const item of header.split(';')) {
    const [key, ...value] = item.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

export async function currentUser(request: Request, env: Env): Promise<SessionUser | null> {
  const token = cookieValue(request, COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.access_status, u.email_verified,
           u.beta_granted_at, u.beta_revoked_at
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ?1 AND s.expires_at > ?2
  `).bind(tokenHash, new Date().toISOString()).first<Record<string, unknown>>();
  if (!row) return null;
  return {
    id: String(row.id), name: String(row.name), email: String(row.email),
    role: row.role as SessionUser['role'], accessStatus: row.access_status as SessionUser['accessStatus'],
    emailVerified: Boolean(row.email_verified), betaGrantedAt: row.beta_granted_at ? String(row.beta_granted_at) : null,
    betaRevokedAt: row.beta_revoked_at ? String(row.beta_revoked_at) : null,
  };
}

export async function createSession(request: Request, env: Env, userId: string): Promise<string> {
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await env.DB.prepare(`INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at,ip_address,user_agent) VALUES (?1,?2,?3,?4,?5,?6,?7)`)
    .bind(crypto.randomUUID(), userId, await sha256(token), expires.toISOString(), now.toISOString(), clientIp(request), request.headers.get('user-agent')).run();
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}

export async function destroySession(request: Request, env: Env): Promise<void> {
  const token = cookieValue(request, COOKIE);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?1').bind(await sha256(token)).run();
}

export const clearSessionCookie = (request: Request) => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;

