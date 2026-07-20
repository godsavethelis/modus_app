/**
 * Единый текстовый компонент — весь UI идёт через него (шрифт CoFo Sans).
 * Кегль прогоняется через readable() (масштаб под мобильные гайдлайны + пол).
 * Цвет по умолчанию берётся из активной темы (светлая/тёмная).
 */
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { font, fontSize, readable, TEXT_SCALE } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Weight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold';

interface TxtProps extends TextProps {
  weight?: Weight;
  size?: number;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function Txt({
  weight = 'regular',
  size = fontSize.body,
  color,
  align,
  style,
  ...rest
}: TxtProps) {
  const { colors } = useTheme();
  // Явный lineHeight из style масштабируем тем же множителем, что и кегль, —
  // иначе крупный текст со старым межстрочным станет тесным.
  const lh = (StyleSheet.flatten(style) as TextStyle | undefined)?.lineHeight;
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: font[weight], color: color ?? colors.ink, textAlign: align },
        style,
        {
          fontSize: readable(size),
          ...(typeof lh === 'number' ? { lineHeight: Math.round(lh * TEXT_SCALE) } : null),
        },
      ]}
    />
  );
}
