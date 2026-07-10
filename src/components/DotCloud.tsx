/**
 * Живое «облако точек» — фирменная анимация Modus.
 * Точки органично дрейфуют по двум осям, дышат и мерцают. Немного красных вкраплений.
 * Цвет точек адаптируется к теме (тёмные на светлом, светлые на тёмном).
 */
import { useEffect, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  size?: number;
  count?: number;
  /** Доля красных точек 0..1. */
  accentRatio?: number;
}

interface Dot {
  left: number;
  top: number;
  r: number;
  ax: number;
  ay: number;
  durX: number;
  durY: number;
  delay: number;
  color: string;
  x: Animated.Value;
  y: Animated.Value;
}

function loop(value: Animated.Value, duration: number, delay: number) {
  return Animated.loop(
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]),
  );
}

export function DotCloud({ size = 240, count = 46, accentRatio = 0.14 }: Props) {
  const { colors } = useTheme();

  const dots = useMemo<Dot[]>(() => {
    const center = size / 2;
    return Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.pow(Math.random(), 0.65) * (size / 2 - 6);
      return {
        left: center + rad * Math.cos(angle),
        top: center + rad * Math.sin(angle),
        r: 1.3 + Math.random() * 3,
        ax: 5 + Math.random() * 12,
        ay: 6 + Math.random() * 14,
        durX: 2600 + Math.random() * 2600,
        durY: 2200 + Math.random() * 2400,
        delay: Math.random() * 2200,
        color: Math.random() < accentRatio ? colors.accent : colors.ink,
        x: new Animated.Value(0),
        y: new Animated.Value(0),
      };
    });
  }, [size, count, accentRatio, colors]);

  useEffect(() => {
    const loops = dots.flatMap((d) => [loop(d.x, d.durX, d.delay), loop(d.y, d.durY, d.delay * 0.6)]);
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: dot.left,
            top: dot.top,
            width: dot.r * 2,
            height: dot.r * 2,
            borderRadius: dot.r,
            backgroundColor: dot.color,
            opacity: dot.y.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.72] }),
            transform: [
              { translateX: dot.x.interpolate({ inputRange: [0, 1], outputRange: [dot.ax, -dot.ax] }) },
              { translateY: dot.y.interpolate({ inputRange: [0, 1], outputRange: [dot.ay, -dot.ay] }) },
              { scale: dot.x.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
