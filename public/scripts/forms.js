document.querySelectorAll('[data-json-form]').forEach((element) => {
  const form = element;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    const submit = form.querySelector('[type="submit"]');
    const data = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('input[type="checkbox"]').forEach((input) => { data[input.name] = input.checked; });
    const tokenParam = form.dataset.tokenParam;
    if (tokenParam) data[tokenParam] = new URLSearchParams(location.search).get(tokenParam);
    submit.disabled = true; submit.setAttribute('aria-busy','true'); if(status) status.textContent='Надсилання…';
    try { const response=await fetch(form.action,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)}); const result=await response.json(); if(!response.ok) throw new Error(result.error||'Помилка запиту.'); if(status)status.textContent=result.message||'Готово.'; const next=form.dataset.success; if(next)setTimeout(()=>location.assign(new URLSearchParams(location.search).get('next')||next),500); }
    catch(error){if(status)status.textContent=error instanceof Error?error.message:'Помилка запиту.';}
    finally{submit.disabled=false;submit.removeAttribute('aria-busy');}
  });
});

