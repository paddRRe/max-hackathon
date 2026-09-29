"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const max_api_1 = require("./max-api");
exports.webhookRouter = (0, express_1.Router)();
exports.webhookRouter.post('/', async (req, res) => {
    const expected = process.env.WEBHOOK_SECRET;
    if (expected) {
        const got = req.header('X-Max-Bot-Api-Secret');
        if (got !== expected) {
            res.status(403).json({ ok: false, error: 'bad secret' });
            return;
        }
    }
    const update = req.body;
    try {
        await routeUpdate(update);
    }
    catch (err) {
        console.error('webhook handler error', err);
    }
    // MAX requires HTTP 200 within 30s, otherwise it retries delivery.
    res.status(200).json({ ok: true });
});
async function routeUpdate(update) {
    switch (update.update_type) {
        case 'message_created': {
            const text = update.message?.body?.text ?? '';
            const chatId = update.chat_id;
            const userId = update.message?.sender?.user_id;
            // Echo back so the wiring can be verified end-to-end.
            // TODO(scenario): replace echo with the real scenario logic entry point.
            const reply = text ? `Echo: ${text}` : 'Echo: (empty message)';
            if (chatId)
                await (0, max_api_1.sendMessage)(chatId, reply);
            else if (userId)
                await (0, max_api_1.sendMessageToUser)(userId, reply);
            break;
        }
        case 'message_callback': {
            // TODO(scenario): handle inline-keyboard button presses (payload below).
            const payload = update.callback?.payload;
            console.log('message_callback payload:', payload);
            break;
        }
        case 'bot_started': {
            // TODO(scenario): handle first contact (/start) — e.g. onboarding message.
            console.log('bot_started by user:', update.user?.user_id);
            break;
        }
        default: {
            // TODO(scenario): handle other update types as needed.
            console.log('unhandled update_type:', update.update_type);
        }
    }
}
