import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json, messageFromError } from '../../_lib/http';
import { licenseKey, RADAR_PRODUCT } from '../../_lib/licenses';
import { sha256 } from '../../_lib/security';
import { sendAccessEmail } from '../../_lib/email';

const activationEmail = (key: string, trialEndsAt: string, billingUrl: string) => `
  <h1>Ваш ключ DepthLume Radar</h1>
  <p>Вітаємо! Ваш безкоштовний період активний до <strong>${new Date(trialEndsAt).toLocaleDateString('uk-UA')}</strong>.</p>
  <p>Ваш постійний ключ активації:</p>
  <p><code style="display:inline-block;padding:12px;background:#f3f6fa;border:1px solid #cbd5e1;font-size:16px">${key}</code></p>
  <p>Встановіть DepthLume Radar і введіть цей ключ. Для продовження доступу використовуйте <a href="${billingUrl}">кабінет підписки</a>.</p>
  <p>Не передавайте ключ іншим людям. Він прив'язаний до вашого акаунта.</p>`;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: 'Потрібно увійти до акаунту.' }, 401);
    if (!user.emailVerified) return json({ ok: false, error: 'Спочатку підтвердьте email.' }, 403);
    const used = await env.DB.prepare("SELECT id FROM licenses WHERE user_id=?1 AND product=?2 AND trial_used_at IS NOT NULL LIMIT 1").bind(user.id, RADAR_PRODUCT).first();
    if (used) return json({ ok: false, error: 'Пробний період уже був використаний.' }, 409);
    const now = new Date(); const nowIso = now.toISOString(); const trialEnd = new Date(now.getTime() + 7 * 86400000).toISOString(); const id = crypto.randomUUID(); const activationKey = licenseKey();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO licenses(id,user_id,product,type,status,starts_at,expires_at,max_devices,created_at,updated_at,access_type,billing_status,cancel_at_period_end,trial_used_at) VALUES(?1,?2,?3,'DepthLume Radar Trial','active',?4,?5,1,?4,?4,'trial','trialing',0,?4)").bind(id, user.id, RADAR_PRODUCT, nowIso, trialEnd),
      env.DB.prepare('INSERT INTO license_keys(id,license_id,key_prefix,key_hash,created_at) VALUES(?1,?2,?3,?4,?5)').bind(crypto.randomUUID(), id, activationKey.slice(0, 7), await sha256(activationKey), nowIso),
      env.DB.prepare('UPDATE users SET commercial_enabled_at=COALESCE(commercial_enabled_at,?1),updated_at=?1 WHERE id=?2').bind(nowIso, user.id),
    ]);
    const billingUrl = `${env.APP_URL || new URL(request.url).origin}/account/billing/`;
    const emailSent = await sendAccessEmail(env, user.email, 'Ваш ключ активації DepthLume Radar', activationEmail(activationKey, trialEnd, billingUrl));
    return json({ ok: true, activationKey, trialEndsAt: trialEnd, emailSent });
  } catch (error) { return json({ ok: false, error: messageFromError(error) || 'Не вдалося почати пробний період.' }, 400); }
};
