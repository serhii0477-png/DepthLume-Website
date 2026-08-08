import { responseJson } from './response.js';

const $ = selector => document.querySelector(selector);
const format = value => value ? new Date(value).toLocaleString(localStorage.getItem('depthlume.locale') || 'uk') : '—';

async function load() {
  const data = await responseJson(await fetch('/api/billing/status'), 'Не вдалося отримати стан підписки.');
  const subscription = data.subscription;
  if (!subscription) {
    $('[data-summary]').textContent = 'Почніть безкоштовний 7-денний період. Картка не потрібна.';
    return;
  }
  $('[data-summary]').textContent = `Доступ активний до: ${format(subscription.expires_at)}. Щоб продовжити на 30 днів, оплатіть близько 3 USDT у мережі TRC20.`;
  $('[data-start]').hidden = true;
  $('[data-cancel]').hidden = Boolean(subscription.cancel_at_period_end);
  $('[data-pay]').hidden = false;
  $('[data-pay]').textContent = 'Оплатити близько 3 USDT';
}

$('[data-start]').addEventListener('click', async () => {
  const button = $('[data-start]'); button.disabled = true;
  try {
    const result = await responseJson(await fetch('/api/billing/start-trial', { method: 'POST' }), 'Не вдалося почати пробний період.');
    $('[data-key-value]').textContent = result.activationKey;
    $('[data-key]').hidden = false;
    $('[data-status]').textContent = `Пробний період активний до ${format(result.trialEndsAt)}.${result.emailSent ? ' Ключ активації також надіслано на ваш підтверджений email.' : ' Збережіть ключ нижче.'}`;
    await load();
  } catch (error) { $('[data-status]').textContent = error.message; button.disabled = false; }
});

$('[data-pay]').addEventListener('click', async () => {
  const button = $('[data-pay]'); button.disabled = true;
  try {
    const result = await responseJson(await fetch('/api/billing/create-tron-order', { method: 'POST' }), 'Не вдалося створити платіжне замовлення.');
    const area = $('[data-payment-link]'); area.replaceChildren();
    const title = document.createElement('strong'); title.textContent = 'Оплатіть саме вказану суму протягом 30 хвилин:';
    const network = document.createElement('p'); network.innerHTML = '<strong>Монета:</strong> USDT &nbsp; <strong>Мережа:</strong> TRC20';
    const amount = document.createElement('p'); amount.innerHTML = `<strong>Сума:</strong> ${result.amount} USDT`;
    const label = document.createElement('p'); label.innerHTML = '<strong>Адреса для переказу:</strong>';
    const address = document.createElement('code'); address.className = 'payment-address'; address.textContent = result.address;
    const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'button button--secondary'; copy.textContent = 'Копіювати адресу';
    copy.addEventListener('click', async () => { await navigator.clipboard.writeText(result.address); copy.textContent = 'Адресу скопійовано'; });
    const qr = document.createElement('img'); qr.width = 220; qr.height = 220; qr.alt = 'QR-код адреси USDT TRC20'; qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(result.address)}`;
    const instructions = document.createElement('p'); instructions.textContent = 'У гаманці або на біржі виберіть USDT → TRC20, відскануйте QR-код або вставте адресу. Після відправлення скопіюйте TxID операції сюди.';
    const txid = document.createElement('input'); txid.type = 'text'; txid.placeholder = 'TxID (64 символи)'; txid.autocomplete = 'off'; txid.className = 'form-control';
    const confirm = document.createElement('button'); confirm.type = 'button'; confirm.className = 'button button--primary'; confirm.textContent = 'Я оплатив — перевірити TxID';
    confirm.addEventListener('click', async () => {
      confirm.disabled = true;
      try {
        const check = await responseJson(await fetch('/api/billing/confirm-tron-payment', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: result.orderId, txid: txid.value }) }), 'Не вдалося перевірити оплату.');
        $('[data-status]').textContent = `${check.message} Дійсна до: ${format(check.expiresAt)}.`;
        area.hidden = true;
        await load();
      } catch (error) { $('[data-status]').textContent = error.message; confirm.disabled = false; }
    });
    area.append(title, network, amount, label, address, copy, qr, instructions, txid, confirm); area.hidden = false;
    $('[data-status]').textContent = `Замовлення створено до ${format(result.expiresAt)}.`;
  } catch (error) { $('[data-status]').textContent = error.message; button.disabled = false; }
});

$('[data-cancel]').addEventListener('click', async () => {
  if (!confirm('Вимкнути нагадування про наступну оплату? Кошти не списуються автоматично.')) return;
  const result = await responseJson(await fetch('/api/billing/cancel', { method: 'POST' }), 'Не вдалося оновити підписку.');
  $('[data-status]').textContent = result.message;
  await load();
});

load().catch(error => { $('[data-status]').textContent = error.message; });
