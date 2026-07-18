/**
 * Просмотрщик фото: тёмный лайтбокс с оригиналом в цвете.
 * Закрывается крестиком (меню действий у фото нет — только просмотр
 * и статус «в библиотеке»).
 */
import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/components/ui/Txt';
import { useRecording } from '@/hooks/useRecordings';
import { formatDateTime } from '@/lib/format';
import { goBack } from '@/lib/nav';
import { fontSize, radius, spacing } from '@/theme';

/** Экран всегда тёмный, независимо от темы приложения — это лайтбокс. */
const C = {
  bg: '#0A0A0A',
  ink: '#F4F4F4',
  muted: '#8A8A84',
  hairline: 'rgba(244,244,244,0.16)',
  accent: '#E1543A',
};

export default function PhotoViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(), []);
  const { data: photo, isLoading } = useRecording(id ?? '');

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.topBar}>
        <View style={{ width: 30 }} />
        <Pressable onPress={() => goBack(router)} style={styles.close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Закрыть">
          <Ionicons name="close" size={18} color={C.ink} />
        </Pressable>
      </View>

      {isLoading || !photo ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <>
          <View style={styles.photoWrap}>
            <Image source={{ uri: photo.photoUrl }} style={styles.photo} resizeMode="contain" />
          </View>

          <View style={styles.meta}>
            <Txt weight="bold" size={fontSize.base} color={C.ink}>
              {photo.title}
            </Txt>
            <Txt size={fontSize.caption} color={C.muted} style={{ marginTop: spacing.sm }}>
              {formatDateTime(photo.createdAt)}
              {photo.sizeMb ? ` · ${String(photo.sizeMb).replace('.', ',')} МБ` : ''}
            </Txt>
            {photo.sentToInbox ? (
              <View style={styles.statusChip}>
                <View style={styles.statusDot} />
                <Txt weight="semibold" size={fontSize.micro} color={C.muted} style={{ letterSpacing: 1.2 }}>
                  В БИБЛИОТЕКЕ
                </Txt>
              </View>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: spacing.xl },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    close: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: C.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    photoWrap: {
      flex: 1,
      marginTop: spacing.lg,
      borderRadius: radius.card,
      overflow: 'hidden',
      backgroundColor: '#161616',
    },
    photo: { flex: 1 },
    meta: { paddingTop: spacing.xl },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: C.hairline,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      marginTop: spacing.lg,
    },
    statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  });
