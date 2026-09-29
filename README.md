# Стартер мини-приложения и чат-бота MAX

## Назначение

Стартовый монорепозиторий для мини-приложения и чат-бота в мессенджере MAX.
Фронтенд — мини-приложение (Vite + React + TS + MAX UI + MAX Bridge), бэкенд — бот
(Node.js + TS + Express), запуск — одной командой через Docker.

## Основной сценарий

TODO(продукт): описать основной пользовательский сценарий после выбора
проблемы и пользователя. Точки входа уже заготовлены:

- мини-приложение: `webapp/src/App.tsx` (комментарий `TODO(scenario)`);
- бот: `bot/src/webhook.ts`, функция `routeUpdate()` (комментарии `TODO(scenario)`).

Текущее поведение-заглушка: бот отвечает эхом на входящие сообщения
(`message_created`), мини-приложение показывает один экран-заглушку.

## Архитектура

```text
/webapp            мини-приложение: Vite + React + TS, MAX UI, MAX Bridge (window.WebApp)
/bot               бот: Express + TS — POST /webhook, GET /health, /api/places + /api/suggest, раздача статики мини-приложения
  src/max-api.ts   обёртка над MAX Bot API (fetch, база https://platform-api2.max.ru)
  src/webhook.ts   проверка секрета + разбор апдейтов (эхо + TODO)
  src/places/      слой мест: типы, демо-датасет, фильтры, роутер /api
  src/index.ts     статика public/ + /webhook + /api, слушает PORT
bot/Dockerfile     многостадийная сборка: webapp → bot → рантайм (public + dist)
docker-compose.yml один сервис `bot`
```

Направление запросов: MAX → `POST /webhook` (заголовок `X-Max-Bot-Api-Secret`),
бот → MAX Bot API (заголовок `Authorization: <MAX_BOT_TOKEN>`).

## Запуск одной командой (Docker)

```bash
cp .env.example .env   # вписать MAX_BOT_TOKEN и WEBHOOK_SECRET
docker compose up --build
```

Приложение: http://localhost:3000 (мини-приложение — статика, бот — `/webhook`).

Локальная разработка без Docker:

```bash
# терминал 1 — мини-приложение (http://localhost:5173, мок Bridge вне MAX)
cd webapp && npm install && npm run dev
# терминал 2 — бот (http://localhost:3000, мини-приложение отдаётся после `npm run build` в webapp)
cd bot && npm install && npm run dev
```

Связка фронта с бэкендом: скопируйте `webapp/.env.example` в `webapp/.env.local`
и задайте `VITE_API_URL=http://localhost:3000` — фронт пойдёт за местами на
`GET /api/places` и будет слать карточки через `POST /api/suggest`. Без переменной
фронт работает на демо-данных, а «Предложить в чат» копирует описание в буфер обмена.

## Переменные окружения

| Переменная         | Обязательность | Описание                                              |
| ------------------ | -------------- | ----------------------------------------------------- |
| `MAX_BOT_TOKEN`    | да (для API)   | Токен бота (Чат-боты → ⋮ → Настройки / «MAX для бизнеса»). В коде уходит в заголовок `Authorization`. |
| `WEBHOOK_SECRET`   | рекомендуется  | Секрет подписки; сверяется с заголовком `X-Max-Bot-Api-Secret`. Если пуст — проверка выключена (только для локальной разработки). |
| `PORT`             | нет (3000)     | Порт HTTP-сервера бота (и маппинг портов в compose).  |
| `MAX_API_BASE_URL` | нет            | Переопределение базы API, по умолчанию `https://platform-api2.max.ru`. |

## Порты

- `3000` (или `$PORT`) — бот и статика мини-приложения. Других портов нет.

## Зависимости

- `webapp`: `react`, `react-dom`, `@maxhub/max-ui`; для разработки: `vite`, `typescript`, `@vitejs/plugin-react`.
- `bot`: `express`, `dotenv`; для разработки: `tsx`, `typescript`, `@types/*`.
- Рантайм Docker: `node:22-alpine`.

## Внешние интеграции

- MAX Bot API — https://dev.max.ru/docs-api (база `https://platform-api2.max.ru`,
  актуально на сентябрь 2026: токен передаётся только заголовком `Authorization`).
- MAX UI — https://dev.max.ru/ui (пакет `@maxhub/max-ui`, провайдер `MaxUI`).
- MAX Bridge — https://dev.max.ru/docs/webapps/bridge
  (`<script src="https://st.max.ru/js/max-web-app.js">` → `window.WebApp`).
- Вебхук MAX требует публичный HTTPS-адрес на порту 443 (самоподписные
  сертификаты не подходят); для локальной разработки используйте туннель и `POST /subscriptions`.

Подписка вебхука (пример):

```bash
curl -X POST "https://platform-api2.max.ru/subscriptions" \
  -H "Authorization: $MAX_BOT_TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.com/webhook","update_types":["message_created","message_callback","bot_started"],"secret":"your-secret"}'
```

## Работа с тестовыми данными

TODO(продукт): описать тестовые данные сценария. Сейчас тестовых данных нет —
проверка идёт живыми сообщениями боту (эхо) и dev-моком Bridge в браузере.

## Пошаговый сценарий проверки

1. `cp .env.example .env`, заполнить `MAX_BOT_TOKEN` и `WEBHOOK_SECRET`, выполнить `docker compose up --build`.
2. `curl localhost:3000/health` → `{"ok":true}`; открыть `localhost:3000` в браузере — виден экран-заглушка.
3. Подписать вебхук (команда выше) на публичный адрес → написать боту → получить эхо-ответ.
4. `POST /webhook` без верного `X-Max-Bot-Api-Secret` → `403`.
5. `cd webapp && npm run dev` — экран работает в обычном браузере (мок Bridge, `platform=web`).
6. Проверка слоя мест: `curl "localhost:3000/api/places?categories=cafe&people=8"` — подборка;
   `curl -X POST localhost:3000/api/suggest -H 'Content-Type: application/json' -d '{"placeId":"zerno-cafe","chatId":123}'`
   — без токена `502`, с токеном и реальным `chatId` карточка уходит в чат.

## Известные ограничения

- Вебхук принимает только HTTPS на порту 443 с доверенным сертификатом (требование MAX);
  Long Polling в стартере не реализован.
- Лимит отправки: не более ~2 сообщений в секунду в один диалог/чат.
- Продуктовая логика отсутствует — только эхо и заглушка (см. `TODO`).
- Сверено с документацией на сентябрь 2026 (Bot API + MAX UI + Bridge); старые
  примеры с `platform-api.max.ru` и токеном в query-параметрах больше не работают.

## Остановка и перезапуск

```bash
docker compose down        # остановить
docker compose up --build  # перезапустить с пересборкой
docker compose logs -f bot # посмотреть логи
```
