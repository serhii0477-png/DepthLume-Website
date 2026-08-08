const locale = localStorage.getItem('depthlume.locale') || 'uk';
const copy = {
  uk: { eyebrow: 'DepthLume Radar', title: 'Підписка та оплата', text: 'Керуйте 7-денним пробним періодом, терміном доступу та оплатою 3 USDT.', button: 'Відкрити підписку' },
  ru: { eyebrow: 'DepthLume Radar', title: 'Подписка и оплата', text: 'Управляйте 7-дневным пробным периодом, сроком доступа и оплатой 3 USDT.', button: 'Открыть подписку' },
  en: { eyebrow: 'DepthLume Radar', title: 'Subscription and billing', text: 'Manage your 7-day trial, access period, and 3 USDT payment.', button: 'Open subscription' },
};
const text = copy[locale] || copy.en;
const dashboard = document.querySelector('[data-dashboard]');
if (dashboard && !document.querySelector('[data-billing-link]')) {
  const card = document.createElement('section'); card.className = 'portal-card'; card.dataset.billingLink = '';
  const eyebrow = document.createElement('span'); eyebrow.className = 'eyebrow'; eyebrow.textContent = text.eyebrow;
  const title = document.createElement('h2'); title.textContent = text.title;
  const description = document.createElement('p'); description.textContent = text.text;
  const actions = document.createElement('div'); actions.className = 'portal-actions';
  const link = document.createElement('a'); link.className = 'button button--primary'; link.href = '/account/billing/'; link.textContent = text.button;
  actions.append(link); card.append(eyebrow, title, description, actions); dashboard.append(card);
}
