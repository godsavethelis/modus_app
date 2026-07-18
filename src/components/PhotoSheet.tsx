/**
 * Шторка выбора фото (паттерн Telegram): первый тайл — «камера»,
 * дальше — последние снимки галереи с мультивыбором кружочками.
 * Абсолютный оверлей внутри экрана (не RN Modal — тот вылезает из рамки
 * телефона на вебе, см. CLAUDE.md).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from './ui/Txt';
import { mockGallery } from '@/services/mocks/data';
import { fontSize, radius, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  onClose: () => void;
  onOpenCamera: () => void;
  /** Отправка выбранных фото; шторку закрывает родитель. */
  onSend: (photos: { photoUrl: string; thumbUrl: string }[]) => void;
}

export function PhotoSheet({ onClose, onOpenCamera, onSend }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selected, setSelected] = useState<string[]>([]);

  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: 1, friction: 9, tension: 60, useNativeDriver: true }).start();
  }, [slide]);

  function toggle(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function send() {
    const photos = selected
      .map((id) => mockGallery.find((g) => g.id === id))
      .filter((g): g is (typeof mockGallery)[number] => !!g)
      .map(({ photoUrl, thumbUrl }) => ({ photoUrl, thumbUrl }));
    if (photos.length > 0) onSend(photos);
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Закрыть выбор фото" />
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }] },
        ]}
      >
        <View style={styles.grabber} />
        <View style={styles.head}>
          <Txt weight="bold" size={fontSize.caption} style={{ letterSpacing: 2 }}>
            НЕДАВНИЕ
          </Txt>
          <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Закрыть">
            <Ionicons name="close" size={15} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {/* Тайл камеры. TODO(recorder): на устройстве — живое превью expo-camera. */}
          <Pressable onPress={onOpenCamera} style={[styles.tile, styles.camTile]} accessibilityRole="button" accessibilityLabel="Открыть камеру">
            <View style={styles.dots} pointerEvents="none">
              {Array.from({ length: 24 }).map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
            <Ionicons name="camera-outline" size={22} color="#F4F4F4" />
            <Txt weight="bold" size={8} color="#F4F4F4" style={{ letterSpacing: 1.5 }}>
              КАМЕРА
            </Txt>
          </Pressable>

          {mockGallery.map((g) => {
            const order = selected.indexOf(g.id);
            return (
              <Pressable key={g.id} onPress={() => toggle(g.id)} style={styles.tile}>
                <Image source={{ uri: g.thumbUrl }} style={styles.tileImg} />
                <View style={[styles.ring, order >= 0 && styles.ringOn]}>
                  {order >= 0 ? (
                    <Txt weight="bold" size={9} color={colors.onAccent}>
                      {order + 1}
                    </Txt>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {selected.length > 0 ? (
          <Pressable onPress={send} style={styles.send} accessibilityRole="button">
            <Txt weight="bold" size={fontSize.small} color={colors.onAccent} style={{ letterSpacing: 1.5 }}>
              ОТПРАВИТЬ {selected.length}
            </Txt>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const TILE = '31.5%';

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 40 },
    dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,17,17,0.42)' },
    sheet: {
      backgroundColor: c.bg,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      maxHeight: '78%',
      boxShadow: '0 -12px 40px rgba(17,17,17,0.25)',
    },
    grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 3, backgroundColor: c.hairline, marginBottom: spacing.sm },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.md,
    },
    close: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: spacing.sm },
    tile: {
      width: TILE,
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 2,
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.hairline,
    },
    tileImg: { width: '100%', height: '100%' },
    camTile: { backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', gap: 6 },
    dots: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignContent: 'space-around',
      justifyContent: 'space-around',
      opacity: 0.3,
    },
    dot: { width: 2.5, height: 2.5, borderRadius: 1.5, backgroundColor: '#F4F4F4' },
    ring: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 19,
      height: 19,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 0 6px rgba(17,17,17,0.35)',
    },
    ringOn: { backgroundColor: c.accent, borderColor: '#FFFFFF' },
    send: {
      backgroundColor: c.accent,
      borderRadius: radius.pill,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: spacing.sm,
      boxShadow: '0 10px 26px rgba(225,84,58,0.4)',
    },
  });
