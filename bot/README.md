# Бэкенд бота MAX (`bot`)

Бэкенд чат-бота: Node.js + TypeScript + Express. Принимает апдейты MAX через
вебхук и раздаёт собранное мини-приложение как статику.

## Структура

- `src/index.ts` — точка входа: статика `public/` (сюда при Docker-сборке копируется `webapp/dist`), маршруты `/health` и `/webhook`, слушает `PORT` (по умолчанию 3000).
- `src/webhook.ts` — `POST /webhook`: сверяет заголовок `X-Max-Bot-Api-Secret` с `WEBHOOK_SECRET`, разбирает апдейты по `update_type` (`message_created`, `message_callback`, `bot_started` и остальные из https://dev.max.ru/docs-api/objects/Update). Сейчас отвечает эхом, реальная логика — за `TODO(scenario)` в `routeUpdate()`.
- `src/max-api.ts` — тонкая обёртка над MAX Bot API (`fetch`, база `https://platform-api2.max.ru`, токен в заголовке `Authorization`): `sendMessage`, `sendMessageToUser`, `subscribeWebhook`, `getSubscriptions`, `unsubscribeWebhook`.
- `src/places/` — слой мест: `types.ts` (контракт `PlaceResult`, синхронизирован с `webapp/src/types/places.ts`), `data.ts` (демо-датасет Москвы + станции метро), `service.ts` (фильтры, карточка), `router.ts` (эндпоинты `/api`).
- `Dockerfile` — многостадийная сборка: сначала `webapp`, потом `bot`, в финале `webapp/dist` → `public/`, запуск `node dist/index.js`.

## Эндпоинты мест

- `GET /api/places?categories=&people=&station=&radiusKm=&indoorOnly=` — подборка мест. Все параметры необязательные: `categories` — слаги через запятую (`cafe,restaurant,bar,coworking,park,museum,cinema,sport,karaoke,quest`), `people` — размер компании (место подходит, если `capacity >= people`), `station` + `radiusKm` — метро и радиус в км, `indoorOnly=true` — только помещения. Ошибки: `400` (неизвестная станция, плохой `people`/`radiusKm`).
- `POST /api/suggest` с `{ placeId, chatId, initData? }` — бот отправляет карточку места в чат (текст + кнопка «Открыть на карте»). Ошибки: `400` (нет `placeId`/`chatId`), `404` (место не найдено), `502` (MAX API недоступно). TODO: проверять `initData` по HMAC, чтобы посторонние не слали спам через бота.

## Команды

```bash
npm install    # установка зависимостей
npm run dev    # разработка с автоперезапуском (tsx watch)
npm run build  # компиляция TypeScript в dist/
npm start      # запуск собранного сервера
```

Нужные переменные окружения — в корневом `.env.example` (`MAX_BOT_TOKEN`, `WEBHOOK_SECRET`, `PORT`).

Документация: Bot API — https://dev.max.ru/docs-api.
