import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json, messageFromError } from '../../_lib/http';
import { RADAR_PRODUCT } from '../../_lib/licenses';
import { createPayment, updateMerchantEstimate } from '../../_lib/nowpayments';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: 'Потрібно увійти до акаунту.' }, 401);
    const license = await env.DB.prepare("SELECT id FROM licenses WHERE user_id=?1 AND product=?2 AND status='active' ORDER BY created_at DESC LIMIT 1").bind(user.id, RADAR_PRODUCT).first<{ id: string }>();
    if (!license) return json({ ok: false, error: 'Активну ліцензію не знайдено.' }, 404);
    const origin = env.APP_URL || new URL(request.url).origin;
    const orderId = `dl-${crypto.randomUUID()}`;
    const payment = await createPayment(env, {
      price_amount: 3,
      price_currency: 'usd',
      pay_currency: 'usdttrc20',
      order_id: orderId,
      order_description: 'DepthLume Radar — 30 days',
      ipn_callback_url: `${origin}/api/billing/nowpayments-webhook`,
      is_fixed_rate: true,
    });
    if (!payment.pay_address || !payment.payment_id) throw new Error('provider_response_missing_payment_details');
    const estimate = payment.pay_amount ? payment : await updateMerchantEstimate(env, payment.payment_id);
    if (!estimate.pay_amount) throw new Error('provider_response_missing_payment_details');
    await env.DB.prepare('INSERT INTO payment_orders(id,provider,license_id,user_id,created_at) VALUES(?1,?2,?3,?4,?5)').bind(orderId, 'nowpayments', license.id, user.id, new Date().toISOString()).run();
    return json({ ok: true, paymentId: payment.payment_id, address: payment.pay_address, amount: estimate.pay_amount, currency: estimate.pay_currency || payment.pay_currency || 'usdttrc20', expiresAt: estimate.expiration_estimate_date || payment.expiration_estimate_date || null });
  } catch (error) {
    const reason = error instanceof Error ? error.message : messageFromError(error);
    console.log(JSON.stringify({ event: 'nowpayments_create_failed', reason: reason.slice(0, 180) }));
    const message = reason === 'billing_not_configured'
      ? 'Оплату ще не налаштовано.'
      : reason.startsWith('provider_')
        ? `NOWPayments відхилив створення платежу (${reason.replace('provider_', '')}). Перевірте налаштування гаманця в NOWPayments.`
        : 'Не вдалося створити крипторахунок.';
    return json({ ok: false, error: message }, 400);
  }
};
