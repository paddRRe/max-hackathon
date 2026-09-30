import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import pinoHttp from 'pino-http';
import { initDataMiddleware } from './auth/initdata';
import { loadConfig } from './config';
import { errorMiddleware } from './http';
import { log } from './logger';
import { webhookRouter } from './webhook';
import { placesRouter } from './places/router';
import { polls } from './places/poll';

const config = loadConfig();

const app = express();
app.set('trust proxy', 1);
app.use(pinoHttp({ logger: log }));
app.use(express.json());

// CORS: если ALLOWED_ORIGIN не задан — как раньше, без заголовков
// (фронт на том же домене, ничего не ломается). В dev пускаем vite.
if (config.allowedOrigin) {
  app.use(cors({ origin: config.allowedOrigin.split(',').map((s) => s.trim()) }));
} else if (config.isDev) {
  app.use(cors({ origin: 'http://localhost:5173' }));
}

// Лимиты: /api — 60 запросов в минуту с IP, вебхук — мягче.
app.use('/api', rateLimit({ windowMs: 60_000, limit: 60 }));
app.use('/webhook', rateLimit({ windowMs: 60_000, limit: 300 }));

if (config.requireInitData) {
  log.info('проверка X-Max-Init-Data включена');
} else {
  log.warn('проверка X-Max-Init-Data выключена (REQUIRE_INIT_DATA=true чтобы включить)');
}
app.use('/api', initDataMiddleware(config.botToken, config.requireInitData));

// Built webapp (webapp/dist) is copied to bot/public at Docker build time.
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/webhook', webhookRouter);
app.use('/api', placesRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'такого эндпоинта нет' });
});
app.use(errorMiddleware);

const server = app.listen(config.port, () => {
  log.info(`бот слушает :${config.port}`);
});

// Аккуратно завершаемся: закрываем сервер, чистим таймеры опросов.
function shutdown(signal: string) {
  log.info({ signal }, 'завершаю работу');
  polls.clearAll();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
