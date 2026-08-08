import type { Env } from './types';

export const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
export const DEPTHLUME_USDT_TRC20_WALLET = 'TKjMtUAWphxs5gfEVLcPRyW2yQJ6AyHm47';

type Transfer = {
  transaction_id?: string;
  to?: string;
  value?: string;
  token_info?: { address?: string; symbol?: string };
};

export async function findConfirmedUsdtTrc20Transfer(env: Env, transactionId: string) {
  const headers: HeadersInit = env.TRONGRID_API_KEY ? { 'TRON-PRO-API-KEY': env.TRONGRID_API_KEY } : {};
  const url = new URL(`https://api.trongrid.io/v1/accounts/${DEPTHLUME_USDT_TRC20_WALLET}/transactions/trc20`);
  url.searchParams.set('only_confirmed', 'true');
  url.searchParams.set('limit', '200');
  url.searchParams.set('contract_address', USDT_TRC20_CONTRACT);
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`tron_provider_${response.status}`);
  const body = await response.json<{ data?: Transfer[] }>();
  const transfer = body.data?.find(item => item.transaction_id?.toLowerCase() === transactionId.toLowerCase());
  if (!transfer) return null;
  const rawAmount = Number(transfer.value || 0);
  if (!Number.isSafeInteger(rawAmount) || transfer.to !== DEPTHLUME_USDT_TRC20_WALLET || transfer.token_info?.address !== USDT_TRC20_CONTRACT || transfer.token_info?.symbol !== 'USDT') return null;
  return { rawAmount };
}
