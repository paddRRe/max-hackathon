# Мини-приложение MAX (`webapp`)

Мини-приложение для мессенджера MAX: Vite + React + TypeScript, библиотека
компонентов MAX UI (`@maxhub/max-ui`) и MAX Bridge (`window.WebApp`).

## Структура

- `index.html` — подключает MAX Bridge (`https://st.max.ru/js/max-web-app.js`).
- `src/main.tsx` — заворачивает приложение в провайдер `MaxUI` и подключает стили библиотеки.
- `src/App.tsx` — экран-заглушка: заголовок продукта и место под основной сценарий (`TODO(scenario)`).
- `src/hooks/useWebApp.ts` — хук Bridge: отдаёт `isMax`, `platform` (ios/android/desktop/web), `initData`, `version`. Вне MAX возвращает dev-мок, поэтому `npm run dev` работает в обычном браузере.
- `src/types/webapp.d.ts` — минимальные типы для `window.WebApp`.
- `vite.config.ts` — `base: './'`, так как собранное приложение отдаётся не с корня домена (статикой бота).

## Команды

```bash
npm install   # установка зависимостей
npm run dev   # разработка (http://localhost:5173, вне MAX работает мок Bridge)
npm run build # проверка типов и production-сборка в dist/
npm run preview # локальный предпросмотр сборки
```

Документация: компоненты — https://dev.max.ru/ui, Bridge — https://dev.max.ru/docs/webapps/bridge.
