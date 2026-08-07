import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json } from '../../_lib/http';
export const onRequestGet: PagesFunction<Env> = async ({request,env}) => json({ok:true,user:await currentUser(request,env)});

