/**
 * Текст с моноширинным шрифтом по умолчанию — весь UI использует его.
 * Цвет по умолчанию берётся из активной темы (светлая/тёмная).
 */
import { Text, type TextProps, type TextStyle } from 'react-native';
import { font, fontSize } from '@/theme';
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
  return (
    <Text
      {...rest}
      style={[{ fontFamily: font[weight], fontSize: size, color: color ?? colors.ink, textAlign: align }, style]}
    />
  );
}
