import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json, publicError, readJson } from '../../_lib/http';
import { findConfirmedUsdtTrc20Transfer } from '../../_lib/tron';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: 'Потрібно увійти до акаунту.' }, 401);
    const { orderId, txid } = await readJson<{ orderId?: string; txid?: string }>(request);
    const transactionId = String(txid || '').trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(transactionId)) throw publicError('Вставте повний TxID із 64 символів.');
    const order = await env.DB.prepare("SELECT id,license_id,expected_amount_raw FROM payment_orders WHERE id=?1 AND provider='tron' AND user_id=?2 AND expires_at>?3 AND payment_txid IS NULL LIMIT 1").bind(String(orderId || ''), user.id, new Date().toISOString()).first<{ id: string; license_id: string; expected_amount_raw: number }>();
    if (!order) throw publicError('Термін цього платіжного замовлення завершився. Створіть нове й надішліть саме вказану суму.');
    const alreadyUsed = await env.DB.prepare("SELECT id FROM payment_events WHERE provider='tron' AND provider_payment_id=?1 LIMIT 1").bind(transactionId).first();
    if (alreadyUsed) throw publicError('Цей TxID уже був використаний для оплати.');
    const transfer = await findConfirmedUsdtTrc20Transfer(env, transactionId);
    if (!transfer || transfer.rawAmount !== order.expected_amount_raw) throw publicError('Переказ ще не підтверджено або сума не збігається з вашим замовленням. Зачекайте 1–3 хвилини й спробуйте знову.');
    const license = await env.DB.prepare("SELECT id,user_id,expires_at FROM licenses WHERE id=?1 AND status='active' LIMIT 1").bind(order.license_id).first<{ id: string; user_id: string; expires_at: string | null }>();
    if (!license) throw publicError('Ліцензію не знайдено.');
    const now = new Date(); const nowIso = now.toISOString(); const base = Math.max(now.getTime(), Date.parse(license.expires_at || nowIso)); const expiresAt = new Date(base + 30 * 86400000).toISOString();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO payment_events(id,provider,provider_payment_id,license_id,user_id,event_type,status,amount,currency,received_at) VALUES(?1,'tron',?2,?3,?4,'paid','finished',?5,'usdttrc20',?6)").bind(crypto.randomUUID(), transactionId, license.id, license.user_id, order.expected_amount_raw / 1_000_000, nowIso),
      env.DB.prepare('UPDATE payment_orders SET payment_txid=?1 WHERE id=?2').bind(transactionId, order.id),
      env.DB.prepare("UPDATE licenses SET type='DepthLume Radar Monthly',access_type='subscription',billing_status='active',cancel_at_period_end=0,expires_at=?1,updated_at=?2 WHERE id=?3").bind(expiresAt, nowIso, license.id),
    ]);
    return json({ ok: true, expiresAt, message: 'Оплату підтверджено. Доступ продовжено на 30 днів.' });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith('PUBLIC:') ? error.message.slice(7) : 'Не вдалося перевірити TxID. Спробуйте ще раз через кілька хвилин.';
    return json({ ok: false, error: message }, 400);
  }
};
