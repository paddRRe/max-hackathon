# Зависимости и версии

Рантайм: Docker-образ `node:22-alpine` (см. `bot/Dockerfile`), то есть Node 22.

## webapp (мини-приложение)

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `react` | 19.2.8 | Интерфейс |
| `react-dom` | 19.2.8 | Рендер в DOM |
| `@maxhub/max-ui` | 0.5.0 | Компоненты MAX |
| `vite` | 8.3.1 | Сборка и dev-сервер |
| `typescript` | 6.0.3 | Типы и сборка |
| `@vitejs/plugin-react` | 6.1.1 | React-плагин для Vite |
| `oxlint` | 1.85.0 | Линтер (`npm run lint`) |
| `@types/node` | 24.19.0 | Типы Node.js |
| `@types/react` | 19.3.0 | Типы React |
| `@types/react-dom` | 19.3.0 | Типы React DOM |

## bot (бэкенд бота)

| Пакет | Версия | Назначение |
| --- | --- | --- |
| `express` | 4.22.3 | HTTP-сервер: `/webhook`, `/api`, статика |
| `dotenv` | 16.6.1 | Переменные окружения из `.env` |
| `zod` | 4.6.5 | Валидация входов API и вебхука |
| `pino` | 10.3.1 | Логи |
| `pino-http` | 11.0.0 | Логи HTTP-запросов |
| `express-rate-limit` | 8.7.0 | Лимиты запросов |
| `cors` | 2.8.6 | CORS-заголовки |
| `tsx` | 4.23.15 | Запуск TypeScript в dev-режиме |
| `typescript` | 5.6.3 | Сборка (`npm run build`) |
| `vitest` | 5.0.2 | Тесты (`npm test`) |
| `@types/cors` | 2.8.19 | Типы CORS |
| `@types/express` | 4.17.25 | Типы Express |
| `@types/node` | 22.20.4 | Типы Node.js |

Точные версии транзитивных зависимостей зафиксированы в `package-lock.json`.
