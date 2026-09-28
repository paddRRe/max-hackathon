// Thin wrapper over MAX Bot API.
// Verified against https://dev.max.ru/docs-api (Sept 2026):
// - Base host: https://platform-api2.max.ru
//   (docs explicitly say to use `platform-api2` instead of `platform-api`).
// - Auth: `Authorization: <access_token>` header (query-param tokens removed).
// - POST /messages?chat_id=.. | ?user_id=.. with JSON body { text, attachments? }
// - POST /subscriptions { url, update_types?, secret? }
// - GET /subscriptions, DELETE /subscriptions?url=..

const BASE_URL =
  process.env.MAX_API_BASE_URL ?? 'https://platform-api2.max.ru';

function authHeaders(): Record<string, string> {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) throw new Error('MAX_BOT_TOKEN is not set');
  return { Authorization: token, 'Content-Type': 'application/json' };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`MAX API ${res.status} on ${path}: ${body}`);
  }
  return (await res.json()) as T;
}

export type Attachment = Record<string, unknown>;

/** Send a message to a chat/channel (chat_id) or dialog (see sendToUser). */
export async function sendMessage(
  chatId: number,
  text: string,
  attachments?: Attachment[],
): Promise<unknown> {
  const qs = new URLSearchParams({ chat_id: String(chatId) });
  return request(`/messages?${qs}`, {
    method: 'POST',
    body: JSON.stringify({ text, ...(attachments ? { attachments } : {}) }),
  });
}

/** Send a direct message to a user (user_id). */
export async function sendMessageToUser(
  userId: number,
  text: string,
  attachments?: Attachment[],
): Promise<unknown> {
  const qs = new URLSearchParams({ user_id: String(userId) });
  return request(`/messages?${qs}`, {
    method: 'POST',
    body: JSON.stringify({ text, ...(attachments ? { attachments } : {}) }),
  });
}

export async function subscribeWebhook(
  url: string,
  updateTypes?: string[],
  secret?: string,
): Promise<unknown> {
  return request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      url,
      ...(updateTypes ? { update_types: updateTypes } : {}),
      ...(secret ? { secret } : {}),
    }),
  });
}

export async function getSubscriptions(): Promise<unknown> {
  return request('/subscriptions', { method: 'GET' });
}

export async function unsubscribeWebhook(url: string): Promise<unknown> {
  const qs = new URLSearchParams({ url });
  return request(`/subscriptions?${qs}`, { method: 'DELETE' });
}
