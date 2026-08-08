import { responseJson } from './response.js';
const $ = s => document.querySelector(s);
const format = value => value ? new Date(value).toLocaleString(localStorage.getItem('depthlume.locale') || 'uk') : '—';
async function load() {
  const data = await responseJson(await fetch('/api/billing/status'), 'Не вдалося отримати стан підписки.'); const s = data.subscription;
  if (!s) { $('[data-summary]').textContent = 'Почніть безкоштовний 7-денний період. Картка не потрібна.'; return; }
  $('[data-summary]').textContent = `Тип доступу: ${s.access_type}. Статус: ${s.billing_status}. Дійсна до: ${format(s.expires_at)}. Оплата: 3 USDT у мережі TRC20.`;
  $('[data-start]').hidden = true; $('[data-cancel]').hidden = Boolean(s.cancel_at_period_end); $('[data-pay]').hidden = false;
}
$('[data-start]').addEventListener('click', async () => { const button = $('[data-start]'); button.disabled = true; try { const result = await responseJson(await fetch('/api/billing/start-trial', { method: 'POST' }), 'Не вдалося почати пробний період.'); $('[data-key-value]').textContent = result.activationKey; $('[data-key]').hidden = false; $('[data-status]').textContent = `Trial активний до ${format(result.trialEndsAt)}. Завантажте програму та введіть ключ активації.`; } catch (error) { $('[data-status]').textContent = error.message; button.disabled = false; } });
$('[data-pay]').addEventListener('click', async () => {
  const button = $('[data-pay]'); button.disabled = true;
  try {
    const result = await responseJson(await fetch('/api/billing/create-invoice', { method: 'POST' }), 'Не вдалося підготувати оплату.');
    const area = $('[data-payment-link]'); area.replaceChildren();
    const title = document.createElement('strong'); title.textContent = 'Оплата підготовлена — надішліть кошти за цими реквізитами:';
    const network = document.createElement('p'); network.innerHTML = '<strong>Монета:</strong> USDT &nbsp; <strong>Мережа:</strong> TRC20';
    const sum = document.createElement('p'); sum.innerHTML = `<strong>Сума:</strong> ${result.amount} USDT`;
    const label = document.createElement('p'); label.innerHTML = '<strong>Адреса для переказу:</strong>';
    const address = document.createElement('code'); address.className = 'payment-address'; address.textContent = result.address;
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'button button--secondary'; copy.textContent = 'Копіювати адресу';
    copy.addEventListener('click', async () => { await navigator.clipboard.writeText(result.address); copy.textContent = 'Адресу скопійовано'; });
    const qr = document.createElement('img'); qr.width = 220; qr.height = 220; qr.alt = 'QR-код адреси USDT TRC20'; qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(result.address)}`;
    const note = document.createElement('p'); note.textContent = 'У гаманці або на біржі виберіть USDT → TRC20, відскануйте QR-код або вставте адресу. Після підтвердження NOWPayments доступ продовжиться автоматично.';
    area.append(title, network, sum, label, address, copy, qr, note); area.hidden = false;
    $('[data-status]').textContent = 'Реквізити створено. Не закривайте сторінку до завершення переказу.';
  } catch (error) { $('[data-status]').textContent = error.message; button.disabled = false; }
});
$('[data-cancel]').addEventListener('click', async () => { if (!confirm('Вимкнути нагадування про наступну оплату? Кошти не списуються автоматично.')) return; const result = await responseJson(await fetch('/api/billing/cancel', { method: 'POST' }), 'Не вдалося оновити підписку.'); $('[data-status]').textContent = result.message; await load(); });
load().catch(error => { $('[data-status]').textContent = error.message; });
