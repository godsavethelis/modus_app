# Modus Mobile

Мобильный диктофон Modus — компаньон к веб-приложению: запись аудио → расшифровка со спикерами и саммари → отправка в Inbox.

**Статус:** фронтенд-прототип на хардкод-данных (моки). Backend подключается заменой одного слоя — `src/services/api`.

Стек: **Expo (SDK 54) + TypeScript + expo-router + React Query**. iOS + Android + Web.

**Живое демо:** https://godsavethelis.github.io/modus_app/ — тот же прототип, собранный под веб. Логин: любой email + пароль `1234`.

---

## Запуск

```bash
npm install
npx expo start
```

Дальше — приложение **Expo Go** на телефоне (iPhone/Android): отсканируй QR из терминала. Либо клавиша `w` — откроется в браузере. Логин — любой email + пароль `1234`.

Полезное:

```bash
npm run typecheck   # проверка типов
npm run ios         # запуск в iOS-симуляторе (нужен Xcode)
npm run build:web   # прод-сборка веба в dist/
```

> Expo Go держит одну версию SDK — не апгрейди Expo выше **SDK 54** без сверки с телефоном.

---

## Как это устроено

```
app/                         экраны (expo-router, файловая маршрутизация)
  _layout.tsx                провайдеры + шрифты + редирект по авторизации
  (auth)/login.tsx           вход
  (app)/index.tsx            главный: кнопка REC + список записей
  (app)/record.tsx           запись (таймер, пульсирующие линии, живая расшифровка)
  (app)/profile.tsx          профиль: тёмная тема, выход
  (app)/recording/[id].tsx   детали: плеер + Транскрипт/Саммари + шеринг; здесь же состояния обработки
src/
  components/                переиспользуемый UI (RecordButton, RecordingCard, DotCloud…)
  services/
    api/                     ← ЕДИНСТВЕННЫЙ слой для бэкенда (см. ниже)
    mocks/data.ts            весь хардкод-контент
    storage/                 secure storage токенов (Keychain/Keystore)
  hooks/                     React Query хуки над api
  context/AuthContext.tsx    сессия, автовход, logout
  types/                     контракты данных = общий язык с бэкендом
  theme/tokens.ts            дизайн-токены (цвета, шрифт, тени, радиусы)
  lib/format.ts              форматирование дат/длительностей/таймкодов
```

---

## Подключение бэкенда (для CTO)

Весь «сервер» изолирован в **`src/services/api/`**. Экраны и навигацию трогать не нужно.

1. Открой `src/services/api/{auth,recordings,transcribe}.ts` — там функции с сигнатурами под реальные эндпоинты и пометками `TODO(backend)`.
2. Замени тело каждой функции: вместо чтения из `../mocks/data` — `fetch` к API. Базовый URL и заголовки — в `src/services/api/client.ts`.
3. Удали `src/services/mocks/` и импорты на него.
4. Токен-хранилище уже готово (`src/services/storage/secureStore.ts`), в `AuthContext` включи реальный refresh.

Эндпоинты (из внутренней спецификации; она не входит в этот репозиторий):

| Функция в коде | Эндпоинт |
| --- | --- |
| `authApi.login` / `refresh` | `POST /api/auth/login`, `POST /api/auth/refresh` |
| `recordingsApi.listRecordingsPage` | `GET /api/mobile/recording/list?page=&pageSize=` |
| `recordingsApi.getRecording` | `GET /api/mobile/recording/:id` |
| `recordingsApi.uploadRecording` | `POST /api/mobile/recording/upload` (multipart) |
| `recordingsApi.patchRecording` | `PATCH /api/mobile/recording/:id` |
| `recordingsApi.deleteRecording` | `DELETE /api/mobile/recording/:id` |
| `recordingsApi.sendToInbox` | `POST /api/mobile/recording/:id/send-inbox` |
| `recordingsApi.createShareLink` | `POST /api/mobile/recording/:id/share` |
| `recordingsApi.exportRecording` | `GET /api/mobile/recording/:id/export?kind=` |
| `transcribeApi.startTranscription` / `getStatus` | `POST /api/modus/transcribe/start`, `GET /api/modus/transcribe/status` |
| `transcribeApi.regenerateSummary` | `POST /api/modus/summarize/regenerate` |

**Как устроен поток обработки.** Загрузка аудио доходит до `ready` и останавливается: транскрипта и саммари ещё нет. Их запускает пользователь кнопкой «Сгенерировать» — идёт `transcribing → summarizing → ready`. Когда саммари готово, запись уезжает в Inbox сама: в моке это делает `transcribeApi.getStatus`, на бэкенде — summarize-job. Ручной `sendToInbox` оставлен как точка для переотправки, UI его не зовёт.

**Осознанные отличия от спеки.** Три решения приняты в ходе прототипирования и отличаются от буквы внутренней спецификации:

1. Расшифровка и саммари запускаются **вручную** — кнопкой «Сгенерировать» внутри записи (по спеке — автоматически после остановки записи). Пользователь сам решает, что отправлять в обработку.
2. Отправка в Inbox **автоматическая**, сразу после готовности саммари (по спеке — кнопка «Отправить в Modus»). Меньше действий; статус виден отметкой «Отправлено в Modus» в деталях записи.
3. Отдельного экрана Processing нет: прогресс обработки показывают полоска на карточке в списке и состояние внутри деталей записи.

**Демо-флаги** в `src/services/mocks/data.ts` — включают ветки ошибок, которые иначе не увидеть на моках: `MOCK_MIC_DENIED` (экран отказа микрофона), `MOCK_UPLOAD_FAILS` (сбой загрузки → карточка с retry), `MOCK_AUTH_FAILURE` (ошибка сети/сервера на логине). Ветку ошибки списка включает `SIMULATE_ERRORS` в `src/services/api/client.ts`.

**Ещё не подключено к нативу (помечено `TODO(recorder)`):** реальная запись/воспроизведение через `expo-audio` в `app/(app)/record.tsx` и плеер в деталях. Шеринг ссылки и экспорт файлом тоже мок — нужен нативный share-sheet. Сейчас это имитация (таймер + демо-текст).

---

## Сборка для команды (TestFlight)

Ежедневно смотрим через Expo Go. Готовые версии для команды — через EAS Build → TestFlight:

```bash
npm i -g eas-cli
eas login
eas build --profile preview --platform ios
eas submit --profile production --platform ios
```

Профили — в `eas.json`. Bundle ID: `com.modus.mobile`. Иконку/сплеш (`assets/`) добавить перед первым сабмитом.

---

## Дизайн

Визуальный язык — эстетика Nothing: монохром + красный `#E5322C`, моноширинный шрифт (JetBrains Mono), фирменное «облако точек». Токены — `src/theme/tokens.ts`.

---

## Деплой демо

`.github/workflows/deploy.yml` собирает веб-версию и публикует её на GitHub Pages при каждом пуше в `main`.

Pages отдаёт сайт из подпапки `/modus_app/`, поэтому сборке нужен base path — он приходит из переменной `PAGES_BASE_URL` (см. `app.config.js`). Локальный `expo start` её не выставляет и работает с корня, так что dev-режим не ломается.
