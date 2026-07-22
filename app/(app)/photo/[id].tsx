/**
 * Просмотрщик фото: тёмный лайтбокс с оригиналом в цвете.
 *
 * Топбар повторяет экран записи: слева закрытие, справа «...» с
 * переименованием и удалением. Экран живёт вне темы приложения (своя тёмная
 * палитра), поэтому диалоги идут с tone="dark", а статус-бар переключается
 * в светлые иконки через useImmersiveScreen.
 *
 * Смахивание влево/вправо листает фото в порядке ленты; аудиозаписи
 * пропускаются — в лайтбоксе перебираются только фото.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/components/ui/Txt';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RenameDialog } from '@/components/RenameDialog';
import { useDeleteRecording, usePhotoIds, useRecording, useRenameRecording } from '@/hooks/useRecordings';
import { formatDateTime } from '@/lib/format';
import { goBack } from '@/lib/nav';
import { useImmersiveScreen } from '@/theme/ImmersiveContext';
import { fontSize, radius, spacing, timing } from '@/theme';

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
  useImmersiveScreen();

  // Листаем без навигации: роут только догоняет параметром, иначе на каждом
  // смахивании экран перемонтировался бы и анимация рвалась.
  const [activeId, setActiveId] = useState(id ?? '');
  useEffect(() => {
    if (id) setActiveId(id);
  }, [id]);

  const { data: photo, isLoading } = useRecording(activeId);
  const { data: photoIds } = usePhotoIds();
  const rename = useRenameRecording();
  const del = useDeleteRecording();

  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const index = photoIds ? photoIds.indexOf(activeId) : -1;
  const prevId = index > 0 ? photoIds![index - 1] : null;
  const nextId = photoIds && index >= 0 && index < photoIds.length - 1 ? photoIds[index + 1] : null;

  const x = useRef(new Animated.Value(0)).current;
  const [frameW, setFrameW] = useState(0);

  // PanResponder создаётся один раз — свежие соседи и ширина живут в ref.
  const navRef = useRef({ prevId, nextId, frameW });
  useEffect(() => {
    navRef.current = { prevId, nextId, frameW };
  });

  // Слайды двигаем timing, а не spring: длительность предсказуема, и кадр
  // произвольной длины (фон вкладки, слабое устройство) не оставит фото
  // застрявшим на полпути.
  const slideTo = useRef((toValue: number, duration: number, after?: () => void) => {
    Animated.timing(x, { toValue, duration, useNativeDriver: true }).start(({ finished }) => {
      if (finished) after?.();
      else x.setValue(toValue);
    });
  }).current;

  const go = useRef((targetId: string, dir: -1 | 1) => {
    const w = navRef.current.frameW || 320;
    // Текущее фото уезжает, следующее заходит с противоположной стороны.
    slideTo(dir * w, timing.fast, () => {
      setActiveId(targetId);
      router.setParams({ id: targetId });
      x.setValue(-dir * w);
      slideTo(0, timing.base);
    });
  }).current;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
        onPanResponderMove: (_e, g) => {
          const nav = navRef.current;
          // На краю ленты фото пружинит, а не уезжает в пустоту.
          const atEdge = (g.dx < 0 && !nav.nextId) || (g.dx > 0 && !nav.prevId);
          x.setValue(atEdge ? g.dx / 4 : g.dx);
        },
        onPanResponderRelease: (_e, g) => {
          const nav = navRef.current;
          const threshold = Math.max(60, nav.frameW * 0.22);
          if (g.dx < -threshold && nav.nextId) return go(nav.nextId, -1);
          if (g.dx > threshold && nav.prevId) return go(nav.prevId, 1);
          slideTo(0, timing.fast);
        },
        onPanResponderTerminate: () => slideTo(0, timing.fast),
      }),
    [x, go],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack(router)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Закрыть">
          <Ionicons name="close" size={24} color={C.ink} />
        </Pressable>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Ещё">
          <Ionicons name="ellipsis-horizontal" size={21} color={C.ink} />
        </Pressable>
      </View>

      {isLoading || !photo ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <>
          <View style={styles.photoWrap} onLayout={(e) => setFrameW(e.nativeEvent.layout.width)}>
            <Animated.View style={[styles.photoSlide, { transform: [{ translateX: x }] }]} {...pan.panHandlers}>
              <Image source={{ uri: photo.photoUrl }} style={styles.photo} resizeMode="contain" />
            </Animated.View>
          </View>

          <View style={styles.meta}>
            <Txt weight="bold" size={fontSize.base} color={C.ink}>
              {photo.title}
            </Txt>
            <Txt size={fontSize.caption} color={C.muted} style={{ marginTop: spacing.sm }}>
              {formatDateTime(photo.createdAt)}
              {photo.sizeMb ? ` · ${String(photo.sizeMb).replace('.', ',')} МБ` : ''}
              {/* Без счётчика неочевидно, что фото можно листать. */}
              {photoIds && photoIds.length > 1 && index >= 0 ? ` · ${index + 1} из ${photoIds.length}` : ''}
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

      {/* Меню действий. Оверлей, а не RN Modal, — иначе на вебе вылезет из рамки телефона. */}
      {menuOpen ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setMenuOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setMenuOpen(false);
                setRenameOpen(true);
              }}
            >
              <Ionicons name="pencil" size={18} color={C.ink} />
              <Txt size={fontSize.base} color={C.ink}>
                Переименовать
              </Txt>
            </Pressable>
            <View style={styles.sheetDivider} />
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={C.accent} />
              <Txt size={fontSize.base} color={C.accent}>
                Удалить
              </Txt>
            </Pressable>
          </View>
        </View>
      ) : null}

      {renameOpen && photo ? (
        <RenameDialog
          tone="dark"
          value={photo.title}
          onSave={(title) => rename.mutate({ id: photo.id, title })}
          onClose={() => setRenameOpen(false)}
        />
      ) : null}

      {deleteOpen && photo ? (
        <ConfirmDialog
          tone="dark"
          title="Удалить фото?"
          text="Действие необратимо. Восстановить не получится."
          confirm="Удалить"
          onConfirm={() => {
            setDeleteOpen(false);
            del.mutate(photo.id);
            goBack(router);
          }}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: spacing.xl },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    photoWrap: {
      flex: 1,
      marginTop: spacing.lg,
      borderRadius: radius.card,
      overflow: 'hidden',
      backgroundColor: '#161616',
    },
    photoSlide: { flex: 1 },
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
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'flex-end',
      zIndex: 20,
    },
    overlayFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: '#161616',
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingBottom: spacing.xxxl,
      paddingTop: spacing.md,
    },
    grabber: {
      alignSelf: 'center',
      width: 38,
      height: 4,
      borderRadius: 3,
      backgroundColor: C.hairline,
      marginBottom: spacing.sm,
    },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    sheetDivider: { height: 1, backgroundColor: C.hairline, marginHorizontal: spacing.xl },
  });
