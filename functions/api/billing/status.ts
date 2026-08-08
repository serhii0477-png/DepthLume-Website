import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json } from '../../_lib/http';
import { RADAR_PRODUCT } from '../../_lib/licenses';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await currentUser(request, env);
  if (!user) return json({ ok: false, error: 'Потрібно увійти до акаунту.' }, 401);
  const subscription = await env.DB.prepare("SELECT id,type,status,expires_at,access_type,billing_status,cancel_at_period_end,provider_subscription_id,trial_used_at FROM licenses WHERE user_id=?1 AND product=?2 ORDER BY created_at DESC LIMIT 1").bind(user.id, RADAR_PRODUCT).first();
  return json({ ok: true, subscription });
};
