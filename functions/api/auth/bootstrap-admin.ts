import type { Env } from '../../_lib/types';
import { safeEqual, hashPassword } from '../../_lib/security';
import { email, password, text } from '../../_lib/validation';
import { json, messageFromError, readJson } from '../../_lib/http';
import { rateLimit } from '../../_lib/rate-limit';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    await rateLimit(request, env, 'bootstrap-admin', 3, 3600);

    const secret = request.headers.get('x-bootstrap-secret') || '';
    if (!env.ADMIN_BOOTSTRAP_SECRET || !safeEqual(secret, env.ADMIN_BOOTSTRAP_SECRET)) {
      return json({ ok: false, error: 'Доступ заборонено.' }, 403);
    }

    const exists = await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();
    if (exists) return json({ ok: false, error: 'Адміністратор уже існує.' }, 409);

    const body = await readJson<Record<string, unknown>>(request);
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(password(body.password));

    await env.DB.prepare(
      "INSERT INTO users(id,name,email,password_hash,role,access_status,email_verified,created_at,updated_at) VALUES(?1,?2,?3,?4,'admin','beta',1,?5,?5)",
    )
      .bind(
        crypto.randomUUID(),
        text(body.name, 'Ім’я', 2, 80),
        email(body.email),
        passwordHash,
        now,
      )
      .run();

    return json({ ok: true }, 201);
  } catch (error) {
    console.error(
      'bootstrap-admin failed',
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { value: String(error) },
    );
    return json({ ok: false, error: messageFromError(error) }, 400);
  }
};
