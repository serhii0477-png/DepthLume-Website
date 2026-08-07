import type { Env } from '../../_lib/types';
import { currentUser } from '../../_lib/auth';
import { json, messageFromError } from '../../_lib/http';
import { text } from '../../_lib/validation';

// Uploads use /upload and /finalize so release binaries never enter a Pages Function body.
export const onRequestPost: PagesFunction<Env> = async () => json({ ok: false, error: 'Пряме завантаження релізів більше не підтримується. Оновіть сторінку адмін-панелі.' }, 410);

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await currentUser(request, env);
    if (!admin || admin.role !== 'admin') return json({ ok: false, error: 'Доступ лише для адміністратора.' }, 403);
    const body = await request.json<{ id?: string; isActive?: boolean; releaseNotes?: string }>();
    const id = text(body.id, 'Release ID', 10, 80);
    const now = new Date().toISOString();
    const statements = [];
    if (body.isActive === true) statements.push(env.DB.prepare('UPDATE software_releases SET is_active=0,updated_at=?1 WHERE is_active=1').bind(now));
    statements.push(env.DB.prepare('UPDATE software_releases SET is_active=COALESCE(?1,is_active),release_notes=COALESCE(?2,release_notes),updated_at=?3 WHERE id=?4').bind(typeof body.isActive === 'boolean' ? (body.isActive ? 1 : 0) : null, body.releaseNotes ? text(body.releaseNotes, 'Опис', 3, 4000) : null, now, id));
    await env.DB.batch(statements);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: messageFromError(error) }, 400);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await currentUser(request, env);
    if (!admin || admin.role !== 'admin') return json({ ok: false, error: 'Доступ лише для адміністратора.' }, 403);
    const body = await request.json<{ id?: string }>();
    const id = text(body.id, 'Release ID', 10, 80);
    const release = await env.DB.prepare('SELECT id,storage_key,is_active FROM software_releases WHERE id=?1 LIMIT 1').bind(id).first<{ id: string; storage_key: string; is_active: number }>();
    if (!release) return json({ ok: false, error: 'Реліз не знайдено.' }, 404);
    if (release.is_active) return json({ ok: false, error: 'Спершу активуйте інший реліз. Активний реліз видаляти не можна.' }, 400);
    const downloads = await env.DB.prepare('SELECT COUNT(*) AS count FROM download_logs WHERE release_id=?1').bind(id).first<{ count: number }>();
    if ((downloads?.count || 0) > 0) return json({ ok: false, error: 'Цей реліз уже має журнал завантажень, тому його збережено для аудиту.' }, 400);
    await env.RELEASES.delete(release.storage_key);
    await env.DB.prepare('DELETE FROM software_releases WHERE id=?1').bind(id).run();
    return json({ ok: true, message: 'Неактивний реліз видалено.' });
  } catch (error) {
    return json({ ok: false, error: messageFromError(error) }, 400);
  }
};
