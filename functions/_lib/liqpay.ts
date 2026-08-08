import type { Env } from './types';

const encoder = new TextEncoder();
const base64 = (value: Uint8Array | string) => btoa(typeof value === 'string' ? value : Array.from(value, b => String.fromCharCode(b)).join(''));

export async function liqpaySignature(privateKey: string, data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', encoder.encode(`${privateKey}${data}${privateKey}`));
  return base64(new Uint8Array(digest));
}

export async function signedCheckout(env: Env, payload: Record<string, unknown>) {
  if (!env.LIQPAY_PUBLIC_KEY || !env.LIQPAY_PRIVATE_KEY) throw new Error('billing_not_configured');
  const data = base64(JSON.stringify({ version: 3, public_key: env.LIQPAY_PUBLIC_KEY, ...payload }));
  return { action: 'https://www.liqpay.ua/api/3/checkout', data, signature: await liqpaySignature(env.LIQPAY_PRIVATE_KEY, data) };
}

export async function liqpayApi(env: Env, payload: Record<string, unknown>) {
  if (!env.LIQPAY_PUBLIC_KEY || !env.LIQPAY_PRIVATE_KEY) throw new Error('billing_not_configured');
  const data = base64(JSON.stringify({ version: 3, public_key: env.LIQPAY_PUBLIC_KEY, ...payload }));
  const response = await fetch('https://www.liqpay.ua/api/request', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ data, signature: await liqpaySignature(env.LIQPAY_PRIVATE_KEY, data) }) });
  if (!response.ok) throw new Error('provider_unavailable');
  return response.json() as Promise<Record<string, unknown>>;
}
