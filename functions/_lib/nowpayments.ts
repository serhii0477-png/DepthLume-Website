import type { Env } from './types';

const encoder = new TextEncoder();
const API = 'https://api.nowpayments.io/v1';

export interface PaymentDetails {
  payment_id: string;
  pay_address: string;
  pay_amount?: number;
  pay_currency?: string;
  expiration_estimate_date?: string;
}

export interface PaymentEstimate {
  pay_amount: number;
  pay_currency?: string;
  expiration_estimate_date?: string;
}

/** Creates one payment and returns its address instead of sending the customer to an invoice page. */
export async function createPayment(env: Env, payload: Record<string, unknown>) {
  if (!env.NOWPAYMENTS_API_KEY) throw new Error('billing_not_configured');
  const response = await fetch(`${API}/payment`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.NOWPAYMENTS_API_KEY }, body: JSON.stringify(payload) });
  if (!response.ok) {
    const body: Record<string, unknown> = await response.json<Record<string, unknown>>().catch(() => ({} as Record<string, unknown>));
    const detail = String(body.message || body.error || '').replace(/[^\w .,:()-]/g, '').slice(0, 140);
    throw new Error(`provider_${response.status}${detail ? `:${detail}` : ''}`);
  }
  return response.json() as Promise<PaymentDetails>;
}

/** NOWPayments supplies the definitive payable amount in this second call. */
export async function updateMerchantEstimate(env: Env, paymentId: string) {
  if (!env.NOWPAYMENTS_API_KEY) throw new Error('billing_not_configured');
  const response = await fetch(`${API}/payment/${encodeURIComponent(paymentId)}/update-merchant-estimate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': env.NOWPAYMENTS_API_KEY },
  });
  if (!response.ok) throw new Error(`provider_estimate_${response.status}`);
  return response.json() as Promise<PaymentEstimate>;
}

const sort = (value: unknown): unknown => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sort(item)])) : value;
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');

export async function validIpn(secret: string | undefined, payload: Record<string, unknown>, signature: string | null) {
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(sort(payload))));
  return hex(signed) === signature.toLowerCase();
}
