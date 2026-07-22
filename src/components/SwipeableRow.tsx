/**
 * Строка списка с быстрыми командами по свайпу влево — как в Apple Mail.
 * Обёртка над карточкой: сам RecordingCard про жест ничего не знает.
 *
 * Жест на PanResponder + Animated: в проекте нет gesture-handler/reanimated,
 * и тащить их ради одного экрана дороже, чем посчитать драг на JS.
 *
 * Механика:
 *   — перехватываем только горизонтальные движения, вертикаль уходит FlatList;
 *   — открытое состояние = два тайла по TILE (ink «Переименовать», accent «Удалить»);
 *   — за порогом полного свайпа красный тайл растягивается на всю строку и на
 *     отпускании сразу просит подтверждение удаления («полный свайп» из Mail).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from './ui/Txt';
import { radius, spacing, timing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** Ширина одного тайла. Два тайла = 144pt из 375 — заголовок карточки ещё виден. */
const TILE = 72;
const OPEN = TILE * 2;

/**
 * Порог «полного свайпа». Доли ширины мало: на узкой карточке (в вебе внутри
 * рамки телефона она ~280px) 55% = 154px почти упираются в открытое состояние
 * 144px, и открыть строку, не запустив удаление, невозможно. Поэтому берём
 * максимум из доли и запаса от открытого состояния.
 */
const fullThreshold = (rowW: number) => Math.max(rowW * 0.6, OPEN + 72);

interface Props {
  id: string;
  children: ReactNode;
  /** id открытой строки в списке — одновременно открыта только одна. */
  openId: string | null;
  onOpenChange: (id: string | null) => void;
  onRename: () => void;
  onDelete: () => void;
  /** Одноразовая подсказка: строка сама приоткрывается и возвращается. */
  hint?: boolean;
  /** Витрина состояний: строка статично раскрыта, жест выключен. */
  staticOpen?: boolean;
  /** Схлопнуть строку по высоте (удаление). По завершении зовёт onRemoved. */
  removing?: boolean;
  onRemoved?: () => void;
}

