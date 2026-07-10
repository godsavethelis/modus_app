/** Тонкая полоска прогресса обработки: плавно догоняет новое значение. */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  /** 0..1 */
  progress: number;
  height?: number;
}

export function ProgressBar({ progress, height = 3 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const bar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(bar, {
      toValue: progress,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [progress, bar]);

  return (
    <View style={[styles.track, { height, borderRadius: height }]}>
      <Animated.View
        style={[
          styles.fill,
          { borderRadius: height, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    track: { backgroundColor: c.chipBg, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: c.accent },
  });
