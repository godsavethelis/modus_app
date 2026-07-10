import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Txt } from './ui/Txt';
import { radius, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { ProcessingStatus } from '@/types';

interface Props {
  status: ProcessingStatus;
  sentToInbox: boolean;
}

const PROCESSING: ProcessingStatus[] = ['uploading', 'transcribing', 'summarizing'];

export function StatusBadge({ status, sentToInbox }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (sentToInbox) {
    return (
      <View style={[styles.pill, styles.dark]}>
        <Txt weight="semibold" size={9.5} color={colors.bg} style={styles.label}>
          ОТПР.
        </Txt>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={[styles.pill, { backgroundColor: colors.dangerBg }]}>
        <Txt weight="semibold" size={9.5} color={colors.dangerText} style={styles.label}>
          ОШИБКА
        </Txt>
      </View>
    );
  }

  if (PROCESSING.includes(status)) {
    return (
      <View style={[styles.pill, styles.dark]}>
        <ActivityIndicator size="small" color={colors.bg} style={styles.spinner} />
        <Txt weight="semibold" size={9.5} color={colors.bg} style={styles.label}>
          ОБР.
        </Txt>
      </View>
    );
  }

  return (
    <View style={[styles.pill, styles.outline]}>
      <Txt weight="semibold" size={9.5} color={colors.ink} style={styles.label}>
        ГОТОВО
      </Txt>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    dark: { backgroundColor: c.ink },
    outline: { borderWidth: 1, borderColor: c.ink },
    label: { letterSpacing: 0.5 },
    spinner: { transform: [{ scale: 0.6 }], marginRight: -2 },
  });
