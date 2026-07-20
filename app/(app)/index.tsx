import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { FilePickerSheet } from '@/components/FilePickerSheet';
import { PhotoSheet } from '@/components/PhotoSheet';
import { RecordButton } from '@/components/RecordButton';
import { RecordingCard } from '@/components/RecordingCard';
import { useInfiniteRecordings } from '@/hooks/useRecordings';
import { recordingsApi } from '@/services/api';
import { fontSize, radius, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { MockAudioFile } from '@/services/mocks/data';
import type { Recording } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteRecordings(15);
  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  // Чёрный «+» справа снизу раскрывает меню создания: «Фото» и «Файл».
  // Пока герой-REC на экране, пункта «Запись» в меню нет (он дублировал бы
  // героя); после скролла REC «переезжает» в меню третьей опцией.
  const [scrolled, setScrolled] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fileSheetOpen, setFileSheetOpen] = useState(false);

  const dial = useRef(new Animated.Value(0)).current; // раскрытие опций «+»
  useEffect(() => {
    Animated.spring(dial, { toValue: dialOpen ? 1 : 0, friction: 8, tension: 80, useNativeDriver: true }).start();
  }, [dialOpen, dial]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setScrolled(e.nativeEvent.contentOffset.y > 160);
  }

  function onFabPress() {
    setDialOpen((open) => !open);
  }

  function sendPhotos(photos: { photoUrl: string; thumbUrl: string }[]) {
    setSheetOpen(false);
    // Загрузка в фоне: карточки появляются в ленте со статусом «Загрузка…».
    recordingsApi
      .uploadPhotos(photos)
      .then(() => queryClient.invalidateQueries({ queryKey: ['recordings'] }))
      .catch(() => {});
  }

  function sendFile(file: MockAudioFile) {
    setFileSheetOpen(false);
    // Как у фото: карточка появляется в ленте со статусом «Загрузка…»,
    // расшифровку пользователь запустит из деталей кнопкой «Сгенерировать».
    recordingsApi
      .uploadAudioFile(file)
      .then(() => queryClient.invalidateQueries({ queryKey: ['recordings'] }))
      .catch(() => {});
  }

  function openRecording(rec: Recording) {
    // Запись открывается на любой стадии: пока идёт расшифровка,
    // экран записи сам показывает прогресс генерации текста.
    if (rec.kind === 'photo') router.push(`/photo/${rec.id}`);
    else router.push(`/recording/${rec.id}`);
  }

  const header = (
    <View>
      <View style={styles.hero}>
        <RecordButton size={140} onPress={() => router.push('/record')} />
      </View>
      <View style={styles.grabber} />
      <View style={styles.sheetHeader}>
        <Txt weight="bold" size={fontSize.title}>
          Записи
        </Txt>
      </View>
    </View>
  );

  // Спека, edge case «пустой список»: объяснение + CTA на первую запись.
  const empty = (
    <View style={styles.empty}>
      <Txt weight="bold" size={fontSize.lg} align="center">
        Пока нет записей
      </Txt>
      <Txt size={fontSize.small} color={colors.textSecondary} align="center" style={styles.emptyHint}>
        Запиши встречу или лекцию — расшифровка и саммари появятся здесь.
      </Txt>
      <Pressable onPress={() => router.push('/record')} style={styles.emptyBtn}>
        <Txt weight="semibold" size={fontSize.small} color={colors.onAccent}>
          Сделать первую запись
        </Txt>
      </Pressable>
    </View>
  );

  const footer = isFetchingNextPage ? (
    <View style={styles.footerLoader}>
      <ActivityIndicator color={colors.accent} />
      <Txt size={fontSize.small} color={colors.textMuted}>
        Загружаем…
      </Txt>
    </View>
  ) : !hasNextPage && items.length > 0 ? (
    <View style={styles.footerEnd}>
      <Txt size={fontSize.small} color={colors.textMuted}>
        Это все записи
      </Txt>
    </View>
  ) : (
    <View style={{ height: 40 }} />
  );

  return (
    <Screen bottomInset={false}>
      <View style={styles.topBar}>
        <Txt weight="bold" size={fontSize.lg} style={{ letterSpacing: 2.5 }}>
          MODUS
        </Txt>
        <Pressable onPress={() => router.push('/profile')} style={styles.avatar} hitSlop={8}>
          <Ionicons name="person-outline" size={16} color={colors.ink} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Txt size={fontSize.body} color={colors.textSecondary}>
            Не удалось загрузить
          </Txt>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Txt weight="semibold" size={fontSize.small} color={colors.onAccent}>
              Повторить
            </Txt>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <RecordingCard recording={item} onPress={() => openRecording(item)} />
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={empty}
          ListFooterComponent={footer}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      {/* Затемнение + две опции раскрытого «+» */}
      {dialOpen ? (
        <Pressable style={styles.dim} onPress={() => setDialOpen(false)} accessibilityLabel="Закрыть меню" />
      ) : null}
      <Animated.View
        pointerEvents={dialOpen ? 'box-none' : 'none'}
        style={[
          styles.dial,
          {
            opacity: dial,
            transform: [{ translateY: dial.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
          },
        ]}
      >
        {scrolled ? (
          <View style={styles.dialRow}>
            <View style={styles.dialLabel}>
              <Txt weight="semibold" size={fontSize.small}>
                Запись
              </Txt>
            </View>
            <Pressable
              onPress={() => {
                setDialOpen(false);
                router.push('/record');
              }}
              style={[styles.dialBtn, { backgroundColor: colors.accent, boxShadow: '0 10px 24px rgba(225,84,58,0.4)' }]}
              accessibilityRole="button"
              accessibilityLabel="Записать аудио"
            >
              <Txt weight="bold" size={11} color={colors.onAccent} style={{ letterSpacing: 1 }}>
                REC
              </Txt>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.dialRow}>
          <View style={styles.dialLabel}>
            <Txt weight="semibold" size={fontSize.small}>
              Фото
            </Txt>
          </View>
          <Pressable
            onPress={() => {
              setDialOpen(false);
              setSheetOpen(true);
            }}
            style={[styles.dialBtn, { backgroundColor: colors.ink }]}
            accessibilityRole="button"
            accessibilityLabel="Отправить фото"
          >
            <Ionicons name="camera-outline" size={19} color={colors.bg} />
          </Pressable>
        </View>
        <View style={styles.dialRow}>
          <View style={styles.dialLabel}>
            <Txt weight="semibold" size={fontSize.small}>
              Файл
            </Txt>
          </View>
          <Pressable
            onPress={() => {
              setDialOpen(false);
              setFileSheetOpen(true);
            }}
            style={[styles.dialBtn, { backgroundColor: colors.ink }]}
            accessibilityRole="button"
            accessibilityLabel="Загрузить аудиофайл"
          >
            <Ionicons name="musical-notes-outline" size={19} color={colors.bg} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Чёрный FAB «+» (поворачивается в «×», пока меню открыто) */}
      <Pressable
        onPress={onFabPress}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel={dialOpen ? 'Закрыть меню' : 'Создать'}
      >
        <Animated.View
          style={[
            styles.fabIcon,
            { transform: [{ rotate: dial.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] },
          ]}
        >
          <Ionicons name="add" size={26} color={colors.bg} />
        </Animated.View>
      </Pressable>

      {sheetOpen ? (
        <PhotoSheet
          onClose={() => setSheetOpen(false)}
          onOpenCamera={() => {
            setSheetOpen(false);
            router.push('/camera');
          }}
          onSend={sendPhotos}
        />
      ) : null}

      {fileSheetOpen ? (
        <FilePickerSheet onClose={() => setFileSheetOpen(false)} onPick={sendFile} />
      ) : null}
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xxl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, paddingBottom: 52 },
    grabber: {
      alignSelf: 'center',
      width: 38,
      height: 4,
      borderRadius: 3,
      backgroundColor: colors.hairline,
      marginBottom: spacing.sm,
    },
    sheetHeader: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
    cardWrap: { paddingHorizontal: spacing.lg, paddingBottom: 12 },
    empty: { alignItems: 'center', paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, gap: spacing.sm },
    emptyHint: { lineHeight: 18, maxWidth: 260 },
    emptyBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      marginTop: spacing.sm,
    },
    footerLoader: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
    footerEnd: { alignItems: 'center', paddingVertical: spacing.xxl },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.xxl },
    retryBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    dim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(17,17,17,0.35)',
      zIndex: 25,
    },
    dial: { position: 'absolute', right: spacing.xl, bottom: 104, gap: spacing.md, zIndex: 30, alignItems: 'flex-end' },
    dialRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dialLabel: {
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.hairline,
      boxShadow: '0 6px 18px rgba(17,17,17,0.16)',
    },
    dialBtn: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 24px rgba(17,17,17,0.3)',
    },
    fab: {
      position: 'absolute',
      right: spacing.xl,
      bottom: 28,
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: colors.ink,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 12px 30px rgba(17,17,17,0.35)',
      zIndex: 30,
    },
    fabIcon: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  });
