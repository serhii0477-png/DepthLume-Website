import type { Env } from '../../_lib/types';
import { sha256 } from '../../_lib/security';
import { json, messageFromError, readJson } from '../../_lib/http';
import { text } from '../../_lib/validation';
export const onRequestPost: PagesFunction<Env> = async ({request,env}) => { try { const body=await readJson<Record<string,unknown>>(request); const hash=await sha256(text(body.token,'Токен',20,200)); const now=new Date().toISOString(); const token=await env.DB.prepare("SELECT id,user_id FROM auth_tokens WHERE token_hash=?1 AND purpose='verify_email' AND used_at IS NULL AND expires_at>?2").bind(hash,now).first<{id:string,user_id:string}>(); if(!token)return json({ok:false,error:'Посилання недійсне або прострочене.'},400); await env.DB.batch([env.DB.prepare('UPDATE users SET email_verified=1,updated_at=?1 WHERE id=?2').bind(now,token.user_id),env.DB.prepare('UPDATE auth_tokens SET used_at=?1 WHERE id=?2').bind(now,token.id)]); return json({ok:true}); } catch(error){return json({ok:false,error:messageFromError(error)},400);} };

