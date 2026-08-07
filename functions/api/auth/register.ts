import type { Env } from '../../_lib/types';
import { hashPassword, randomToken, sha256 } from '../../_lib/security';
import { email, password, text } from '../../_lib/validation';
import { json, messageFromError, readJson } from '../../_lib/http';
import { rateLimit } from '../../_lib/rate-limit';
import { sendAccessEmail } from '../../_lib/email';

const verificationMessage = 'Якщо цей email доступний, перевірте пошту.';
const verificationSubject = 'Підтвердження email DepthLume';
const verificationEmail = (verifyUrl: string) => `<p>Підтвердіть email: <a href="${verifyUrl}">${verifyUrl}</a></p>`;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    await rateLimit(request, env, 'register', 5, 3600);
    const body = await readJson<Record<string, unknown>>(request);
    const name = text(body.name, 'Ім’я', 2, 80);
    const userEmail = email(body.email);
    const userPassword = password(body.password);
    const existing = await env.DB.prepare('SELECT id,email_verified FROM users WHERE email=?1').bind(userEmail).first<{ id: string; email_verified: number }>();
    const now = new Date().toISOString();
    const rawToken = randomToken();
    const verifyUrl = `${env.APP_URL || new URL(request.url).origin}/verify-email/?token=${encodeURIComponent(rawToken)}`;

    if (existing) {
      if (!existing.email_verified) {
        await env.DB.batch([
          env.DB.prepare("UPDATE auth_tokens SET used_at=?1 WHERE user_id=?2 AND purpose='verify_email' AND used_at IS NULL").bind(now, existing.id),
          env.DB.prepare("INSERT INTO auth_tokens(id,user_id,token_hash,purpose,expires_at,created_at) VALUES(?1,?2,?3,'verify_email',?4,?5)").bind(crypto.randomUUID(), existing.id, await sha256(rawToken), new Date(Date.now() + 86400000).toISOString(), now),
        ]);
        await sendAccessEmail(env, userEmail, verificationSubject, verificationEmail(verifyUrl));
      }
      return json({ ok: true, message: verificationMessage });
    }

    const userId = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO users(id,name,email,password_hash,created_at,updated_at) VALUES(?1,?2,?3,?4,?5,?5)').bind(userId, name, userEmail, await hashPassword(userPassword), now),
      env.DB.prepare("INSERT INTO auth_tokens(id,user_id,token_hash,purpose,expires_at,created_at) VALUES(?1,?2,?3,'verify_email',?4,?5)").bind(crypto.randomUUID(), userId, await sha256(rawToken), new Date(Date.now() + 86400000).toISOString(), now),
    ]);
    const sent = await sendAccessEmail(env, userEmail, verificationSubject, verificationEmail(verifyUrl));
    return json({ ok: true, message: sent ? 'Перевірте пошту для підтвердження email.' : 'Акаунт створено. Email-сервіс ще не налаштовано; зверніться до адміністратора.', ...(env.APP_ENV === 'development' ? { verifyUrl } : {}) }, 201);
  } catch (error) {
    return json({ ok: false, error: messageFromError(error) }, 400);
  }
};
