/**
 * Рамка iPhone для веб-превью на десктопе.
 * На нативе и на узком экране (реальный телефон) — просто отдаёт детей как есть.
 * В браузере на широком экране — оборачивает приложение в корпус телефона
 * со статус-баром (время, сигнал, Wi-Fi, батарея) и «динамическим островом».
 * Автоматически масштабируется под высоту окна. Статус-бар адаптируется к теме.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from './ui/Txt';
import { useTheme } from '@/theme/ThemeProvider';

const PHONE_W = 390;
const PHONE_H = 844;
const BEZEL_PAD = 12;
const OUTER_H = PHONE_H + BEZEL_PAD * 2;
const OUTER_W = PHONE_W + BEZEL_PAD * 2;

function currentTime(): string {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function StatusBar() {
  const { colors } = useTheme();
  const [time, setTime] = useState(currentTime());
  useEffect(() => {
    const id = setInterval(() => setTime(currentTime()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.statusBar}>
      <Txt weight="semibold" size={15} color={colors.ink}>
        {time}
      </Txt>
      <View style={styles.island} />
      <View style={styles.statusIcons}>
        <Ionicons name="cellular" size={16} color={colors.ink} />
        <Ionicons name="wifi" size={16} color={colors.ink} />
        <Ionicons name="battery-full" size={22} color={colors.ink} />
      </View>
    </View>
  );
}

export function WebPhoneFrame({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const framed = Platform.OS === 'web' && width >= 700;

  if (!framed) return <>{children}</>;

  const scale = Math.min(1, (height - 40) / OUTER_H, (width - 40) / OUTER_W);

  return (
    <View style={styles.backdrop}>
      <View style={[styles.bezel, { transform: [{ scale }] }]}>
        <View style={[styles.screen, { backgroundColor: colors.bg }]}>
          <StatusBar />
          <View style={styles.content}>{children}</View>
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#DEDDD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bezel: {
    padding: BEZEL_PAD,
    backgroundColor: '#111111',
    borderRadius: 56,
    boxShadow: '0 30px 80px rgba(17,17,17,0.35)',
  },
  screen: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 46,
    overflow: 'hidden',
  },
  statusBar: {
    height: 50,
    paddingHorizontal: 28,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  island: {
    position: 'absolute',
    top: 11,
    left: (PHONE_W - 120) / 2,
    width: 120,
    height: 34,
    borderRadius: 18,
    backgroundColor: '#000000',
  },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  content: { flex: 1 },
  homeIndicator: {
    position: 'absolute',
    bottom: 9,
    alignSelf: 'center',
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(140,140,140,0.5)',
  },
});
