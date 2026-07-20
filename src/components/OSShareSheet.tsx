/**
 * Мок системного share sheet iOS (базовый экран для демо).
 * На вебе настоящего меню ОС нет — имитируем его, чтобы показать флоу
 * «файл саммари/транскрипт → мессенджер или Файлы».
 * Пункты чисто визуальные: тап по любому просто закрывает шторку.
 * TODO(recorder): на устройстве заменить на нативный Share.share() —
 * этот компонент удалить, экспорт-функция вернёт localUri файла.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from './ui/Txt';
import { radius, spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  /** Имя «файла» в шапке (напр. «Транскрипт — Лекция.txt»). */
  fileName: string;
  /** Подпись под именем (напр. «Текстовый файл»). */
  fileMeta: string;
  /** Иконка типа файла в шапке. */
  fileGlyph: keyof typeof Ionicons.glyphMap;
  onClose: () => void;
}

/** Приложения в верхнем ряду (фирменные цвета остаются в обеих темах). */
const APPS: { label: string; color: string; glyph: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'AirDrop', color: '#007AFF', glyph: 'radio-outline' },
  { label: 'Сообщения', color: '#34C759', glyph: 'chatbubble' },
  { label: 'Почта', color: '#2A8FF7', glyph: 'mail' },
  { label: 'Заметки', color: '#FFD426', glyph: 'document-text' },
];

/** Действия нижнего списка. */
const ACTIONS: { label: string; glyph: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Копировать', glyph: 'copy-outline' },
  { label: 'Сохранить в Файлы', glyph: 'folder-outline' },
];

export function OSShareSheet({ fileName, fileMeta, fileGlyph, onClose }: Props) {
  const { mode } = useTheme();
  const ios = useMemo(() => makeIOS(mode === 'dark'), [mode]);
  const styles = useMemo(() => makeStyles(ios), [ios]);

  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: 1, friction: 9, tension: 60, useNativeDriver: true }).start();
  }, [slide]);

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Закрыть меню" />
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [460, 0] }) }] },
        ]}
      >
        <View style={styles.grabber} />

        {/* Шапка: превью файла */}
        <View style={styles.preview}>
          <View style={styles.fileIcon}>
            <Ionicons name={fileGlyph} size={22} color={ios.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="semibold" size={13} color={ios.text} numberOfLines={1}>
              {fileName}
            </Txt>
            <Txt size={11} color={ios.secondary} numberOfLines={1} style={{ marginTop: 2 }}>
              {fileMeta}
            </Txt>
          </View>
        </View>

        {/* Ряд приложений */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.appsRow}
        >
          {APPS.map((app) => (
            <Pressable key={app.label} onPress={onClose} style={styles.app} accessibilityRole="button" accessibilityLabel={app.label}>
              <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                <Ionicons name={app.glyph} size={26} color={app.label === 'Заметки' ? '#1A1A1A' : '#FFFFFF'} />
              </View>
              <Txt size={10} color={ios.secondary} align="center" numberOfLines={1} style={{ maxWidth: 62 }}>
                {app.label}
              </Txt>
            </Pressable>
          ))}
        </ScrollView>

        {/* Список действий */}
        <View style={styles.actions}>
          {ACTIONS.map((a, i) => (
            <Pressable
              key={a.label}
              onPress={onClose}
              style={[styles.actionRow, i > 0 && styles.actionDivider]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <Txt size={14} color={ios.text} style={{ flex: 1 }}>
                {a.label}
              </Txt>
              <Ionicons name={a.glyph} size={20} color={ios.text} />
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

/** Палитра iOS-меню — не из токенов Modus: экран мимикрирует под систему. */
function makeIOS(dark: boolean) {
  return dark
    ? { sheet: '#1C1C1E', card: '#2C2C2E', text: '#FFFFFF', secondary: '#98989F', sep: 'rgba(255,255,255,0.10)' }
    : { sheet: '#EDEDF2', card: '#FFFFFF', text: '#111114', secondary: '#8A8A8F', sep: 'rgba(60,60,67,0.10)' };
}

type IOS = ReturnType<typeof makeIOS>;

const makeStyles = (ios: IOS) =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 60 },
    dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      backgroundColor: ios.sheet,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      boxShadow: '0 -12px 40px rgba(0,0,0,0.25)',
    },
    grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: ios.sep, marginBottom: spacing.md },
    preview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: ios.card,
      marginHorizontal: spacing.lg,
      borderRadius: 12,
      padding: spacing.md,
    },
    fileIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: ios.sheet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    appsRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.lg },
    app: { alignItems: 'center', gap: 6, width: 60 },
    appIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actions: {
      backgroundColor: ios.card,
      marginHorizontal: spacing.lg,
      borderRadius: 12,
      overflow: 'hidden',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
    },
    actionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ios.sep },
  });
