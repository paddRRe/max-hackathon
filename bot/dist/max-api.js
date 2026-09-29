"use strict";
// Thin wrapper over MAX Bot API.
// Verified against https://dev.max.ru/docs-api (Sept 2026):
// - Base host: https://platform-api2.max.ru
//   (docs explicitly say to use `platform-api2` instead of `platform-api`).
// - Auth: `Authorization: <access_token>` header (query-param tokens removed).
// - POST /messages?chat_id=.. | ?user_id=.. with JSON body { text, attachments? }
// - POST /subscriptions { url, update_types?, secret? }
// - GET /subscriptions, DELETE /subscriptions?url=..
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = sendMessage;
exports.sendMessageToUser = sendMessageToUser;
exports.subscribeWebhook = subscribeWebhook;
exports.getSubscriptions = getSubscriptions;
exports.unsubscribeWebhook = unsubscribeWebhook;
const BASE_URL = process.env.MAX_API_BASE_URL ?? 'https://platform-api2.max.ru';
function authHeaders() {
    const token = process.env.MAX_BOT_TOKEN;
    if (!token)
        throw new Error('MAX_BOT_TOKEN is not set');
    return { Authorization: token, 'Content-Type': 'application/json' };
}
async function request(path, init = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: { ...authHeaders(), ...(init.headers ?? {}) },
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`MAX API ${res.status} on ${path}: ${body}`);
    }
    return (await res.json());
}
/** Send a message to a chat/channel (chat_id) or dialog (see sendToUser). */
async function sendMessage(chatId, text, attachments) {
    const qs = new URLSearchParams({ chat_id: String(chatId) });
    return request(`/messages?${qs}`, {
        method: 'POST',
        body: JSON.stringify({ text, ...(attachments ? { attachments } : {}) }),
    });
}
/** Send a direct message to a user (user_id). */
async function sendMessageToUser(userId, text, attachments) {
    const qs = new URLSearchParams({ user_id: String(userId) });
    return request(`/messages?${qs}`, {
        method: 'POST',
        body: JSON.stringify({ text, ...(attachments ? { attachments } : {}) }),
    });
}
async function subscribeWebhook(url, updateTypes, secret) {
    return request('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
            url,
            ...(updateTypes ? { update_types: updateTypes } : {}),
            ...(secret ? { secret } : {}),
        }),
    });
}
async function getSubscriptions() {
    return request('/subscriptions', { method: 'GET' });
}
async function unsubscribeWebhook(url) {
    const qs = new URLSearchParams({ url });
    return request(`/subscriptions?${qs}`, { method: 'DELETE' });
}
