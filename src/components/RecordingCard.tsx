import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { Txt } from './ui/Txt';
import { useProcessingStatus } from '@/hooks/useRecordings';
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
  const stage = live?.status ?? recording.status;
  const progress = live?.progress ?? recording.progress ?? 0;

  const showLoader = isProcessing && stage !== 'ready';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Txt weight="semibold" size={13} numberOfLines={2} style={{ lineHeight: 18 }}>
        {recording.title}
      </Txt>
      {showLoader ? (
        <View style={styles.procWrap}>
          <Txt weight="semibold" size={9.5} color={stage === 'failed' ? colors.dangerText : colors.accent} style={{ letterSpacing: 1.2 }}>
            {STAGE_LABEL[stage] ?? 'ОБРАБОТКА…'}
          </Txt>
          <ProgressBar progress={progress} />
        </View>
      ) : (
        <Txt size={10.5} color={colors.textMuted} style={{ marginTop: spacing.sm }}>
          {formatDateTime(recording.createdAt)} · {formatDuration(recording.durationSec)}
        </Txt>
      )}
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
    procWrap: { marginTop: spacing.sm, gap: 7 },
  });
