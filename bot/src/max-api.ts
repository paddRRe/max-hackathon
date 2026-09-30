import { log } from './logger';

// Тонкая обёртка над MAX Bot API.
// Сверено с https://dev.max.ru/docs-api:
// - база https://platform-api2.max.ru (в доках прямо сказано брать platform-api2);
// - токен только заголовком `Authorization`;
// - POST /messages?chat_id=.. | ?user_id=.. с телом { text, attachments? };
// - POST /answers?callback_id=.. — ответ на кнопку (гасит «загрузку»);
// - POST /subscriptions { url, update_types?, secret? }.

const BASE_URL = process.env.MAX_API_BASE_URL ?? 'https://platform-api2.max.ru';
const TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;

function authHeaders(): Record<string, string> {
  const token = process.env.MAX_BOT_TOKEN;
  if (!token) throw new Error('MAX_BOT_TOKEN is not set');
  return { Authorization: token, 'Content-Type': 'application/json' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function retryDelay(attempt: number, retryAfter: string | null): number {
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (Number.isFinite(secs) && secs >= 0) return Math.min(secs * 1000, 5000);
  }
  return Math.min(300 * 2 ** attempt, 3000) + Math.floor(Math.random() * 200);
}

export class MaxApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: { ...authHeaders(), ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status === 429 || res.status >= 500) {
        const body = await res.text().catch(() => '');
        lastErr = new MaxApiError(res.status, `MAX API ${res.status} on ${path}: ${body}`);
        log.warn({ status: res.status, path, attempt }, 'MAX API попросил подождать, повторяю');
        await sleep(retryDelay(attempt, res.headers.get('retry-after')));
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new MaxApiError(res.status, `MAX API ${res.status} on ${path}: ${body}`);
      }
      const text = await res.text();
      return (text ? JSON.parse(text) : {}) as T;
    } catch (err) {
      if (err instanceof MaxApiError && err.status < 500) throw err; // 4xx не повторяем
      lastErr = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        log.warn({ path, attempt }, 'запрос к MAX API не удался, повторяю');
        await sleep(retryDelay(attempt, null));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`MAX API failed on ${path}`);
}

// Очередь отправки: не чаще ~2 сообщений в секунду на один chatId.
// https://dev.max.ru/docs-api/methods/POST/messages — лимит 2 сообщения в секунду.
const chains = new Map<string, Promise<void>>();
const lastSent = new Map<string, number>();

function enqueue<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = chains.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  chains.set(key, prev.then(() => current));
  const run = prev.then(async () => {
    const wait = 500 - (Date.now() - (lastSent.get(key) ?? 0));
    if (wait > 0) await sleep(wait);
    try {
      return await fn();
    } finally {
      lastSent.set(key, Date.now());
      release();
      if (chains.get(key) === current) chains.delete(key);
    }
  });
  return run;
}

export type Attachment = Record<string, unknown>;

/** Сообщение в чат или канал. */
export function sendMessage(chatId: number, text: string, attachments?: Attachment[]): Promise<unknown> {
  return enqueue(`chat:${chatId}`, () => {
    const qs = new URLSearchParams({ chat_id: String(chatId) });
    return request(`/messages?${qs}`, {
      method: 'POST',
      body: JSON.stringify({ text, ...(attachments ? { attachments } : {}) }),
    });
  });
}

/** Личное сообщение пользователю. */
export function sendMessageToUser(
  userId: number,
  text: string,
  attachments?: Attachment[],
): Promise<unknown> {
  return enqueue(`user:${userId}`, () => {
    const qs = new URLSearchParams({ user_id: String(userId) });
    return request(`/messages?${qs}`, {
      method: 'POST',
      body: JSON.stringify({ text, ...(attachments ? { attachments } : {}) }),
    });
  });
}

/** Ответить на нажатую кнопку, чтобы у пользователя не висела «загрузка». */
export function answerCallback(callbackId: string, message?: Record<string, unknown>): Promise<unknown> {
  return enqueue('answers', () => {
    const qs = new URLSearchParams({ callback_id: callbackId });
    return request(`/answers?${qs}`, {
      method: 'POST',
      body: JSON.stringify({ ...(message ? { message } : {}) }),
    });
  });
}

export function subscribeWebhook(
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

export function getSubscriptions(): Promise<unknown> {
  return request('/subscriptions', { method: 'GET' });
}

export function unsubscribeWebhook(url: string): Promise<unknown> {
  const qs = new URLSearchParams({ url });
  return request(`/subscriptions?${qs}`, { method: 'DELETE' });
}
