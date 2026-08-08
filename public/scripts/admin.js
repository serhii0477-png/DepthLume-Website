import { responseJson } from './response.js';
const locale=localStorage.getItem('depthlume.locale')||'uk';
const texts={uk:{title:'Адмінпанель',description:'Керуйте beta-доступом, заявками, релізами, ліцензіями та журналом завантажень.',filters:'Фільтри',usersRequests:'Користувачі та заявки',refresh:'Оновити',search:'Email або ім’я',status:'Статус',user:'Користувач',granted:'Наданий доступ / ліцензія',date:'Дата',actions:'Дії',apps:['Усі заявки','Очікує розгляду','Схвалено','У списку очікування','Відхилено','Відкликано'],accesses:['Усі доступи','Немає доступу','Очікує розгляду','Beta-доступ надано','У списку очікування','Доступ відкликано'],app:{pending:'Очікує розгляду',approved:'Схвалено',rejected:'Відхилено',waitlist:'У списку очікування',withdrawn:'Відкликано',none:'Заявки немає'},access:{none:'Немає доступу',pending:'Очікує розгляду',beta:'Beta-доступ надано',waitlist:'У списку очікування',revoked:'Доступ відкликано'},approve:'Схвалити',waitlist:'До списку очікування',reject:'Відхилити',revoke:'Відкликати доступ',archive:'Архівувати',restore:'Відновити',loading:'Завантаження…',empty:'Немає користувачів для вибраних фільтрів.',stats:['Користувачі','Очікують розгляду','Beta-доступ','Список очікування']}};const t=texts[locale]||texts.uk;
const $=s=>document.querySelector(s),cell=v=>{const e=document.createElement('td');e.textContent=v??'—';return e},date=v=>v?new Date(v).toLocaleDateString(locale):'—';
function setup(){document.title=`${t.title} — DepthLume`;$('.portal-heading h1').textContent=t.title;$('.portal-heading p').textContent=t.description;document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t[e.dataset.i18n]||'');const search=$('[data-i18n-placeholder]');search.placeholder=t.search;const opts=(el,values,labels)=>el.replaceChildren(...values.map((v,i)=>{const o=document.createElement('option');o.value=v;o.textContent=labels[i];return o}));opts($('[name=applicationStatus]'),['','pending','approved','waitlist','rejected','withdrawn'],t.apps);opts($('[name=accessStatus]'),['','none','pending','beta','waitlist','revoked'],t.accesses);opts($('[name=archive]'),['','archived'],['Активні записи','Архівовані записи']);}
function button(parent,label,action,item){const b=document.createElement('button');b.className='table-action';b.type='button';b.textContent=label;b.dataset.action=action;b.dataset.userId=item.id||item.user_id;b.dataset.applicationId=item.application_id||item.id;b.dataset.email=item.email;parent.append(b)}
async function load(){const status=$('[data-admin-status]');status.textContent=t.loading;const r=await fetch(`/api/admin/dashboard?${new URLSearchParams(new FormData($('[data-filters]')))}`);if(r.status===403){location.assign('/account/');return}const data=await responseJson(r,'Не вдалося завантажити адмінпанель.');const stats=$('[data-stats]');stats.replaceChildren();[[t.stats[0],data.stats.totalUsers],[t.stats[1],data.stats.pending],[t.stats[2],`${data.stats.beta} / ${data.stats.betaLimit}`],[t.stats[3],data.stats.waitlist]].forEach(([l,v])=>{const a=document.createElement('article'),s=document.createElement('span'),b=document.createElement('strong');s.textContent=l;b.textContent=v;a.append(s,b);stats.append(a)});const body=$('[data-applications]');body.replaceChildren();const users=data.users||data.applications||[];if(!users.length){const row=document.createElement('tr'),c=cell(t.empty);c.colSpan=5;row.append(c);body.append(row)}users.forEach(item=>{const row=document.createElement('tr'),who=cell(item.email),small=document.createElement('small');small.textContent=item.name;who.prepend(small,document.createElement('br'));const state=document.createElement('td');state.append(t.app[item.application_status||item.status||'none'],document.createElement('br'),t.access[item.access_status]||'—');const grant=cell(item.active_license_type?`${item.active_license_type} · active`:item.access_status==='beta'?t.access.beta:'—');const actions=document.createElement('td');if(item.archived_at)button(actions,t.restore,'restore',item);else{button(actions,t.approve,'approve',item);button(actions,t.waitlist,'waitlist',item);button(actions,t.reject,'reject',item);button(actions,t.revoke,'revoke',item);button(actions,t.archive,'archive',item)}row.append(who,state,grant,cell(date(item.application_created_at||item.created_at)),actions);body.append(row)});status.textContent=''}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const archive=['archive','restore'].includes(b.dataset.action);if(archive&&b.dataset.action==='archive'&&!confirm(`Архівувати ${b.dataset.email}? Користувача можна буде відновити.`))return;b.disabled=true;try{const result=await responseJson(await fetch(archive?'/api/admin/users':'/api/admin/access',{method:archive?'PATCH':'POST',headers:{'content-type':'application/json'},body:JSON.stringify(archive?{userId:b.dataset.userId,action:b.dataset.action}:{userId:b.dataset.userId,applicationId:b.dataset.applicationId,action:b.dataset.action})}),'Помилка');$('[data-admin-status]').textContent=result.message||'Готово.';await load()}catch(x){$('[data-admin-status]').textContent=x.message}finally{b.disabled=false}});$('[data-refresh]').addEventListener('click',load);$('[data-filters]').addEventListener('change',load);setup();load().catch(e=>{$('[data-admin-status]').textContent=e.message});

