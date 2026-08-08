import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json } from '../../_lib/http';
import { RADAR_PRODUCT } from '../../_lib/licenses';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await currentUser(request, env);
  if (!user) return json({ ok: false, error: 'Потрібно увійти до акаунту.' }, 401);
  const now = new Date().toISOString();
  await env.DB.prepare("UPDATE licenses SET cancel_at_period_end=1,billing_status='cancelled',updated_at=?1 WHERE user_id=?2 AND product=?3 AND status='active'").bind(now, user.id, RADAR_PRODUCT).run();
  return json({ ok: true, message: 'Нагадування про наступну оплату вимкнено. Кошти не списуються автоматично, а доступ лишиться до завершення поточного періоду.' });
};
