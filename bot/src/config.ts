import { log } from './logger';

// Все настройки берутся из env один раз при старте.
// Непонятное значение — понятная ошибка и выход (кроме dev-режима).

export interface Config {
  port: number;
  botToken: string;
  webhookSecret: string;
  webappUrl: string;
  allowedOrigin: string;
  requireInitData: boolean;
  isDev: boolean;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    log.error({ name, raw }, 'плохая переменная окружения');
    process.exit(1);
  }
  return value;
}

function flag(name: string): boolean {
  return process.env[name] === 'true';
}

export function loadConfig(): Config {
  const isDev = process.env.NODE_ENV !== 'production';
  const botToken = process.env.MAX_BOT_TOKEN ?? '';
  const requireInitData = flag('REQUIRE_INIT_DATA');

  if (requireInitData && !botToken) {
    log.error('REQUIRE_INIT_DATA=true, а MAX_BOT_TOKEN пуст — нечем проверять подпись');
    process.exit(1);
  }
  if (!botToken && !isDev) {
    log.error('нет MAX_BOT_TOKEN — боту нечем звать MAX API');
    process.exit(1);
  }

  const webhookSecret = process.env.WEBHOOK_SECRET ?? '';
  if (!webhookSecret) {
    log.warn('WEBHOOK_SECRET пуст — вебхук принимает запросы без проверки секрета');
  }

  return {
    port: num('PORT', 3000),
    botToken,
    webhookSecret,
    webappUrl: process.env.WEBAPP_URL ?? '',
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? '',
    requireInitData,
    isDev,
  };
}
