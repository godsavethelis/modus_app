import { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { Txt } from './ui/Txt';
import { useProcessingStatus, useRetryProcessing } from '@/hooks/useRecordings';
import { formatDateTime, formatDuration } from '@/lib/format';
import { radius, shadow, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { ProcessingStatus, Recording } from '@/types';

interface Props {
  recording: Recording;
  onPress?: () => void;
}

const PROCESSING: ProcessingStatus[] = ['uploading', 'transcribing', 'summarizing'];

const STAGE_LABEL: Partial<Record<ProcessingStatus, string>> = {
  uploading: 'ЗАГРУЗКА…',
  transcribing: 'РАСШИФРОВКА…',
  summarizing: 'САММАРИ…',
  failed: 'ОШИБКА',
};


export function RecordingCard({ recording, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Пока запись обрабатывается, карточка сама опрашивает статус
  // и показывает полоску прогресса вместо даты.
  const isProcessing = PROCESSING.includes(recording.status);
  const { data: live } = useProcessingStatus(recording.id, isProcessing);
  const retry = useRetryProcessing(recording.id);
  const stage = live?.status ?? recording.status;
  const progress = live?.progress ?? recording.progress ?? 0;

  const showLoader = isProcessing && stage !== 'ready';
  const isPhoto = recording.kind === 'photo';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        {/* Ч/б миниатюра фото: цвет остаётся в просмотрщике, лента — монохромная. */}
        {isPhoto && recording.thumbUrl ? (
          <Image source={{ uri: recording.thumbUrl }} style={styles.thumb} />
        ) : null}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Txt weight="semibold" size={13} numberOfLines={2} style={{ lineHeight: 18, flex: 1 }}>
              {recording.title}
            </Txt>
            {/* Отправка в Inbox автоматическая — бейджем её не дублируем, остаётся только «ошибка». */}
            {stage === 'failed' ? (
              <View style={styles.errorPill}>
                <Txt weight="semibold" size={9.5} color={colors.dangerText} style={{ letterSpacing: 0.5 }}>
                  ОШИБКА
                </Txt>
              </View>
            ) : null}
            {/* Спека: карточка failed — кнопка retry. Запускает обработку заново. */}
            {stage === 'failed' ? (
              <Pressable
                onPress={() => retry.mutate()}
                disabled={retry.isPending}
                hitSlop={8}
                style={styles.retryBtn}
                accessibilityRole="button"
                accessibilityLabel="Повторить обработку"
              >
                {retry.isPending ? (
                  <ActivityIndicator size="small" color={colors.dangerText} style={{ transform: [{ scale: 0.6 }] }} />
                ) : (
                  <Ionicons name="refresh" size={14} color={colors.dangerText} />
                )}
              </Pressable>
            ) : null}
          </View>
          {showLoader ? (
            <View style={styles.procWrap}>
              <Txt weight="semibold" size={9.5} color={stage === 'failed' ? colors.dangerText : colors.accent} style={{ letterSpacing: 1.2 }}>
                {STAGE_LABEL[stage] ?? 'ОБРАБОТКА…'}
              </Txt>
              <ProgressBar progress={progress} />
            </View>
          ) : (
            <Txt size={10.5} color={colors.textMuted} style={{ marginTop: spacing.sm }}>
              {formatDateTime(recording.createdAt)}
              {isPhoto ? ' · фото' : ` · ${formatDuration(recording.durationSec)}`}
            </Txt>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.card,
      paddingHorizontal: 15,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: c.hairline,
      ...shadow.card,
    },
    pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    body: { flex: 1, minWidth: 0 },
    thumb: {
      width: 42,
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.hairline,
      backgroundColor: c.chipBg,
    },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    errorPill: {
      backgroundColor: c.dangerBg,
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    retryBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    procWrap: { marginTop: spacing.sm, gap: 7 },
  });
