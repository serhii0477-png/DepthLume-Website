import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json, messageFromError, publicError, readJson } from '../../_lib/http';
import { text } from '../../_lib/validation';

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await currentUser(request, env);
    if (!admin || admin.role !== 'admin') return json({ ok:false, error:'Administrator access only.' }, 403);
    const body = await readJson<Record<string, unknown>>(request);
    const id = text(body.userId, 'User ID', 10, 80);
    const action = text(body.action, 'Action', 7, 10);
    if (!['archive', 'restore'].includes(action)) throw publicError('Unknown action.');
    const user = await env.DB.prepare(`SELECT id,email,role,access_status,archived_at,
      (SELECT status FROM beta_applications WHERE user_id=users.id ORDER BY created_at DESC LIMIT 1) application_status
      FROM users WHERE id=?1`).bind(id).first<{id:string;email:string;role:string;access_status:string;archived_at:string|null;application_status:string|null}>();
    if (!user) throw publicError('User not found.');
    if (action === 'restore') {
      if (!user.archived_at) throw publicError('User is not archived.');
      await env.DB.prepare('UPDATE users SET archived_at=NULL,archived_by=NULL,updated_at=?1 WHERE id=?2').bind(new Date().toISOString(), id).run();
      return json({ ok:true, message:'User restored.' });
    }
    if (user.role === 'admin' || ['beta', 'pending', 'waitlist'].includes(user.access_status) || ['pending', 'approved', 'waitlist'].includes(user.application_status || '')) throw publicError('Only inactive, rejected, revoked, or unused accounts can be archived.');
    const checks = await env.DB.prepare(`SELECT
      (SELECT COUNT(*) FROM licenses WHERE user_id=?1 AND status='active' AND (expires_at IS NULL OR expires_at>?2)) active_licenses,
      (SELECT COUNT(*) FROM download_logs WHERE user_id=?1) downloads,
      (SELECT COUNT(*) FROM device_activations WHERE user_id=?1 AND revoked_at IS NULL) devices,
      (SELECT COUNT(*) FROM desktop_sessions WHERE user_id=?1 AND revoked_at IS NULL AND expires_at>?2) desktop_sessions,
      (SELECT COUNT(*) FROM sessions WHERE user_id=?1 AND expires_at>?2) web_sessions,
      (SELECT COUNT(*) FROM feedback WHERE user_id=?1) feedback`).bind(id, new Date().toISOString()).first<Record<string, number>>();
    if (!checks || Object.values(checks).some(Boolean)) throw publicError('This user has active access or retained history and cannot be archived.');
    await env.DB.prepare('UPDATE users SET archived_at=?1,archived_by=?2,updated_at=?1 WHERE id=?3 AND archived_at IS NULL').bind(new Date().toISOString(), admin.id, id).run();
    return json({ ok:true, message:'User archived safely.' });
  } catch (error) { return json({ ok:false, error:messageFromError(error) }, 400); }
};
