/**
 * Математика «живой» волны записи. Чистые функции без зависимостей от RN —
 * их рисует PulseBars, но проверять удобно отдельно.
 */

/** Слоговая пульсация, Гц: примерный темп обычной речи. */
export const SYLLABLE_HZ = 4.2;
/** Ритм слов: между ними речь ненадолго проваливается. */
export const WORD_HZ = 0.78;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * Громкость «голоса» в момент t — общая для всего ряда, поэтому волна
 * пульсирует целиком, как при живой речи. Слоги дают частый ритм, между
 * словами короткие провалы, дыхание медленно ведёт общий уровень.
 * Держим уровень высоким: тишина — это короткая пауза, а не норма.
 */
export function speechEnergy(t: number): number {
  // Внутри слова слог не обваливается в ноль — иначе волна выглядит мёртвой.
  const syllable = 0.25 + 0.75 * Math.pow(Math.abs(Math.sin(Math.PI * SYLLABLE_HZ * t)), 0.75);
  // Пауза между словами короткая (~18% цикла): гейт закрыт только на дне синуса.
  const gate = Math.sin(Math.PI * 2 * WORD_HZ * t + 0.4);
  const word = 0.22 + 0.78 * clamp01((gate + 0.85) / 0.45);
  const breath = 0.85 + 0.15 * Math.sin(Math.PI * 2 * 0.19 * t + 1.7);
  const jitter = 0.9 + 0.1 * Math.sin(t * 17.3);
  return Math.max(0.05, syllable * word * breath * jitter);
}

/**
 * Рельеф ряда в точке u (0..1): произведение двух бегущих лепестков даёт
 * провалы между «пачками» линий, рябь добавляет мелкую неровность.
 * Форма — только про рельеф; громкость приходит из speechEnergy.
 */
export function shape(u: number, t: number): number {
  const lobe = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 1.6 - t * 3.6 + 0.7);
  const lobe2 = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 2.7 + t * 2.4 + 2.4);
  const ripple = 0.85 + 0.15 * Math.sin(u * Math.PI * 2 * 9 + t * 9.5);
  return Math.max(0.02, lobe * lobe2 * ripple);
}
