import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json } from '../../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await currentUser(request, env);
  if (!admin || admin.role !== 'admin') return json({ ok: false, error: 'Administrator access only.' }, 403);
  const url = new URL(request.url);
  const search = (url.searchParams.get('search') || '').slice(0, 100);
  const applicationStatus = url.searchParams.get('applicationStatus') || '';
  const accessStatus = url.searchParams.get('accessStatus') || '';
  const archive = url.searchParams.get('archive') === 'archived' ? 'archived' : 'active';
  const dateFrom = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('dateFrom') || '') ? `${url.searchParams.get('dateFrom')}T00:00:00.000Z` : '';
  const dateTo = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('dateTo') || '') ? `${url.searchParams.get('dateTo')}T23:59:59.999Z` : '';
  const pattern = `%${search}%`;
  const userQuery = `
    SELECT u.id,u.name,u.email,u.role,u.access_status,u.email_verified,u.created_at,u.beta_granted_at,u.beta_revoked_at,u.archived_at,
      a.id application_id,a.status application_status,a.created_at application_created_at,
      (SELECT l.type FROM licenses l WHERE l.user_id=u.id AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>?6) ORDER BY l.created_at DESC LIMIT 1) active_license_type,
      (SELECT l.status FROM licenses l WHERE l.user_id=u.id ORDER BY l.created_at DESC LIMIT 1) latest_license_status
    FROM users u
    LEFT JOIN beta_applications a ON a.id=(SELECT id FROM beta_applications WHERE user_id=u.id ORDER BY created_at DESC LIMIT 1)
    WHERE (?1='' OR u.name LIKE ?2 OR u.email LIKE ?2) AND (?3='' OR u.access_status=?3)
      AND (?4='' OR u.created_at>=?4) AND (?5='' OR u.created_at<=?5)
      AND (?7='' OR a.status=?7) AND (CASE WHEN ?8='archived' THEN u.archived_at IS NOT NULL ELSE u.archived_at IS NULL END)
    ORDER BY u.created_at DESC LIMIT 100`;
  const [total, pending, beta, waitlist, users, releases, downloads, feedback] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) count FROM users WHERE archived_at IS NULL").first(),
    env.DB.prepare("SELECT COUNT(*) count FROM beta_applications a JOIN users u ON u.id=a.user_id WHERE a.status='pending' AND u.archived_at IS NULL").first(),
    env.DB.prepare("SELECT COUNT(*) count FROM users WHERE access_status='beta' AND archived_at IS NULL").first(),
    env.DB.prepare("SELECT COUNT(*) count FROM users WHERE access_status='waitlist' AND archived_at IS NULL").first(),
    env.DB.prepare(userQuery).bind(search, pattern, accessStatus, dateFrom, dateTo, new Date().toISOString(), applicationStatus, archive).all(),
    env.DB.prepare('SELECT id,version,file_name,file_size,release_notes,supported_platform,is_active,download_count,created_at FROM software_releases ORDER BY created_at DESC LIMIT 30').all(),
    env.DB.prepare('SELECT d.downloaded_at,d.ip_address,u.email,r.version FROM download_logs d JOIN users u ON u.id=d.user_id JOIN software_releases r ON r.id=d.release_id ORDER BY d.downloaded_at DESC LIMIT 100').all(),
    env.DB.prepare('SELECT f.*,u.email,u.name FROM feedback f JOIN users u ON u.id=f.user_id ORDER BY f.created_at DESC LIMIT 100').all(),
  ]);
  return json({ ok:true, stats:{ totalUsers:(total as any)?.count || 0, pending:(pending as any)?.count || 0, beta:(beta as any)?.count || 0, betaLimit:Number(env.BETA_LIMIT || 10), waitlist:(waitlist as any)?.count || 0 }, users:users.results, releases:releases.results, downloads:downloads.results, feedback:feedback.results });
};
