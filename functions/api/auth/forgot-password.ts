import type { Env } from '../../_lib/types';
import { email } from '../../_lib/validation';
import { json, messageFromError, readJson } from '../../_lib/http';
import { rateLimit } from '../../_lib/rate-limit';
import { randomToken, sha256 } from '../../_lib/security';
import { sendAccessEmail } from '../../_lib/email';
export const onRequestPost: PagesFunction<Env> = async ({request,env}) => { try { await rateLimit(request,env,'password-reset',5,3600); const body=await readJson<Record<string,unknown>>(request); const address=email(body.email); const user=await env.DB.prepare('SELECT id FROM users WHERE email=?1').bind(address).first<{id:string}>(); let resetUrl:string|undefined; if(user){const raw=randomToken();const now=new Date().toISOString();resetUrl=`${env.APP_URL||new URL(request.url).origin}/reset-password/?token=${encodeURIComponent(raw)}`;await env.DB.prepare("INSERT INTO auth_tokens(id,user_id,token_hash,purpose,expires_at,created_at) VALUES(?1,?2,?3,'reset_password',?4,?5)").bind(crypto.randomUUID(),user.id,await sha256(raw),new Date(Date.now()+3600000).toISOString(),now).run();await sendAccessEmail(env,address,'Відновлення пароля DepthLume',`<p>Створіть новий пароль: <a href="${resetUrl}">${resetUrl}</a></p>`);}return json({ok:true,message:'Якщо акаунт існує, інструкцію надіслано.',...(env.APP_ENV==='development'&&resetUrl?{resetUrl}:{})});}catch(error){return json({ok:false,error:messageFromError(error)},400);} };

