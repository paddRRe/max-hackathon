"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const webhook_1 = require("./webhook");
const router_1 = require("./places/router");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Built webapp (webapp/dist) is copied to bot/public at Docker build time.
app.use(express_1.default.static(node_path_1.default.join(__dirname, '..', 'public')));
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
app.use('/webhook', webhook_1.webhookRouter);
app.use('/api', router_1.placesRouter);
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
    console.log(`bot listening on :${port}`);
});