// Private release upload was intentionally kept separate from the dashboard
// refresh. It uploads straight from the browser to R2, so large archives do
// not pass through a Pages Function and the progress bar remains accurate.
const releaseText = {
  releases: 'Релізи програми', addRelease: 'Завантажити новий архів', version: 'Версія', platform: 'Платформа',
  releaseNotes: 'Опис змін', releaseFile: 'Файл EXE, MSI або ZIP', makeActive: 'Зробити активним',
  uploadPrivate: 'Завантажити приватно', checkR2: 'Перевірити R2', file: 'Файл', downloads: 'Завантажень',
};
function releaseCell(value) { const td = document.createElement('td'); td.textContent = value ?? '—'; return td; }
function renderReleases(items) {
  const target = $('[data-releases]'); if (!target) return;
  target.replaceChildren();
  if (!items?.length) { const row = document.createElement('tr'); const empty = releaseCell('Релізів ще немає.'); empty.colSpan = 5; row.append(empty); target.append(row); return; }
  items.forEach(item => {
    const row = document.createElement('tr');
    row.append(releaseCell(item.version), releaseCell(item.file_name), releaseCell(item.download_count), releaseCell(item.is_active ? 'Активний' : 'Неактивний'));
    const actions = document.createElement('td');
    if (!item.is_active) {
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'table-action'; remove.textContent = 'Видалити'; remove.dataset.releaseDelete = item.id; remove.disabled = Number(item.download_count) > 0; actions.append(remove);
    } else actions.textContent = '—';
    row.append(actions); target.append(row);
  });
}
async function releaseApi(url, options, fallback = 'Не вдалося виконати дію з релізом.') { return responseJson(await fetch(url, options), fallback); }
function directUpload(url, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest(); xhr.open('PUT', url); xhr.setRequestHeader('content-type', contentType);
    xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onerror = () => reject(new Error('Не вдалося завантажити файл у приватне сховище. Перевірте з’єднання та повторіть спробу.'));
    xhr.onabort = () => reject(new Error('Завантаження перервано. Почніть ще раз.'));
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 відхилив завантаження (${xhr.status || 'мережева помилка'}).`));
    xhr.send(file);
  });
}
async function refreshReleases() {
  const data = await releaseApi(`/api/admin/dashboard?${new URLSearchParams(new FormData($('[data-filters]')))}`, undefined, 'Не вдалося оновити список релізів.');
  renderReleases(data.releases || []);
}
document.querySelectorAll('[data-i18n]').forEach(element => { if (releaseText[element.dataset.i18n]) element.textContent = releaseText[element.dataset.i18n]; });
$('[data-r2-diagnostic]')?.addEventListener('click', async event => {
  const button = event.currentTarget; const status = $('[data-release-form] .form-status'); button.disabled = true; status.textContent = 'Перевірка R2…';
  try { status.textContent = (await releaseApi('/api/admin/releases/diagnostic', { method: 'POST' })).message; } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
});
$('[data-release-form]')?.addEventListener('submit', async event => {
  event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('.form-status'); const button = form.querySelector('[type=submit]'); const progress = form.querySelector('[data-release-progress]'); const file = form.elements.file.files?.[0];
  if (!file) { status.textContent = 'Оберіть файл релізу.'; return; }
  button.disabled = true; progress.hidden = false; progress.value = 0;
  try {
    const authorization = await releaseApi('/api/admin/releases/upload', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileSize: file.size, version: form.elements.version.value, supportedPlatform: form.elements.supportedPlatform.value, releaseNotes: form.elements.releaseNotes.value, isActive: form.elements.isActive.checked }) });
    status.textContent = 'Завантаження… 0%';
    await directUpload(authorization.uploadUrl, file, authorization.headers['content-type'], percent => { progress.value = percent; status.textContent = `Завантаження… ${percent}%`; });
    status.textContent = 'Публікація релізу…';
    await releaseApi('/api/admin/releases/finalize', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ uploadId: authorization.uploadId }) });
    progress.value = 100; status.textContent = 'Реліз приватно завантажено та опубліковано.'; form.reset(); await refreshReleases();
  } catch (error) { status.textContent = error.message || 'Не вдалося завантажити реліз.'; } finally { button.disabled = false; }
});
document.addEventListener('click', async event => {
  const remove = event.target.closest('[data-release-delete]'); if (!remove) return;
  if (!confirm('Безповоротно видалити цей неактивний реліз?')) return;
  remove.disabled = true;
  try { await releaseApi('/api/admin/releases', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: remove.dataset.releaseDelete }) }); await refreshReleases(); }
  catch (error) { $('[data-admin-status]').textContent = error.message; } finally { remove.disabled = false; }
});
refreshReleases().catch(error => { const status = $('[data-release-form] .form-status'); if (status) status.textContent = error.message; });
