# Стартер мини-приложения и чат-бота MAX

## Назначение

Стартовый монорепозиторий для мини-приложения и чат-бота в мессенджере MAX.
Фронтенд — мини-приложение (Vite + React + TS + MAX UI + MAX Bridge), бэкенд — бот
(Node.js + TS + Express), запуск — одной командой через Docker.

## Основной сценарий

«Куда пойти компанией»: пользователь открывает мини-приложение, задаёт фильтры
(категория, число людей, метро и радиус, «только в помещении», цена, район) и
получает подборку мест. Понравившееся место одной кнопкой «Предложить в чат»
улетает в чат карточкой от бота: название, категория, цена, район, адрес, ссылка
на карту и кнопка «Голосую за это место». Для выбора из нескольких вариантов
создаётся опрос (`POST /api/poll`): карточки уходят в чат, каждый жмёт «Голосую»,
повторный клик переносит голос. Когда все проголосовали или прошло 10 минут,
бот пишет победителя.

Роль бота без мини-приложения: встречает (`bot_started`, `/start`) и зовёт в
мини-приложение кнопкой, `/help` — короткая справка, на остальное отвечает
подсказкой открыть мини-приложение. Эха больше нет.

## Архитектура

```text
/webapp            мини-приложение: Vite + React + TS, MAX UI, MAX Bridge (window.WebApp)
/bot               бот: Express + TS — POST /webhook, GET /health, /api/places + /api/suggest + /api/poll, раздача статики мини-приложения
  src/max-api.ts   обёртка над MAX Bot API: таймаут 10 с, ретраи на 429/5xx, очередь ~2 сообщ./сек на чат
  src/webhook.ts   секрет (timingSafeEqual) + разбор апдейтов: приветствие, /start, /help, голосование
  src/auth/        проверка X-Max-Init-Data по схеме MAX (за флагом REQUIRE_INIT_DATA)
  src/places/      места: типы, демо-датасет (~15 мест), чистые фильтры, опросы в памяти, роутер /api
  src/config.ts    проверка env при старте; src/http.ts — общий формат ошибок
  src/index.ts     логи pino, CORS, rate-limit, /webhook + /api, graceful shutdown
bot/Dockerfile     многостадийная сборка: webapp → bot → рантайм (public + dist)
docker-compose.yml один сервис `bot`
.github/           CI: сборка и тесты бота, сборка фронта
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
| `MAX_BOT_TOKEN`    | да (кроме dev) | Токен бота (Чат-боты → ⋮ → Настройки / «MAX для бизнеса»). В коде уходит в заголовок `Authorization`. |
| `WEBHOOK_SECRET`   | рекомендуется  | Секрет подписки; сверяется с заголовком `X-Max-Bot-Api-Secret` через timingSafeEqual. Если пуст — проверка выключена (только для локальной разработки). |
| `PORT`             | нет (3000)     | Порт HTTP-сервера бота (и маппинг портов в compose).  |
| `MAX_API_BASE_URL` | нет            | Переопределение базы API, по умолчанию `https://platform-api2.max.ru`. |
| `WEBAPP_URL`       | нет            | Ссылка для кнопки «Открыть мини-приложение» в приветствии бота. Если не задана — приветствие уходит без кнопки. |
| `ALLOWED_ORIGIN`   | нет            | CORS для /api (можно списком через запятую). Если не задан — как раньше, без CORS-заголовков; в dev разрешён `http://localhost:5173`. |
| `REQUIRE_INIT_DATA`| нет (false)    | `true` — требовать заголовок `X-Max-Init-Data` на /api (подпись токеном, свежесть до 24 ч). Без флага запросы проходят как раньше. |
| `LOG_LEVEL`        | нет            | Уровень логов pino (`debug` в dev, `info` в проде).   |

## Порты

- `3000` (или `$PORT`) — бот и статика мини-приложения. Других портов нет.

## Зависимости

- `webapp`: `react`, `react-dom`, `@maxhub/max-ui`; для разработки: `vite`, `typescript`, `@vitejs/plugin-react`.
- `bot`: `express`, `dotenv`, `zod`, `pino`, `pino-http`, `express-rate-limit`, `cors`; для разработки: `tsx`, `typescript`, `vitest`, `@types/*`.
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

## Эндпоинты мест и опросов

- `GET /api/places?categories=&people=&station=&radiusKm=&indoorOnly=&priceMax=&district=&openNow=&sort=` —
  подборка. Новое: `priceMax` (1–3), `district` (точное совпадение), `openNow=true`
  (открыто сейчас), `sort=rating|price|name`. Старые параметры и формат ответа
  без изменений: массив мест (в местах добавились поля `district`, `rating`, `mapLinks`).
