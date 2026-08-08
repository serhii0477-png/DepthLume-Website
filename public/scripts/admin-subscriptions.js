import { responseJson } from './response.js';

const cell = value => { const element = document.createElement('td'); element.textContent = value ?? '—'; return element; };
const date = value => value ? new Date(value).toLocaleString(localStorage.getItem('depthlume.locale') || 'uk') : '—';

async function loadSubscriptions() {
  const body = document.querySelector('[data-subscriptions]');
  if (!body) return;
  const data = await responseJson(await fetch('/api/admin/licenses'), 'Не вдалося завантажити підписки.');
  body.replaceChildren();
  for (const subscription of data.licenses || []) {
    const row = document.createElement('tr');
    for (const value of [subscription.email, subscription.access_type || subscription.type, subscription.billing_status || subscription.status, date(subscription.expires_at), subscription.cancel_at_period_end ? 'Вимкнено' : 'Увімкнено', subscription.active_devices]) row.append(cell(value));
    body.append(row);
  }
}

loadSubscriptions().catch(error => { const status = document.querySelector('[data-admin-status]'); if (status) status.textContent = error.message; });
