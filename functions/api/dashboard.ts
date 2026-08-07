import type { Env } from '../_lib/types';
import { currentUser } from '../_lib/auth';
import { json } from '../_lib/http';
export const onRequestGet: PagesFunction<Env> = async ({request,env}) => {const user=await currentUser(request,env);if(!user)return json({ok:false,error:'Потрібно увійти.'},401);const [application,release]=await Promise.all([env.DB.prepare('SELECT status,created_at,reviewed_at,admin_comment FROM beta_applications WHERE user_id=?1 ORDER BY created_at DESC LIMIT 1').bind(user.id).first(),env.DB.prepare('SELECT id,version,file_name,file_size,release_notes,supported_platform,is_active,updated_at FROM software_releases WHERE is_active=1 LIMIT 1').first()]);return json({ok:true,user,application,release});};

