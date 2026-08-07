import { publicError } from './http';
import type { Env } from './types';

const encoder = new TextEncoder();
const releaseBucket = 'depthlume-private-releases';
const awsEncode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

async function hmac(key: ArrayBuffer | Uint8Array | string, value: string): Promise<ArrayBuffer> {
  const material = typeof key === 'string' ? encoder.encode(key) : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey('raw', material as unknown as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value));
}

const dateStamp = (date: Date) => date.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8);
const timestamp = (date: Date) => date.toISOString().replace(/[:-]|\.\d{3}/g, '');

export async function presignR2Put(env: Env, key: string, contentType: string, expiresIn = 900): Promise<{ url: string; expiresAt: string }> {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secret = env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secret) throw publicError('Велике завантаження ще не налаштовано. Зверніться до адміністратора.');

  const now = new Date();
  const shortDate = dateStamp(now);
  const amzDate = timestamp(now);
  // R2 presigned URLs use the S3 virtual-hosted form: the bucket is part of the signed host.
  const host = `${releaseBucket}.${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${key.split('/').map(awsEncode).join('/')}`;
  const scope = `${shortDate}/auto/s3/aws4_request`;
  const params = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
    'X-Amz-Credential': `${accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'content-type;host',
  });
  const canonicalQuery = [...params.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([name, value]) => `${awsEncode(name)}=${awsEncode(value)}`).join('&');
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
  const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQuery}\n${canonicalHeaders}\ncontent-type;host\nUNSIGNED-PAYLOAD`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(canonicalRequest)}`;
  const dateKey = await hmac(`AWS4${secret}`, shortDate);
  const regionKey = await hmac(dateKey, 'auto');
  const serviceKey = await hmac(regionKey, 's3');
  const signingKey = await hmac(serviceKey, 'aws4_request');
  params.set('X-Amz-Signature', hex(await hmac(signingKey, stringToSign)));
  return { url: `https://${host}${canonicalUri}?${params.toString()}`, expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString() };
}
