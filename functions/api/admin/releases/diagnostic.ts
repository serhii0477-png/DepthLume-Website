import type { Env } from '../../../_lib/types';
import { currentUser } from '../../../_lib/auth';
import { json } from '../../../_lib/http';
import { presignR2Put } from '../../../_lib/r2-presign';

const details = (value: string) => ({
  code: value.match(/<Code>([^<]+)<\/Code>/)?.[1] || 'UnknownError',
  message: value.match(/<Message>([^<]+)<\/Message>/)?.[1] || 'R2 не повернув опис помилки.',
});

// Admin-only health check. It signs and uploads one byte server-side, then removes it.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const admin = await currentUser(request, env);
  if (!admin || admin.role !== 'admin') return json({ ok: false, error: 'Доступ лише для адміністратора.' }, 403);
  const key = `diagnostics/${crypto.randomUUID()}.txt`;
  try {
    const signed = await presignR2Put(env, key, 'text/plain', 60);
    const response = await fetch(signed.url, { method: 'PUT', headers: { 'content-type': 'text/plain' }, body: '1' });
    const body = await response.text();
    if (response.ok) await env.RELEASES.delete(key);
    if (response.ok) return json({ ok: true, message: 'R2 signing і запис працюють.' });
    const detail = details(body);
    return json({ ok: false, error: `${detail.code}: ${detail.message}` }, 400);
  } catch (error) {
    return json({ ok: false, error: `DiagnosticFailure: ${error instanceof Error ? error.message : 'Невідома помилка.'}` }, 400);
  }
};
