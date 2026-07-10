import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Txt } from './ui/Txt';
import { palette, radius } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  onPress?: () => void;
  size?: number;
  /** 'rec' — красный круг с надписью REC; 'stop' — красный круг со стоп-квадратом. */
  variant?: 'rec' | 'stop';
}

export function RecordButton({ onPress, size = 140, variant = 'rec' }: Props) {
  const mount = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(mount, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }).start();
  }, [mount]);

  function handlePress() {
    ripple.setValue(0);
    Animated.timing(ripple, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    onPress?.();
  }

  const scale = Animated.multiply(
    mount.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }),
  );

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
            transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.7] }) }],
          },
        ]}
      />
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={() => Animated.timing(press, { toValue: 1, duration: 120, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(press, { toValue: 0, duration: 220, useNativeDriver: true }).start()}
        accessibilityRole="button"
        accessibilityLabel={variant === 'rec' ? 'Начать запись' : 'Остановить запись'}
        style={[styles.btn, { width: size, height: size, borderRadius: size / 2, opacity: mount, transform: [{ scale }] }]}
      >
        {variant === 'rec' ? (
          <Txt weight="bold" size={size * 0.17} color={palette.onAccent} style={styles.label}>
            REC
          </Txt>
        ) : (
          <View style={{ width: size * 0.19, height: size * 0.19, borderRadius: radius.chip, backgroundColor: palette.onAccent }} />
        )}
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ripple: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: palette.accent,
  },
  btn: {
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 16px 40px rgba(225,84,58,0.38)',
  },
  label: { letterSpacing: 2 },
});
