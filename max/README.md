# MAX Mini-App + Chat-Bot Starter

## Назначение

Стартовый монорепозиторий для мини-приложения и чат-бота в мессенджере MAX.
Фронт — мини-приложение (Vite + React + TS + MAX UI + MAX Bridge), бэкенд — бот
(Node.js + TS + Express), одна команда запуска через Docker.

## Основной сценарий

TODO(product): описать основной пользовательский сценарий после выбора
проблемы/пользователя. Точки входа заготовлены:

- мини-приложение: `webapp/src/App.tsx` (комментарий `TODO(scenario)`);
- бот: `bot/src/webhook.ts`, функция `routeUpdate()` (комментарии `TODO(scenario)`).

Текущее поведение-заглушка: бот отвечает эхом на входящие сообщения
(`message_created`), мини-приложение показывает один экран-заглушку.

## Архитектура

```text
/webapp          Vite + React + TS, MAX UI, MAX Bridge (window.WebApp)
/bot             Express + TS: POST /webhook, GET /health, static webapp
  src/max-api.ts   wrapper over MAX Bot API (fetch, base https://platform-api2.max.ru)
  src/webhook.ts   secret check + update routing (echo + TODO)
  src/index.ts     static public/ + /webhook, listen PORT
bot/Dockerfile   multi-stage: build webapp → build bot → runtime (public + dist)
docker-compose.yml  single service `bot`
```

Запросы MAX → `POST /webhook` (заголовок `X-Max-Bot-Api-Secret`), бот → MAX Bot API
(заголовок `Authorization: <MAX_BOT_TOKEN>`).

## Запуск одной командой (Docker)

```bash
cp .env.example .env   # fill in MAX_BOT_TOKEN, WEBHOOK_SECRET
docker compose up --build
```

Приложение: http://localhost:3000 (мини-приложение — статика, бот — `/webhook`).

Локальная разработка без Docker:

```bash
# терминал 1 — мини-приложение (http://localhost:5173, мок Bridge вне MAX)
cd webapp && npm install && npm run dev
# терминал 2 — бот (http://localhost:3000, отдаёт webapp после `npm run build` в webapp)
cd bot && npm install && npm run dev
```

## Переменные окружения

| Переменная         | Обязательна | Описание                                              |
| ------------------ | ----------- | ----------------------------------------------------- |
| `MAX_BOT_TOKEN`    | да (для API)| Токен бота (Чат-боты → ⋮ → Настройки / «MAX для бизнеса»). В коде идёт в заголовок `Authorization`. |
| `WEBHOOK_SECRET`   | рекоменд.   | Секрет подписки; сверяется с заголовком `X-Max-Bot-Api-Secret`. Если пуст — проверка отключена (только для локалки). |
| `PORT`             | нет (3000)  | Порт HTTP-сервера бота (и маппинг в compose).         |
| `MAX_API_BASE_URL` | нет         | Оверрайд базы API, по умолчанию `https://platform-api2.max.ru`. |

## Порты

- `3000` (или `$PORT`) — бот + статика мини-приложения. Других портов нет.

## Зависимости

- `webapp`: `react`, `react-dom`, `@maxhub/max-ui`; dev: `vite`, `typescript`, `@vitejs/plugin-react`.
- `bot`: `express`, `dotenv`; dev: `tsx`, `typescript`, `@types/*`.
- Рантайм Docker: `node:22-alpine`.

## Внешние интеграции

- MAX Bot API — https://dev.max.ru/docs-api (база `https://platform-api2.max.ru`,
  актуально на сентябрь 2026: токен только через заголовок `Authorization`).
- MAX UI — https://dev.max.ru/ui (пакет `@maxhub/max-ui`, провайдер `MaxUI`).
- MAX Bridge — https://dev.max.ru/docs/webapps/bridge
  (`<script src="https://st.max.ru/js/max-web-app.js">` → `window.WebApp`).
- Webhook MAX требует публичный HTTPS-endpoint на 443 (без самоподписных
  сертификатов); для локалки используйте туннель и `POST /subscriptions`.

Подписка вебхука (пример):

```bash
curl -X POST "https://platform-api2.max.ru/subscriptions" \
  -H "Authorization: $MAX_BOT_TOKEN" -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.com/webhook","update_types":["message_created","message_callback","bot_started"],"secret":"your-secret"}'
```

## Работа с тестовыми данными

TODO(product): описать тестовые данные сценария. Сейчас тестовых данных нет —
проверка идёт живыми сообщениями боту (эхо) и dev-моком Bridge в браузере.

## Пошаговый сценарий проверки

1. `cp .env.example .env`, заполнить `MAX_BOT_TOKEN`, `WEBHOOK_SECRET`, `docker compose up --build`.
2. `curl localhost:3000/health` → `{"ok":true}`; открыть `localhost:3000` — виден экран-заглушка.
3. Подписать webhook (команда выше) на публичный URL → написать боту → получить эхо-ответ.
4. `POST /webhook` без верного `X-Max-Bot-Api-Secret` → `403`.
5. `cd webapp && npm run dev` — экран работает в обычном браузере (мок Bridge, `platform=web`).

## Известные ограничения

- Webhook принимает только HTTPS на 443 с доверенным сертификатом (требование MAX);
  Long Polling в стартере не реализован.
- Лимит отправки: не более ~2 сообщений/сек в один диалог/чат.
- Продуктовая логика отсутствует — только эхо и заглушка (см. `TODO`).
- Верифицировано по докам на сентябрь 2026 (Bot API + MAX UI + Bridge); старые
  примеры с `platform-api.max.ru` и токеном в query больше не работают.

## Остановка / перезапуск

```bash
docker compose down        # остановить
docker compose up --build  # перезапустить с пересборкой
docker compose logs -f bot # логи
```
