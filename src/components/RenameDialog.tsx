/**
 * Переименование — один диалог на весь продукт: экран записи, экран фото,
 * свайп по карточке на главной.
 *
 * Лайтбокс фото живёт вне темы приложения (своя тёмная палитра), поэтому
 * у диалога есть вариант tone="dark".
 *
 * RN Modal на вебе выносится в корень страницы и вылезает из рамки телефона,
 * поэтому это абсолютный оверлей — его рендерит сам экран.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Txt } from './ui/Txt';
import { alwaysDark, font, fontSize, radius, readable, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

/** На карточке заголовок обрезан до 2 строк — длиннее вводить бессмысленно. */
const MAX_TITLE = 80;

interface Props {
  value: string;
  onSave: (title: string) => void;
  onClose: () => void;
  /** 'dark' — для лайтбокса фото, который не подчиняется теме приложения. */
  tone?: 'theme' | 'dark';
}

export function RenameDialog({ value, onSave, onClose, tone = 'theme' }: Props) {
  const { colors: themeColors } = useTheme();
  const colors = tone === 'dark' ? alwaysDark : themeColors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [draft, setDraft] = useState(value);

  // Поле многострочное (длинное имя видно целиком), но в данные уходит
  // одна строка: перенос сожрал бы обе строки заголовка на карточке.
  const clean = draft.replace(/\s+/g, ' ').trim();
  const canSave = clean.length > 0;

  function commit() {
    if (!canSave) return;
    onSave(clean);
    onClose();
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Закрыть" />
      <View style={styles.dialog}>
        <Txt weight="bold" size={fontSize.lg} color={colors.ink}>
          Переименовать
        </Txt>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoFocus
          multiline
          maxLength={MAX_TITLE}
          selectionColor={colors.accent}
          style={styles.input}
        />
        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.btn}>
            <Txt size={fontSize.base} color={colors.textSecondary}>
              Отмена
            </Txt>
          </Pressable>
          <Pressable onPress={commit} disabled={!canSave} style={styles.btn} accessibilityRole="button">
            <Txt weight="semibold" size={fontSize.base} color={canSave ? colors.accent : colors.textMuted}>
              Сохранить
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
    // Обводка нужна тёмному варианту: поверх чёрного лайтбокса затемнение
    // подложки не читается и диалог висит без границы.
    dialog: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: spacing.xl,
    },
    input: {
      fontFamily: font.regular,
      fontSize: readable(fontSize.body),
      color: colors.ink,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 12,
      padding: spacing.md,
      marginTop: spacing.md,
      minHeight: 48,
    },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
    btn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  });
