import pino from 'pino';

// Один логгер на всех. Секреты и токены в логи не пишем.
export const log = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-max-bot-api-secret"]',
      'req.headers["x-max-init-data"]',
      '*.token',
      'body.initData',
    ],
    censor: '[скрыто]',
  },
});
