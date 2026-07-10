/**
 * Заглушка HTTP-клиента. Сейчас имитирует сеть (задержка + опциональные ошибки).
 *
 * === ДЛЯ БЭКЕНД-РАЗРАБОТЧИКА ===
 * Замени тело функций в auth.ts / recordings.ts / transcribe.ts на реальные
 * fetch-запросы. Базовый адрес и заголовок авторизации бери отсюда.
 */

export const API_BASE_URL = 'https://api.modus.app'; // TODO(backend): реальный адрес

/** Искусственная задержка, чтобы прототип вёл себя как настоящая сеть. */
export function delay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: 'network' | 'auth' | 'server' | 'validation' = 'server',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Флаг для ручной проверки ветки ошибок в UI (empty/error/retry).
 * Выстави true в дев-сборке, чтобы увидеть, как экраны реагируют на сбой сети.
 */
export const SIMULATE_ERRORS = false;

export function maybeFail(chance = 0): void {
  if (SIMULATE_ERRORS && Math.random() < chance) {
    throw new ApiError('Нет соединения с сервером', 'network');
  }
}
