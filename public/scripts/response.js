export async function responseJson(response, fallback = 'Сервер повернув некоректну відповідь.') {
  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  if (contentType.includes('application/json')) {
    try { payload = await response.json(); } catch { throw new Error(fallback); }
  }
  if (!response.ok) throw new Error(payload?.error || `Помилка сервера (${response.status}). Спробуйте ще раз.`);
  if (!payload) throw new Error(fallback);
  return payload;
}
