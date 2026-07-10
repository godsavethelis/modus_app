# Modus Mobile — контекст для агента

Мобильный диктофон-компаньон к веб-приложению Modus: запись аудио → расшифровка со спикерами и саммари → отправка в Inbox. Спека: `docs/mobile-app-spec.docx.md`, дизайн-гайд: `docs/design/DESIGN.md`.

**Задача:** фронтенд-прототип на хардкод-данных (моки). Бэкенд подключается позже заменой одного слоя — `src/services/api/`. UI на русском.

## Стек
Expo **SDK 54** (важно: не выше — Expo Go в App Store у владельца v54.0.2) + TypeScript + expo-router + React Query + expo-audio. iOS + Android + Web.

## Как запускать
```bash
npm install
npx expo start        # затем клавиша w — откроется в браузере (Expo Web)
```
Полируем дизайн/анимации **в браузере через Expo Web** (`localhost:8081`), а не на устройстве. Вход: любой email + пароль `1234`.

Гоняем и проверяем через preview-инструменты (`.claude/launch.json` → сервер `modus-web`, порт 8081).

## Архитектура
- `app/` — экраны (expo-router): `(auth)/login`, `(app)/index` (главный, кнопка REC + список), `(app)/record`, `(app)/processing/[id]`, `(app)/recording/[id]` (плеер + Транскрипт/Саммари).
- `src/services/api/` — **единственный слой для бэкенда** (моки + `TODO(backend)`); `src/services/mocks/data.ts` — весь хардкод.
- `src/theme/tokens.ts` — дизайн-токены. `src/components/` — UI. `src/hooks/` — React Query + `useMockPlayer`.

## Дизайн-язык
Эстетика Nothing: монохром + красный `#E5322C`, моноширинный шрифт (JetBrains Mono), тени карточек, фирменное «облако точек» (`DotCloud`). На вебе-десктопе приложение рендерится в рамке iPhone (`WebPhoneFrame`, только при ширине ≥700).

## Статус
Фаза 0 + все mock-able фичи спеки (группа A) готовы: пауза записи, экран отказа микрофона (флаг `MOCK_MIC_DENIED`), jump по таймкоду, перегенерация саммари, rename/delete через меню «...», тост, мок-плеер. Анимации прокачаны.

Осталось (группа B — натив/бэкенд): реальная запись/воспроизведение (`expo-audio`), реальный multipart-upload, перехват 401 / refresh токена. Помечено `TODO(recorder)` / `TODO(backend)`.

## Важные грабли
- **npm-кэш пользователя сломан** (EACCES в `~/.npm`). Для установок задавай writable-кэш: `npm_config_cache=<путь>` (или `npm config set cache "$HOME/.npm-cache"`).
- **Не апгрейди Expo SDK выше 54** без сверки с версией Expo Go на телефоне (Expo Go держит один SDK).
- **RN `Modal` на вебе** выносится в корень страницы и вылезает из рамки телефона — используй абсолютные оверлеи внутри экрана (см. `app/(app)/recording/[id].tsx`).