export function SwipeableRow({
  id,
  children,
  openId,
  onOpenChange,
  onRename,
  onDelete,
  hint = false,
  staticOpen = false,
  removing = false,
  onRemoved,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const x = useRef(new Animated.Value(staticOpen ? -OPEN : 0)).current;
  const collapse = useRef(new Animated.Value(1)).current;
  const openRef = useRef(staticOpen);
  const baseRef = useRef(0);
  const widthRef = useRef(0);
  const [isOpen, setIsOpen] = useState(staticOpen);
  const [rowW, setRowW] = useState(0);
  const [height, setHeight] = useState(0);

  // Хендлеры и id живут в ref: PanResponder создаётся один раз.
  const onOpenChangeRef = useRef(onOpenChange);
  const idRef = useRef(id);
  const onDeleteRef = useRef(onDelete);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
    idRef.current = id;
    onDeleteRef.current = onDelete;
  });

  const settle = useRef((open: boolean, notify = true) => {
    openRef.current = open;
    setIsOpen(open);
    Animated.spring(x, { toValue: open ? -OPEN : 0, friction: 9, tension: 90, useNativeDriver: true }).start();
    if (notify) onOpenChangeRef.current(open ? idRef.current : null);
  }).current;

  // Открылась другая строка — эта закрывается (без обратного уведомления,
  // иначе сбросили бы только что выставленный openId соседа).
  useEffect(() => {
    if (staticOpen) return;
    if (openId !== id && openRef.current) settle(false, false);
  }, [openId, id, staticOpen, settle]);

  // Свайп — скрытый жест, мышью в браузере его не угадать: один раз за
  // сессию верхняя карточка приоткрывается и возвращается.
  useEffect(() => {
    if (!hint || staticOpen) return;
    const anim = Animated.sequence([
      Animated.delay(700),
      Animated.timing(x, { toValue: -44, duration: timing.fast, useNativeDriver: true }),
      Animated.delay(300),
      Animated.spring(x, { toValue: 0, friction: 7, tension: 70, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [hint, staticOpen, x]);

  useEffect(() => {
    if (!removing || !height) return;
    Animated.timing(collapse, { toValue: 0, duration: timing.fast, useNativeDriver: false }).start(() => onRemoved?.());
  }, [removing, height, collapse, onRemoved]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Вертикаль отдаём скроллу списка, забираем только явную горизонталь.
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => {
          baseRef.current = openRef.current ? -OPEN : 0;
          onOpenChangeRef.current(idRef.current);
        },
        onPanResponderMove: (_e, g) => {
          const limit = widthRef.current || OPEN;
          x.setValue(Math.min(0, Math.max(-limit, baseRef.current + g.dx)));
        },
        onPanResponderRelease: (_e, g) => {
          const next = baseRef.current + g.dx;
          const w = widthRef.current;
          if (w > 0 && -next > fullThreshold(w)) {
            settle(true);
            onDeleteRef.current();
            return;
          }
          settle(-next > OPEN / 2 || g.vx < -0.35);
        },
        onPanResponderTerminate: () => settle(openRef.current),
      }),
    [x, settle],
  );

  // Красный тайл растягивается на всю строку, серый уходит в прозрачность —
  // за порогом полного свайпа остаётся только разрушающее действие.
  const full = rowW > 0 ? fullThreshold(rowW) : OPEN + 72;
  const deleteW = x.interpolate({
    inputRange: [-Math.max(rowW, full + 1), -full, 0],
    outputRange: [Math.max(rowW, full + 1), TILE, TILE],
    extrapolate: 'clamp',
  });
  const renameOpacity = x.interpolate({
    inputRange: [-full - 24, -full, 0],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      onLayout={(e) => {
        // Меряем один раз: во время схлопывания высота анимируется, и
        // обновление стейта из onLayout зациклило бы анимацию.
        if (!removing) setHeight(e.nativeEvent.layout.height);
      }}
      style={[
        styles.wrap,
        removing && height ? { height: Animated.multiply(collapse, height), opacity: collapse, overflow: 'hidden' } : null,
      ]}
    >
      <View
        style={styles.row}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setRowW(e.nativeEvent.layout.width);
        }}
      >
        {/* Тайлы обрезаны силуэтом карточки — карточка едет поверх и кладёт тень. */}
        <View style={styles.actions} pointerEvents={isOpen ? 'auto' : 'none'}>
          <Animated.View style={{ opacity: renameOpacity }}>
            <Pressable
              onPress={onRename}
              style={[styles.tile, { width: TILE, backgroundColor: colors.ink }]}
              accessibilityRole="button"
              accessibilityLabel="Переименовать"
            >
              <Ionicons name="pencil" size={18} color={colors.bg} />
              {/* «ПЕРЕИМЕНОВАТЬ» в тайл не влезает: readable() не опускает кегль
                  ниже 11px, тексту нужно 66px при доступных 50. Карандаш + «ИМЯ». */}
              <Txt weight="semibold" size={9.5} numberOfLines={1} color={colors.bg} style={styles.tileLabel}>
                ИМЯ
              </Txt>
            </Pressable>
          </Animated.View>
          <Animated.View style={{ width: deleteW }}>
            <Pressable
              onPress={onDelete}
              style={[styles.tile, { backgroundColor: colors.accent }]}
              accessibilityRole="button"
              accessibilityLabel="Удалить"
            >
              <Ionicons name="trash-outline" size={18} color={colors.onAccent} />
              <Txt weight="semibold" size={9.5} numberOfLines={1} color={colors.onAccent} style={styles.tileLabel}>
                УДАЛИТЬ
              </Txt>
            </Pressable>
          </Animated.View>
        </View>

        <Animated.View style={{ transform: [{ translateX: x }] }} {...(staticOpen ? {} : pan.panHandlers)}>
          {children}
          {/* Пока строка открыта, тап по карточке закрывает её, а не открывает запись. */}
          {isOpen && !staticOpen ? (
            <Pressable style={StyleSheet.absoluteFill} onPress={() => settle(false)} accessibilityLabel="Закрыть команды" />
          ) : null}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    /** overflow не режем: у карточки мягкая тень, она выходит за padding. */
    wrap: { paddingHorizontal: spacing.lg, paddingBottom: 12 },
    row: { position: 'relative' },
    actions: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      borderRadius: radius.card,
      overflow: 'hidden',
    },
    tile: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 4 },
    tileLabel: { letterSpacing: 0.6 },
  });
