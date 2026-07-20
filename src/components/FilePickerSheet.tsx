/**
 * Мок системного iOS-пикера «Файлы» — выбор аудиофайла на транскрибацию.
 * Список недавних файлов телефона; тап по аудио в пределах лимита сразу
 * отдаёт файл наверх, тап по «проблемному» (видео / больше 500 МБ)
 * показывает тост с причиной, пикер остаётся открытым.
 * Палитра мимикрирует под систему (как OSShareSheet), не под токены Modus.
 * Абсолютный оверлей внутри экрана (не RN Modal — см. CLAUDE.md).
 * TODO(recorder): на устройстве заменить на expo-document-picker
 * (getDocumentAsync({ type: 'audio/*' })) — этот компонент удалить.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from './ui/Txt';
import { FILE_MAX_MB, mockFiles, type MockAudioFile } from '@/services/mocks/data';
import { spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  onClose: () => void;
  /** Выбран валидный аудиофайл; шторку закрывает родитель. */
  onPick: (file: MockAudioFile) => void;
}

/** Причина, по которой файл нельзя выбрать (null — можно). */
function rejectReason(f: MockAudioFile): string | null {
  if (!f.isAudio) return 'Только аудиофайлы';
  if (f.sizeMb > FILE_MAX_MB) return `Файл больше ${FILE_MAX_MB} МБ`;
  return null;
}

/** Подпись строки: «48 МБ · 52 мин · Диктофон». */
function fileMeta(f: MockAudioFile): string {
  const mins = Math.max(1, Math.round(f.durationSec / 60));
  return `${f.sizeMb} МБ · ${mins} мин · ${f.source}`;
}

export function FilePickerSheet({ onClose, onPick }: Props) {
  const { mode } = useTheme();
  const ios = useMemo(() => makeIOS(mode === 'dark'), [mode]);
  const styles = useMemo(() => makeStyles(ios), [ios]);
  const [toast, setToast] = useState<string | null>(null);

  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(slide, { toValue: 1, friction: 9, tension: 60, useNativeDriver: true }).start();
  }, [slide]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  function tap(f: MockAudioFile) {
    const reason = rejectReason(f);
    if (reason) setToast(reason);
    else onPick(f);
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Закрыть выбор файла" />
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [460, 0] }) }] },
        ]}
      >
        <View style={styles.grabber} />
        <View style={styles.head}>
          <Txt weight="semibold" size={15} color={ios.text}>
            Недавние
          </Txt>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Отмена">
            <Txt size={15} color={ios.tint}>
              Отмена
            </Txt>
          </Pressable>
        </View>

        <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            {mockFiles.map((f, i) => {
              const reason = rejectReason(f);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => tap(f)}
                  style={[styles.row, i > 0 && styles.rowDivider]}
                  accessibilityRole="button"
                  accessibilityLabel={reason ? `${f.name}: ${reason}` : `Выбрать ${f.name}`}
                >
                  <View style={[styles.fileIcon, reason ? styles.fileIconOff : null]}>
                    <Ionicons
                      name={f.isAudio ? 'musical-notes-outline' : 'videocam-outline'}
                      size={18}
                      color={reason ? ios.secondary : ios.tint}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt size={14} color={ios.text} numberOfLines={1}>
                      {f.name}
                    </Txt>
                    <Txt size={11} color={reason ? ios.danger : ios.secondary} numberOfLines={1} style={{ marginTop: 2 }}>
                      {reason ? `${f.sizeMb} МБ · ${reason.toLowerCase()}` : fileMeta(f)}
                    </Txt>
                  </View>
                  {reason ? null : (
                    <Ionicons name="chevron-forward" size={15} color={ios.secondary} />
                  )}
                </Pressable>
              );
            })}
          </View>
          <Txt size={11} color={ios.secondary} align="center" style={styles.hint}>
            Аудио до {FILE_MAX_MB} МБ — файл уйдёт на расшифровку
          </Txt>
        </ScrollView>

        {toast ? (
          <View style={styles.toastWrap} pointerEvents="none">
            <View style={styles.toast}>
              <Txt weight="semibold" size={12} color="#FFFFFF">
                {toast}
              </Txt>
            </View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

/** Палитра iOS-пикера — не из токенов Modus: экран мимикрирует под систему. */
function makeIOS(dark: boolean) {
  return dark
    ? { sheet: '#1C1C1E', card: '#2C2C2E', text: '#FFFFFF', secondary: '#98989F', sep: 'rgba(255,255,255,0.10)', tint: '#0A84FF', danger: '#FF453A' }
    : { sheet: '#EDEDF2', card: '#FFFFFF', text: '#111114', secondary: '#8A8A8F', sep: 'rgba(60,60,67,0.10)', tint: '#007AFF', danger: '#FF3B30' };
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
      maxHeight: '72%',
      boxShadow: '0 -12px 40px rgba(0,0,0,0.25)',
    },
    grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: ios.sep, marginBottom: spacing.md },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },
    listScroll: { flexGrow: 0 },
    list: {
      backgroundColor: ios.card,
      marginHorizontal: spacing.lg,
      borderRadius: 12,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: 11,
    },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ios.sep },
    fileIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: ios.sheet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileIconOff: { opacity: 0.7 },
    hint: { marginTop: spacing.md, paddingHorizontal: spacing.xl },
    toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 18, alignItems: 'center' },
    toast: {
      backgroundColor: '#111114',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: 22,
      boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
    },
  });
