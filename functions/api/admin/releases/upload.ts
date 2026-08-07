import type { Env } from '../../../_lib/types';
import { currentUser } from '../../../_lib/auth';
import { json, messageFromError, publicError, readJson } from '../../../_lib/http';
import { text } from '../../../_lib/validation';
import { MAX_RELEASE_SIZE, isReleaseUploadAllowed, releaseFileType } from '../../../_lib/release-policy.mjs';
import { presignR2Put } from '../../../_lib/r2-presign';

const safeFileName = (value: unknown) => {
  const name = text(value, 'Назва файлу', 5, 180).split(/[\\/]/).pop() || '';
  if (!releaseFileType(name)) throw publicError('Дозволені EXE, MSI або ZIP.');
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const admin = await currentUser(request, env);
    if (!isReleaseUploadAllowed(admin)) return json({ ok: false, error: 'Доступ лише для адміністратора.' }, 403);
    const body = await readJson<Record<string, unknown>>(request);
    const fileName = safeFileName(body.fileName);
    const contentType = releaseFileType(fileName)!;
    const fileSize = Number(body.fileSize);
    if (!Number.isSafeInteger(fileSize) || fileSize < 1) throw publicError('Вкажіть коректний розмір файлу.');
    if (fileSize > MAX_RELEASE_SIZE) throw publicError('Максимальний розмір релізу — 1 ГБ.');
    const version = text(body.version, 'Версія', 1, 40);
    const exists = await env.DB.prepare('SELECT id FROM software_releases WHERE version=?1 LIMIT 1').bind(version).first();
    if (exists) throw publicError('Реліз із такою версією вже існує.');
    const pending = await env.DB.prepare('SELECT id,storage_key,file_name,file_size,content_type,created_by,expires_at FROM release_uploads WHERE version=?1 LIMIT 1').bind(version).first<{ id: string; storage_key: string; file_name: string; file_size: number; content_type: string; created_by: string; expires_at: string }>();
    if (pending && Date.parse(pending.expires_at) < Date.now()) {
      await env.RELEASES.delete(pending.storage_key);
      await env.DB.prepare('DELETE FROM release_uploads WHERE id=?1').bind(pending.id).run();
    } else if (pending) {
      if (pending.created_by !== admin!.id || pending.file_name !== fileName || pending.file_size !== fileSize || pending.content_type !== contentType) throw publicError('Ця версія вже очікує інше завантаження. Оберіть іншу версію або зачекайте 15 хвилин.');
      const signed = await presignR2Put(env, pending.storage_key, pending.content_type);
      await env.DB.prepare('UPDATE release_uploads SET expires_at=?1 WHERE id=?2').bind(signed.expiresAt, pending.id).run();
      return json({ ok: true, uploadId: pending.id, uploadUrl: signed.url, headers: { 'content-type': pending.content_type }, expiresAt: signed.expiresAt, retry: true }, 200);
    }
    const id = crypto.randomUUID();
    const storageKey = `releases/${id}/${fileName}`;
    const now = new Date().toISOString();
    const signed = await presignR2Put(env, storageKey, contentType);
    await env.DB.prepare('INSERT INTO release_uploads(id,storage_key,file_name,file_size,content_type,version,release_notes,supported_platform,is_active,created_by,expires_at,created_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)').bind(id, storageKey, fileName, fileSize, contentType, version, text(body.releaseNotes, 'Опис релізу', 3, 4000), text(body.supportedPlatform, 'Платформа', 3, 100), body.isActive === true ? 1 : 0, admin!.id, signed.expiresAt, now).run();
    return json({ ok: true, uploadId: id, uploadUrl: signed.url, headers: { 'content-type': contentType }, expiresAt: signed.expiresAt }, 201);
  } catch (error) {
    return json({ ok: false, error: messageFromError(error) }, 400);
  }
};
