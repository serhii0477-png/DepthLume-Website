import type { Env } from '../../_lib/types';
import { json } from '../../_lib/http';
import { validIpn } from '../../_lib/nowpayments';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const payload = await request.json<Record<string, unknown>>();
    if (!await validIpn(env.NOWPAYMENTS_IPN_SECRET, payload, request.headers.get('x-nowpayments-sig'))) return json({ ok: false }, 403);
    if (String(payload.payment_status) !== 'finished') return json({ ok: true });
    const orderId = String(payload.order_id || ''); const paymentId = String(payload.payment_id || '');
    if (!orderId || !paymentId) return json({ ok: false }, 400);
    const order = await env.DB.prepare("SELECT license_id FROM payment_orders WHERE id=?1 AND provider='nowpayments' LIMIT 1").bind(orderId).first<{ license_id: string }>();
    if (!order) return json({ ok: true });
    const license = await env.DB.prepare("SELECT id,user_id,expires_at FROM licenses WHERE id=?1 AND product='depthlume-radar' LIMIT 1").bind(order.license_id).first<{ id: string; user_id: string; expires_at: string | null }>();
    if (!license) return json({ ok: true });
    const seen = await env.DB.prepare("SELECT id FROM payment_events WHERE provider='nowpayments' AND provider_payment_id=?1 AND event_type='paid' LIMIT 1").bind(paymentId).first();
    if (seen) return json({ ok: true });
    const now = new Date(); const nowIso = now.toISOString(); const base = Math.max(now.getTime(), Date.parse(license.expires_at || nowIso)); const expiresAt = new Date(base + 30 * 86400000).toISOString();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO payment_events(id,provider,provider_payment_id,license_id,user_id,event_type,status,amount,currency,received_at) VALUES(?1,'nowpayments',?2,?3,?4,'paid','finished',?5,?6,?7)").bind(crypto.randomUUID(), paymentId, license.id, license.user_id, Number(payload.pay_amount || 0), String(payload.pay_currency || 'usdttrc20'), nowIso),
      env.DB.prepare("UPDATE licenses SET type='DepthLume Radar Monthly',status='active',access_type='subscription',billing_status='active',cancel_at_period_end=0,expires_at=?1,updated_at=?2 WHERE id=?3").bind(expiresAt, nowIso, license.id),
    ]);
    return json({ ok: true });
  } catch { return json({ ok: false }, 400); }
};
