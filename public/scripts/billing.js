import { responseJson } from './response.js';
const $ = s => document.querySelector(s);
let checkout = null;
const format = value => value ? new Date(value).toLocaleString(localStorage.getItem('depthlume.locale') || 'uk') : '—';
async function load() {
  const data = await responseJson(await fetch('/api/billing/status'), 'Не вдалося отримати стан підписки.');
  const s = data.subscription;
  if (!s) { $('[data-summary]').textContent = 'Щоб почати користування, натисніть «Почати 7 днів безкоштовно». Картка потрібна лише для майбутнього автоматичного платежу; протягом trial кошти не списуються.'; return; }
  const renewal = s.cancel_at_period_end ? 'Автоподовження вимкнено.' : 'Автоподовження увімкнено.';
  $('[data-summary]').textContent = `Тип доступу: ${s.access_type}. Статус: ${s.billing_status}. Дійсна до: ${format(s.expires_at)}. ${renewal}`;
  $('[data-start]').hidden = true;
  $('[data-cancel]').hidden = Boolean(s.cancel_at_period_end) || !s.provider_subscription_id;
}
$('[data-start]').addEventListener('click', async () => {
  const button = $('[data-start]'); button.disabled = true; $('[data-status]').textContent = 'Створюємо безпечну сторінку LiqPay…';
  try {
    const result = await responseJson(await fetch('/api/billing/start-trial', { method: 'POST' }), 'Не вдалося почати пробний період.');
    checkout = result.checkout; $('[data-key-value]').textContent = result.activationKey; $('[data-key]').hidden = false;
    $('[data-status]').textContent = `Trial триватиме до ${format(result.trialEndsAt)}. Після переходу додайте картку на сторінці LiqPay — кошти зараз не списуються.`;
  } catch (error) { $('[data-status]').textContent = error.message; button.disabled = false; }
});
$('[data-checkout]').addEventListener('click', () => {
  if (!checkout) return;
  const form = document.createElement('form'); form.method = 'POST'; form.action = checkout.action;
  for (const [name, value] of Object.entries({ data: checkout.data, signature: checkout.signature })) { const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = value; form.append(input); }
  document.body.append(form); form.submit();
});
$('[data-cancel]').addEventListener('click', async () => {
  if (!confirm('Вимкнути майбутні автоматичні списання? Доступ залишиться до завершення поточного періоду.')) return;
  const button = $('[data-cancel]'); button.disabled = true;
  try { const result = await responseJson(await fetch('/api/billing/cancel', { method: 'POST' }), 'Не вдалося вимкнути автоподовження.'); $('[data-status]').textContent = result.message; await load(); } catch (error) { $('[data-status]').textContent = error.message; button.disabled = false; }
});
load().catch(error => { $('[data-status]').textContent = error.message; });
