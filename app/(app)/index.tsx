import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { RecordButton } from '@/components/RecordButton';
import { RecordingCard } from '@/components/RecordingCard';
import { useInfiniteRecordings } from '@/hooks/useRecordings';
import { fontSize, radius, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Recording } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteRecordings(15);
  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);

  // Плавающая REC появляется, когда пользователь прокрутил вниз.
  const [showFab, setShowFab] = useState(false);
  const fab = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fab, { toValue: showFab ? 1 : 0, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [showFab, fab]);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setShowFab(e.nativeEvent.contentOffset.y > 160);
  }

  function openRecording(rec: Recording) {
    // Запись открывается на любой стадии: пока идёт расшифровка,
    // экран записи сам показывает прогресс генерации текста.
    router.push(`/recording/${rec.id}`);
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

      {/* Плавающая быстрая кнопка записи (появляется пружиной в углу) */}
      <Animated.View
        pointerEvents={showFab ? 'box-none' : 'none'}
        style={[
          styles.fab,
          {
            opacity: fab,
            transform: [
              { scale: fab },
              { translateY: fab.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              { rotate: fab.interpolate({ inputRange: [0, 1], outputRange: ['-40deg', '0deg'] }) },
            ],
          },
        ]}
      >
        <Pressable
          onPress={() => router.push('/record')}
          style={styles.fabBtn}
          accessibilityRole="button"
          accessibilityLabel="Записать"
        >
          <Txt weight="bold" size={13} color={colors.onAccent} style={{ letterSpacing: 1 }}>
            REC
          </Txt>
        </Pressable>
      </Animated.View>
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
    fab: { position: 'absolute', right: spacing.xl, bottom: 28, zIndex: 30 },
    fabBtn: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 12px 30px rgba(225,84,58,0.42)',
    },
  });
