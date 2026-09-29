"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placesRouter = void 0;
const express_1 = require("express");
const max_api_1 = require("../max-api");
const service_1 = require("./service");
exports.placesRouter = (0, express_1.Router)();
// GET /api/places?categories=&people=&station=&radiusKm=&indoorOnly=
exports.placesRouter.get('/places', (req, res) => {
    const peopleRaw = req.query.people;
    const radiusRaw = req.query.radiusKm;
    const indoorRaw = req.query.indoorOnly;
    const people = peopleRaw !== undefined ? Number(peopleRaw) : undefined;
    if (people !== undefined && (!Number.isInteger(people) || people < 1)) {
        res.status(400).json({ ok: false, error: 'people must be a positive integer' });
        return;
    }
    const radiusKm = radiusRaw !== undefined ? Number(radiusRaw) : undefined;
    if (radiusKm !== undefined && (!Number.isFinite(radiusKm) || radiusKm <= 0)) {
        res.status(400).json({ ok: false, error: 'radiusKm must be a positive number' });
        return;
    }
    const query = {
        categories: req.query.categories,
        people,
        station: req.query.station,
        radiusKm,
        indoorOnly: indoorRaw === 'true' || indoorRaw === '1',
    };
    try {
        res.json((0, service_1.filterPlaces)(query));
    }
    catch (err) {
        res.status(400).json({ ok: false, error: err.message });
    }
});
// POST /api/suggest { placeId, chatId, initData? } — bot sends the card to the chat.
exports.placesRouter.post('/suggest', async (req, res) => {
    const body = req.body;
    if (typeof body.placeId !== 'string' || body.placeId.length === 0) {
        res.status(400).json({ ok: false, error: 'placeId is required' });
        return;
    }
    if (typeof body.chatId !== 'number' || !Number.isInteger(body.chatId)) {
        res.status(400).json({ ok: false, error: 'chatId must be an integer' });
        return;
    }
    // TODO(security): validate body.initData against MAX_BOT_TOKEN (HMAC, see
    // https://dev.max.ru/docs/webapps/validation) so strangers cannot use the
    // bot to spam arbitrary chats.
    const place = (0, service_1.findPlace)(body.placeId);
    if (!place) {
        res.status(404).json({ ok: false, error: 'place not found' });
        return;
    }
    try {
        await (0, max_api_1.sendMessage)(body.chatId, (0, service_1.renderCard)(place), (0, service_1.cardAttachments)(place));
        res.json({ ok: true });
    }
    catch (err) {
        res.status(502).json({ ok: false, error: err.message });
    }
});
