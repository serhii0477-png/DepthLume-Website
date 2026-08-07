export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(data, { status, headers: { 'cache-control': 'no-store', ...headers } });

export const messageFromError = (error: unknown) =>
  error instanceof Error && error.message.startsWith('PUBLIC:')
    ? error.message.slice(7)
    : 'Сталася помилка. Спробуйте ще раз.';

export const publicError = (message: string) => new Error(`PUBLIC:${message}`);

export async function readJson<T>(request: Request): Promise<T> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw publicError('Неправильний формат запиту.');
  return request.json<T>();
}

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

export function assertSameOrigin(request: Request): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw publicError('Запит відхилено перевіркою безпеки.');
}

