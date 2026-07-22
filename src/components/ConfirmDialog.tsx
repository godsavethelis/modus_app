/**
 * Подтверждение необратимого действия (удаление записи или фото).
 * Абсолютный оверлей, не RN Modal — см. комментарий в RenameDialog.
 */
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Txt } from './ui/Txt';
import { alwaysDark, fontSize, radius, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  title: string;
  text?: string;
  /** Подпись разрушающей кнопки. */
  confirm: string;
  onConfirm: () => void;
  onClose: () => void;
  tone?: 'theme' | 'dark';
}

export function ConfirmDialog({ title, text, confirm, onConfirm, onClose, tone = 'theme' }: Props) {
  const { colors: themeColors } = useTheme();
  const colors = tone === 'dark' ? alwaysDark : themeColors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Закрыть" />
      <View style={styles.dialog}>
        <Txt weight="bold" size={fontSize.lg} color={colors.ink}>
          {title}
        </Txt>
        {text ? (
          <Txt size={fontSize.small} color={colors.textSecondary} style={{ marginTop: 6, lineHeight: 18 }}>
            {text}
          </Txt>
        ) : null}
        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.btn}>
            <Txt size={fontSize.base} color={colors.textSecondary}>
              Отмена
            </Txt>
          </Pressable>
          <Pressable onPress={onConfirm} style={styles.btn} accessibilityRole="button">
            <Txt weight="semibold" size={fontSize.base} color={colors.dangerText}>
              {confirm}
            </Txt>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      zIndex: 50,
    },
    fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,17,17,0.35)' },
    // См. RenameDialog: обводка держит границу диалога в тёмном варианте.
    dialog: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: spacing.xl,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
    btn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  });
