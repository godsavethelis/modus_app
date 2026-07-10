/**
 * «Пульс» записи — плотный ряд тонких вертикальных линий, как звуковая волна.
 * Огибающая из бегущих синусоид даёт живые «лепестки», каждая линия чуть
 * дрожит сама по себе. Монохром из темы (тёмные линии на светлом, светлые
 * на тёмном), так что работает в обеих версиях. На паузе замирает и гаснет.
 */
import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  /** Если не задана — ширина рамки телефона / окна. */
  width?: number;
  height?: number;
  /** Пауза записи: линии замирают и приглушаются. */
  paused?: boolean;
}

const BAR_W = 2.5;
const GAP = 4;
/** Минимальная высота линии — «тишина». */
const MIN_H = 3;

/**
 * Огибающая в точке u (0..1) в момент t: произведение двух медленных волн
 * даёт крупные лепестки с провалами, третья добавляет мелкую рябь.
 */
function envelope(u: number, t: number): number {
  const a = 0.55 + 0.45 * Math.sin(u * Math.PI * 2 * 1.2 - t * 1.6 + 0.7);
  const b = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 2.6 + t * 1.1 + 2.4);
  const ripple = 0.85 + 0.15 * Math.sin(u * Math.PI * 2 * 9 + t * 5.2);
  return Math.max(0.03, a * b * ripple);
}

export function PulseBars({ width: widthProp, height = 160, paused = false }: Props) {
  const { colors } = useTheme();
  const { width: winWidth } = useWindowDimensions();
  const [t, setT] = useState(0);
  const [measured, setMeasured] = useState(0);
  const tRef = useRef(0);
  // На вебе-десктопе приложение живёт в рамке телефона шириной 390 —
  // стартуем с этой оценки, onLayout уточняет фактическую ширину.
  const width = widthProp ?? (measured || Math.min(winWidth, 390));

  const onLayout = (e: LayoutChangeEvent) => setMeasured(e.nativeEvent.layout.width);

  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let lastRaf = 0;
    const t0 = performance.now() - tRef.current * 1000;
    const update = (now: number) => {
      tRef.current = (now - t0) / 1000;
      setT(tRef.current);
    };
    const loop = (now: number) => {
      lastRaf = now;
      update(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // Страховка: в скрытой вкладке браузер замораживает rAF — тикаем таймером.
    const fallback = setInterval(() => {
      const now = performance.now();
      if (now - lastRaf > 260) update(now);
    }, 260);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(fallback);
    };
  }, [paused]);

  const count = Math.floor((width - GAP) / (BAR_W + GAP));
  const startX = (width - count * (BAR_W + GAP) + GAP) / 2;
  const mid = height / 2;
  const bars = Array.from({ length: count }, (_, i) => {
    const u = i / (count - 1);
    const h = Math.max(MIN_H, envelope(u, t) * (height - 8));
    return { x: startX + i * (BAR_W + GAP), y: mid - h / 2, h };
  });

  return (
    <View
      pointerEvents="none"
      onLayout={widthProp ? undefined : onLayout}
      style={{ width: widthProp ?? '100%', height, opacity: paused ? 0.4 : 1 }}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {bars.map((b, i) => (
          <Rect key={i} x={b.x} y={b.y} width={BAR_W} height={b.h} rx={BAR_W / 2} fill={colors.ink} fillOpacity={0.9} />
        ))}
      </Svg>
    </View>
  );
}
