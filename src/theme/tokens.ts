/**
 * Дизайн-токены Modus — единый источник правды для визуального языка.
 * Эстетика: Nothing / монохром + красный акцент, моноширинный шрифт.
 *
 * Меняешь стиль приложения — меняешь здесь, а не по экранам.
 */

export const palette = {
  // Нейтральные
  ink: '#111111', // основной чёрный (текст, кнопки)
  bg: '#F3F2EF', // фон страницы (тёплый светло-серый)
  surface: '#FFFFFF', // карточки
  textSecondary: '#8C8C86',
  textMuted: '#B4B4AE',
  hairline: 'rgba(17,17,17,0.09)',
  chipBg: '#E9E8E3',

  // Акцент
  accent: '#E1543A', // фирменный красный
  onAccent: '#FFFFFF',

  // Статусы
  dangerBg: '#FCEBEB',
  dangerText: '#A32D2D',
  tag: '#3778C2',
} as const;

/** Тёмная тема (заложена заранее; по умолчанию приложение светлое). */
export const paletteDark = {
  ink: '#F4F4F4',
  bg: '#0A0A0A',
  surface: '#161616',
  textSecondary: '#8A8A84',
  textMuted: '#5E5E5A',
  hairline: 'rgba(244,244,244,0.10)',
  chipBg: '#1E1E1E',
  accent: '#E1543A',
  onAccent: '#FFFFFF',
  dangerBg: '#2A1414',
  dangerText: '#F09999',
  tag: '#5B9BE0',
} as const;

export type Palette = typeof palette;

/**
 * Тёмная палитра, приведённая к Palette. Нужна экранам и диалогам, которые
 * всегда тёмные независимо от темы приложения (лайтбокс фото). Литеральные
 * типы `as const` не пересекаются между палитрами — отсюда двойное приведение.
 */
export const alwaysDark = paletteDark as unknown as Palette;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 26,
  xxxl: 34,
} as const;

export const radius = {
  chip: 8,
  card: 18,
  sheet: 26,
  pill: 24,
  full: 999,
} as const;

/**
 * CoFo Sans — локальные .ttf из assets/fonts (грузит useFonts в app/_layout).
 * У гарнитуры три начертания (Regular/Medium/Bold), поэтому 5 семантических
 * весов раскладываются в 3 физических с сохранением иерархии
 * regular(400) < semibold(500) < bold(700):
 *   light/regular → Regular, medium/semibold → Medium, bold → Bold.
 */
export const font = {
  light: 'CoFoSans-Regular',
  regular: 'CoFoSans-Regular',
  medium: 'CoFoSans-Medium',
  semibold: 'CoFoSans-Medium',
  bold: 'CoFoSans-Bold',
} as const;

/**
 * Базовые кегли (пропорции визуального языка). На рендере `Txt` прогоняет их
 * через `readable()` — не читай эти числа как итоговые px на экране.
 */
export const fontSize = {
  micro: 10,
  caption: 11,
  small: 12,
  body: 13,
  base: 14,
  lg: 16,
  title: 20,
  display: 26,
  hero: 44,
} as const;

/**
 * Читаемость под мобильные гайдлайны. Базовые кегли задуманы мелко (техно-моно-
 * эстетика: тело 12–14, лейблы 10–11), а Apple HIG (тело 17, минимум 11) и
 * Material 3 (тело 14–16, минимум 12) требуют крупнее. `readable()` — единая
 * точка приведения: множитель сохраняет иерархию 1:1, пол не даёт тексту уйти
 * ниже порога читаемости (Apple Caption 2 = 11pt). Применяется в `Txt` (весь
 * текст идёт через него) и в полях ввода (они `Txt` минуют).
 */
export const TEXT_SCALE = 1.18;
export const MIN_FONT_SIZE = 11;
export const readable = (size: number) => Math.max(Math.round(size * TEXT_SCALE), MIN_FONT_SIZE);

/** Тайминги анимаций (мс). */
export const timing = {
  fast: 180,
  base: 320,
  slow: 550,
  breath: 4000,
} as const;

export const shadow = {
  card: {
    shadowColor: '#111111',
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
} as const;
