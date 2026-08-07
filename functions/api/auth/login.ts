import type { Env } from '../../_lib/types';
import { verifyPassword } from '../../_lib/security';
import { email, text } from '../../_lib/validation';
import { createSession } from '../../_lib/auth';
import { json, messageFromError, readJson } from '../../_lib/http';
import { rateLimit } from '../../_lib/rate-limit';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    await rateLimit(request, env, 'login', 8, 900);
    const body = await readJson<Record<string, unknown>>(request);
    const row = await env.DB.prepare('SELECT id,password_hash,email_verified FROM users WHERE email=?1').bind(email(body.email)).first<{id:string,password_hash:string,email_verified:number}>();
    if (!row || !(await verifyPassword(text(body.password,'Пароль',1,128), row.password_hash))) return json({ok:false,error:'Неправильний email або пароль.'},401);
    if (!row.email_verified) return json({ok:false,error:'Спочатку підтвердьте email.'},403);
    return json({ok:true},200,{'set-cookie':await createSession(request,env,row.id)});
  } catch (error) { return json({ok:false,error:messageFromError(error)},400); }
};

