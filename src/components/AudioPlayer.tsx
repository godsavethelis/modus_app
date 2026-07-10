/**
 * Плеер записи: таймкод, дорожка аудио и контролы (play, ±15 секунд).
 * Дорожку можно свернуть — остаётся компактная строка с контролами.
 * TODO(recorder): подключить expo-audio; интерфейс `player` не меняется.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Txt } from './ui/Txt';
import { formatTimecode } from '@/lib/format';
import { trackAmplitude } from '@/lib/pulseWave';
import { fontSize, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

const BAR_COUNT = 78;
const BAR_W = 2;
const TRACK_H = 44;
/** Шаг перемотки кнопками, секунды. */
const SKIP_SEC = 15;

/** Дорожка одна на все записи — считаем один раз. */
const BARS = Array.from({ length: BAR_COUNT }, (_, i) => trackAmplitude(i / (BAR_COUNT - 1)));

/** Один ряд линий дорожки. Рисуется дважды: серый низ и красная заливка сверху. */
const renderBars = (color: string) =>
  BARS.map((amp, i) => (
    <View
      key={i}
      style={{ width: BAR_W, height: Math.max(2, amp * TRACK_H), borderRadius: 1, backgroundColor: color }}
    />
  ));

interface PlayerLike {
  positionSec: number;
  playing: boolean;
  progress: number;
  toggle: () => void;
  seekTo: (sec: number) => void;
  seekBy: (deltaSec: number) => void;
}

interface Props {
  player: PlayerLike;
  durationSec: number;
  /** Внешнее сворачивание дорожки — например, при скролле текста под плеером. */
  collapsed?: boolean;
}

export function AudioPlayer({ player, durationSec, collapsed }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(true);
  const [trackW, setTrackW] = useState(0);

  // Скролл управляет дорожкой снаружи; вручную её по-прежнему можно раскрыть.
  useEffect(() => {
    if (collapsed !== undefined) setOpen(!collapsed);
  }, [collapsed]);

  return (
    <View style={styles.wrap}>
      <View style={styles.timeRow}>
        <View style={styles.time}>
          <Txt size={fontSize.small}>{formatTimecode(player.positionSec)}</Txt>
          <Txt size={fontSize.small} color={colors.textMuted}>
            {` / ${formatTimecode(durationSec)}`}
          </Txt>
        </View>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Свернуть дорожку' : 'Развернуть дорожку'}
        >
          <Ionicons name={open ? 'contract-outline' : 'expand-outline'} size={18} color={colors.ink} />
        </Pressable>
      </View>

      {open ? (
        <Pressable
          style={styles.track}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          onPress={(e) => {
            if (trackW > 0) player.seekTo((e.nativeEvent.locationX / trackW) * durationSec);
          }}
        >
          {renderBars(colors.textMuted)}
          {/* Красная заливка проигранной части: слой тех же линий, обрезанный
              по прогрессу. Непрерывная — видно движение, а не скачки по линиям. */}
          {trackW > 0 ? (
            <View
              pointerEvents="none"
              style={[styles.fill, { width: Math.min(trackW, player.progress * trackW) }]}
            >
              <View style={[styles.fillRow, { width: trackW }]}>{renderBars(colors.accent)}</View>
            </View>
          ) : null}
          {/* Метка позиции: на долгих записях заливка растёт медленно,
              а бегущая черта сразу показывает, что аудио играет. */}
          {trackW > 0 && (player.playing || player.progress > 0) ? (
            <View
              pointerEvents="none"
              style={[styles.playhead, { left: Math.min(trackW - 2, player.progress * trackW) }]}
            />
          ) : null}
        </Pressable>
      ) : null}

      {/* Классическая раскладка, как в Apple Music: перемотка по бокам, play в центре. */}
      <View style={styles.controls}>
        <Pressable
          onPress={() => player.seekBy(-SKIP_SEC)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Назад 15 секунд"
        >
          <Ionicons name="play-back" size={24} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={player.toggle}
          style={styles.play}
          accessibilityRole="button"
          accessibilityLabel={player.playing ? 'Пауза' : 'Воспроизвести'}
        >
          <Ionicons name={player.playing ? 'pause' : 'play'} size={19} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={() => player.seekBy(SKIP_SEC)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Вперёд 15 секунд"
        >
          <Ionicons name="play-forward" size={24} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      marginHorizontal: spacing.xl,
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.hairline,
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    time: { flexDirection: 'row', alignItems: 'baseline' },
    track: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: TRACK_H,
      marginTop: spacing.md,
    },
    fill: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
    fillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: TRACK_H,
    },
    playhead: {
      position: 'absolute',
      top: 2,
      bottom: 2,
      width: 2,
      borderRadius: 1,
      backgroundColor: colors.accent,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xxxl,
      marginTop: spacing.lg,
      paddingBottom: spacing.xs,
    },
    play: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.chipBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