- `POST /api/suggest` с `{ placeId, chatId }` — карточка места в чат
  (название, категория, цена, район, адрес, ссылка на карту, кнопка «Голосую»).
  Ответ как раньше `{ ok: true }`, плюс добавилось `pollId` мини-опроса карточки.
- `POST /api/poll` с `{ chatId, placeIds (2–3), expectedVoters? }` — опрос:
  карточки с кнопками уходят в чат. Ответ `{ ok: true, pollId }`.
- `GET /api/poll/:id` — `{ ok: true, pollId, chatId, finished, totalVotes, options, winnerPlaceId }`.
  Голоса в памяти, один голос на пользователя, повторный клик переносит голос.
  Когда все проголосовали (`expectedVoters`) или прошло 10 минут — бот пишет победителя.

## Проверка initData

Фронт пока не шлёт заголовок, поэтому по умолчанию проверка выключена и ничего
не ломается. Когда фронт начнёт слать `X-Max-Init-Data` (содержимое
`window.WebApp.initData`): задайте `REQUIRE_INIT_DATA=true` — бот будет проверять
подпись токеном по схеме MAX (https://dev.max.ru/docs/webapps/validation) и
свежесть до 24 часов, иначе `401`. Без `MAX_BOT_TOKEN` при включённом флаге бот
не стартует. user id из валидного заголовка доступен логике (`req.initUserId`);
голоса с кнопок чата берут id из callback-апдейта MAX.

## Работа с тестовыми данными

Демо-датасет — ~15 мест Москвы в `bot/src/places/data.ts` (категории, вместимость,
метро с координатами, цена 1–3, районы, часы, ссылки на Яндекс Карты и 2ГИС).
Проверка — живыми запросами к /api и сообщениями боту. Голоса живут в памяти:
хватает на сессию, после перезапуска опросы сбрасываются.

## Пошаговый сценарий проверки

1. `cp .env.example .env`, заполнить `MAX_BOT_TOKEN` и `WEBHOOK_SECRET`, выполнить `docker compose up --build`.
2. `curl localhost:3000/health` → `{"ok":true}`; открыть `localhost:3000` в браузере — виден экран-заглушка.
3. Подписать вебхук (команда выше) на публичный адрес → написать боту `/start` → приветствие с кнопкой мини-приложения; обычное сообщение → подсказка (эха больше нет).
4. `POST /webhook` без верного `X-Max-Bot-Api-Secret` → `403`.
5. `cd webapp && npm run dev` — экран работает в обычном браузере (мок Bridge, `platform=web`).
6. Проверка слоя мест: `curl "localhost:3000/api/places?categories=cafe&people=8"` — подборка;
   новые фильтры: `curl "localhost:3000/api/places?priceMax=1&sort=rating"`;
   `curl -X POST localhost:3000/api/suggest -H 'Content-Type: application/json' -d '{"placeId":"zerno-cafe","chatId":123}'`
   — без токена `502`, с токеном и реальным `chatId` карточка уходит в чат.
7. Проверка опроса (нужен токен и реальный `chatId`):
   `curl -X POST localhost:3000/api/poll -H 'Content-Type: application/json' -d '{"chatId":123,"placeIds":["zerno-cafe","probka-bar"],"expectedVoters":2}'`
   → `{ ok: true, pollId }`; карточки уходят в чат → жмём «Голосую» →
   `curl localhost:3000/api/poll/<pollId>` показывает голоса; после голосов всех двоих бот пишет победителя.
8. Тесты бота: `cd bot && npm test` (33 теста: фильтры, initData, вебхук, голосование).

## Известные ограничения

- Вебхук принимает только HTTPS на порту 443 с доверенным сертификатом (требование MAX);
  Long Polling в стартере не реализован.
- Лимит отправки: не более ~2 сообщений в секунду в один диалог/чат (очередь в `max-api.ts`).
- Голоса и опросы живут в памяти процесса — перезапуск всё сбрасывает.
- Проверка initData выключена по умолчанию; опросы без `expectedVoters` закрываются только по таймеру 10 минут.
- Сверено с документацией на сентябрь 2026 (Bot API + MAX UI + Bridge); старые
  примеры с `platform-api.max.ru` и токеном в query-параметрах больше не работают.

## Остановка и перезапуск

```bash
docker compose down        # остановить
docker compose up --build  # перезапустить с пересборкой
docker compose logs -f bot # посмотреть логи
```
