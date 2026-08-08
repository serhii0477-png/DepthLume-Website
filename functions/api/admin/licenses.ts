import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json, messageFromError, publicError, readJson } from '../../_lib/http';
import { optionalText, text } from '../../_lib/validation';
import { licenseKey, RADAR_PRODUCT } from '../../_lib/licenses';
import { sha256 } from '../../_lib/security';

const adminOnly = async (request: Request, env: Env) => { const user = await currentUser(request, env); return user?.role === 'admin' ? user : null; };

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await adminOnly(request, env); if (!admin) return json({ ok: false, error: 'Доступ лише для адміністратора.' }, 403);
  const rows = await env.DB.prepare(`SELECT l.id,l.user_id,u.email,l.type,l.status,l.starts_at,l.expires_at,l.max_devices,l.created_at,l.access_type,l.billing_status,l.cancel_at_period_end,l.provider_subscription_id,(SELECT COUNT(*) FROM device_activations a WHERE a.license_id=l.id AND a.revoked_at IS NULL) active_devices,(SELECT COUNT(*) FROM payment_events p WHERE p.license_id=l.id) payment_events FROM licenses l JOIN users u ON u.id=l.user_id WHERE l.product=?1 ORDER BY l.created_at DESC LIMIT 100`).bind(RADAR_PRODUCT).all();
  return json({ ok: true, licenses: rows.results });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await adminOnly(request, env); if (!admin) return json({ ok: false, error: 'Доступ лише для адміністратора.' }, 403);
    const body = await readJson<Record<string, unknown>>(request);
    const email = text(body.email, 'Email', 5, 254).toLowerCase(); const now = new Date().toISOString();
    const user = await env.DB.prepare('SELECT id,email_verified,access_status FROM users WHERE email=?1 LIMIT 1').bind(email).first<{ id: string; email_verified: number; access_status: string }>();
    if (!user) throw publicError('Користувача з таким email не знайдено.');
    if (!user.email_verified || user.access_status !== 'beta') throw publicError('Спершу підтвердьте email та надайте користувачу beta-доступ.');
    const expiresAt = optionalText(body.expiresAt, 'Дата завершення', 40); if (expiresAt && Number.isNaN(Date.parse(expiresAt))) throw publicError('Некоректна дата завершення.');
    const maxDevices = Math.max(1, Math.min(10, Number(body.maxDevices || 1))); if (!Number.isInteger(maxDevices)) throw publicError('Некоректна кількість пристроїв.');
    const id = crypto.randomUUID(); const rawKey = licenseKey();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO licenses(id,user_id,product,type,status,starts_at,expires_at,max_devices,created_at,updated_at,created_by) VALUES(?1,?2,?3,?4,\'active\',?5,?6,?7,?5,?5,?8)').bind(id, user.id, RADAR_PRODUCT, optionalText(body.licenseName, 'Назва ліцензії', 80) || 'Beta', now, expiresAt ? new Date(expiresAt).toISOString() : null, maxDevices, admin.id),
      env.DB.prepare('INSERT INTO license_keys(id,license_id,key_prefix,key_hash,created_at) VALUES(?1,?2,?3,?4,?5)').bind(crypto.randomUUID(), id, rawKey.slice(0, 7), await sha256(rawKey), now),
    ]);
    return json({ ok: true, licenseKey: rawKey, message: 'Ліцензію створено. Скопіюйте ключ зараз: він більше не відображатиметься.' }, 201);
  } catch (error) { return json({ ok: false, error: messageFromError(error) }, 400); }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await adminOnly(request, env); if (!admin) return json({ ok: false, error: 'Доступ лише для адміністратора.' }, 403);
    const body = await readJson<Record<string, unknown>>(request); const id = text(body.id, 'ID ліцензії', 10, 80); const status = text(body.status, 'Статус', 5, 12);
    if (!['active', 'suspended', 'revoked'].includes(status)) throw publicError('Некоректний статус ліцензії.');
    const now = new Date().toISOString(); await env.DB.batch([env.DB.prepare('UPDATE licenses SET status=?1,updated_at=?2 WHERE id=?3 AND product=?4').bind(status, now, id, RADAR_PRODUCT), env.DB.prepare('UPDATE desktop_sessions SET revoked_at=CASE WHEN ?1=\'active\' THEN revoked_at ELSE ?2 END WHERE device_activation_id IN (SELECT id FROM device_activations WHERE license_id=?3) AND revoked_at IS NULL').bind(status, now, id)]);
    return json({ ok: true, message: 'Статус ліцензії оновлено.' });
  } catch (error) { return json({ ok: false, error: messageFromError(error) }, 400); }
};
