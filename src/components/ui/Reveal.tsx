/**
 * Ступенчатое появление контента: fade + лёгкий подъём снизу.
 * Даёт «оркестрованную» загрузку экрана — оборачивай блоки с нарастающим delay.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  delay?: number;
  /** Сдвиг снизу, px. */
  offset?: number;
  duration?: number;
  style?: ViewStyle;
}

export function Reveal({ children, delay = 0, offset = 14, duration = 460, style }: Props) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(p, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [p, delay, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: p,
          transform: [{ translateY: p.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
