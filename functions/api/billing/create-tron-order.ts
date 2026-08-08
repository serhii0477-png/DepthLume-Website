import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json } from '../../_lib/http';
import { RADAR_PRODUCT } from '../../_lib/licenses';
import { DEPTHLUME_USDT_TRC20_WALLET } from '../../_lib/tron';

const MIN_AMOUNT = 3_000_001;
const RANGE = 9_999;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ ok: false, error: 'Потрібно увійти до акаунту.' }, 401);
    const license = await env.DB.prepare("SELECT id FROM licenses WHERE user_id=?1 AND product=?2 AND status='active' ORDER BY created_at DESC LIMIT 1").bind(user.id, RADAR_PRODUCT).first<{ id: string }>();
    if (!license) return json({ ok: false, error: 'Активну ліцензію не знайдено.' }, 404);
    const now = new Date(); const nowIso = now.toISOString(); const expiresAt = new Date(now.getTime() + 30 * 60_000).toISOString();
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const random = new Uint32Array(1); crypto.getRandomValues(random);
      const expectedAmountRaw = MIN_AMOUNT + (random[0] % RANGE);
      const used = await env.DB.prepare("SELECT id FROM payment_orders WHERE provider='tron' AND expected_amount_raw=?1 AND expires_at>?2 AND payment_txid IS NULL LIMIT 1").bind(expectedAmountRaw, nowIso).first();
      if (used) continue;
      const id = `tron-${crypto.randomUUID()}`;
      await env.DB.prepare('INSERT INTO payment_orders(id,provider,license_id,user_id,created_at,expected_amount_raw,expires_at) VALUES(?1,?2,?3,?4,?5,?6,?7)').bind(id, 'tron', license.id, user.id, nowIso, expectedAmountRaw, expiresAt).run();
      return json({ ok: true, orderId: id, address: DEPTHLUME_USDT_TRC20_WALLET, amount: (expectedAmountRaw / 1_000_000).toFixed(6), expiresAt });
    }
    return json({ ok: false, error: 'Не вдалося зарезервувати суму. Спробуйте ще раз.' }, 503);
  } catch { return json({ ok: false, error: 'Не вдалося створити платіжне замовлення.' }, 400); }
};
