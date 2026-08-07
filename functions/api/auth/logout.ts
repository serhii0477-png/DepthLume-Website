import type { Env } from '../../_lib/types';
import { clearSessionCookie, destroySession } from '../../_lib/auth';
import { json } from '../../_lib/http';
export const onRequestPost: PagesFunction<Env> = async ({request,env}) => { await destroySession(request,env); return json({ok:true},200,{'set-cookie':clearSessionCookie(request)}); };

