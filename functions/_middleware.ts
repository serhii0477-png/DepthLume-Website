import type { Env } from './_lib/types';
import { currentUser } from './_lib/auth';
import { assertSameOrigin, json, messageFromError } from './_lib/http';

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  try { assertSameOrigin(context.request); } catch (error) { return json({ ok: false, error: messageFromError(error) }, 403); }

  if (url.pathname.startsWith('/account') || url.pathname.startsWith('/apply') || url.pathname.startsWith('/admin')) {
    const user = await currentUser(context.request, context.env);
    if (!user) return Response.redirect(`${url.origin}/login/?next=${encodeURIComponent(url.pathname)}`, 302);
    if (url.pathname.startsWith('/admin') && user.role !== 'admin') return Response.redirect(`${url.origin}/account/`, 302);
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  const r2ConnectSource = context.env.R2_ACCOUNT_ID ? ` https://depthlume-private-releases.${context.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '';
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('content-security-policy', `default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://cloudflareinsights.com${r2ConnectSource}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
