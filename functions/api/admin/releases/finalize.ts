import type { Env } from '../../../_lib/types';
import { currentUser } from '../../../_lib/auth';
import { json, messageFromError, publicError, readJson } from '../../../_lib/http';
import { text } from '../../../_lib/validation';
import { isReleaseUploadAllowed, objectMatchesReleaseUpload } from '../../../_lib/release-policy.mjs';

type Upload = { id: string; storage_key: string; file_name: string; file_size: number; content_type: string; version: string; release_notes: string; supported_platform: string; is_active: number; created_by: string; expires_at: string };

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await currentUser(request, env);
    if (!isReleaseUploadAllowed(admin)) return json({ ok: false, error: 'Доступ лише для адміністратора.' }, 403);
    const body = await readJson<Record<string, unknown>>(request);
    const uploadId = text(body.uploadId, 'ID завантаження', 10, 80);
    const upload = await env.DB.prepare('SELECT * FROM release_uploads WHERE id=?1 AND created_by=?2 LIMIT 1').bind(uploadId, admin!.id).first<Upload>();
    if (!upload) throw publicError('Авторизацію завантаження не знайдено. Почніть завантаження ще раз.');
    if (Date.parse(upload.expires_at) < Date.now()) throw publicError('Час авторизації завантаження минув. Почніть завантаження ще раз.');
    const object = await env.RELEASES.head(upload.storage_key);
    if (!object) throw publicError('Файл не знайдено у приватному сховищі. Завантажте його ще раз.');
    if (!objectMatchesReleaseUpload(object, upload)) throw publicError('Файл у сховищі не відповідає очікуваному типу або розміру. Завантажте його ще раз.');
    const now = new Date().toISOString();
    const statements = [];
    if (upload.is_active) statements.push(env.DB.prepare('UPDATE software_releases SET is_active=0,updated_at=?1 WHERE is_active=1').bind(now));
    statements.push(env.DB.prepare('INSERT INTO software_releases(id,version,storage_key,file_name,file_size,content_type,release_notes,supported_platform,is_active,created_at,updated_at,uploaded_at,created_by) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?10,?10,?11)').bind(upload.id, upload.version, upload.storage_key, upload.file_name, upload.file_size, upload.content_type, upload.release_notes, upload.supported_platform, upload.is_active, now, admin!.id));
    statements.push(env.DB.prepare('DELETE FROM release_uploads WHERE id=?1').bind(upload.id));
    try {
      await env.DB.batch(statements);
    } catch (error) {
      await env.RELEASES.delete(upload.storage_key);
      throw error;
    }
    return json({ ok: true, id: upload.id }, 201);
  } catch (error) {
    return json({ ok: false, error: messageFromError(error) }, 400);
  }
};
