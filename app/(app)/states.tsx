/**
 * Витрина состояний — QA/демо-экран (открывается из профиля).
 * Собирает в одном месте все состояния и ошибки, которые иначе спрятаны
 * за код-флагами (MOCK_UPLOAD_FAILS, MOCK_AUTH_FAILURE, MOCK_MIC_DENIED,
 * SIMULATE_ERRORS) — чтобы их можно было «поймать» в живом демо по клику.
 * Всё рендерится статично (RecordingCard в preview-режиме, инлайн-оверлеи);
 * реальную логику это не запускает. TODO(backend): по мере подключения
 * бэкенда состояния становятся настоящими, экран остаётся как QA-витрина.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { RecordingCard } from '@/components/RecordingCard';
import { goBack } from '@/lib/nav';
import { fontSize, radius, shadow, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { Recording } from '@/types';

const iso = '2026-07-18T14:42:00.000Z';

/** Демо-карточки во всех стадиях (локальные, реальный список не трогаем). */
const CARDS: { label: string; rec: Recording }[] = [
  { label: 'Загрузка', rec: { id: 's_up', title: 'Синк по релизу', createdAt: iso, durationSec: 1820, status: 'uploading', progress: 0.15, sentToInbox: false } },
  { label: 'Расшифровка', rec: { id: 's_tr', title: 'Планёрка контент-плана', createdAt: iso, durationSec: 2650, status: 'transcribing', progress: 0.45, sentToInbox: false } },
  { label: 'Саммари', rec: { id: 's_sm', title: 'Ретро по найму', createdAt: iso, durationSec: 1980, status: 'summarizing', progress: 0.8, sentToInbox: false } },
  { label: 'Готово', rec: { id: 's_rd', title: 'Лекция: продуктовые метрики', createdAt: iso, durationSec: 4360, status: 'ready', sentToInbox: true } },
  { label: 'Ошибка обработки + retry', rec: { id: 's_fl', title: 'Заметка на ходу', createdAt: iso, durationSec: 47, status: 'failed', sentToInbox: false } },
  { label: 'Фото · загрузка', rec: { id: 's_pu', title: 'Фото 18 июля, 14:42', createdAt: iso, durationSec: 0, status: 'uploading', progress: 0.3, sentToInbox: false, kind: 'photo', thumbUrl: 'https://picsum.photos/seed/modus-board/300/300' } },
  { label: 'Фото · сбой загрузки', rec: { id: 's_pf', title: 'Фото 18 июля, 14:40', createdAt: iso, durationSec: 0, status: 'failed', sentToInbox: false, kind: 'photo', thumbUrl: 'https://picsum.photos/seed/modus-slide/300/300' } },
  { label: 'Фото · в библиотеке', rec: { id: 's_pr', title: 'Фото 18 июля, 14:38', createdAt: iso, durationSec: 0, status: 'ready', sentToInbox: true, kind: 'photo', thumbUrl: 'https://picsum.photos/seed/modus-demo/300/300' } },
];

/** Тосты из спеки и прототипа. */
const TOASTS = [
  'Запись слишком короткая',
  'Достигнут лимит записи',
  'Отправлено в Modus',
  'Саммари обновлено',
  'Нет соединения с сервером',
];

type Overlay = 'update' | 'cancel' | 'logout' | null;

export default function StatesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [toast, setToast] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <Screen>
      <View style={styles.topRow}>
        <Pressable onPress={() => goBack(router)} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Txt weight="bold" size={fontSize.lg}>
          Витрина состояний
        </Txt>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Txt size={fontSize.small} color={colors.textSecondary} style={styles.intro}>
          Все состояния и ошибки в одном месте — для демо и QA. Обычно они спрятаны за код-флагами; здесь их видно по клику.
        </Txt>

        {/* Карточки */}
        <Section title="КАРТОЧКИ В ЛЕНТЕ" colors={colors} styles={styles}>
          {CARDS.map((c) => (
            <View key={c.rec.id} style={styles.cardItem}>
              <Txt size={fontSize.micro} color={colors.textMuted} style={styles.cardLabel}>
                {c.label.toUpperCase()}
              </Txt>
              <RecordingCard recording={c.rec} preview onPress={() => {}} />
            </View>
          ))}
        </Section>

        {/* Полноэкранные экраны */}
        <Section title="ЭКРАНЫ" colors={colors} styles={styles}>
          <RowBtn icon="mic-off-outline" label="Нет доступа к микрофону" onPress={() => router.push('/record?denied=1')} styles={styles} colors={colors} />
          <RowBtn icon="cloud-download-outline" label="Обновите приложение" onPress={() => setOverlay('update')} styles={styles} colors={colors} />
          <RowBtn icon="close-circle-outline" label="Отмена записи — подтверждение" onPress={() => setOverlay('cancel')} styles={styles} colors={colors} />
          <RowBtn icon="log-out-outline" label="Выход с незагруженными записями" onPress={() => setOverlay('logout')} styles={styles} colors={colors} />
        </Section>

        {/* Список */}
        <Section title="СПИСОК" colors={colors} styles={styles}>
          <View style={styles.previewBox}>
            <Txt weight="bold" size={fontSize.body} align="center">Пока нет записей</Txt>
            <Txt size={fontSize.small} color={colors.textSecondary} align="center" style={{ marginTop: 6, lineHeight: 18 }}>
              Запиши встречу или лекцию — расшифровка и саммари появятся здесь.
            </Txt>
            <View style={styles.ctaPill}>
              <Txt weight="semibold" size={fontSize.small} color={colors.onAccent}>Сделать первую запись</Txt>
            </View>
          </View>
          <View style={styles.previewBox}>
            <Txt size={fontSize.body} color={colors.textSecondary}>Не удалось загрузить</Txt>
            <View style={[styles.ctaPill, { marginTop: spacing.md }]}>
              <Txt weight="semibold" size={fontSize.small} color={colors.onAccent}>Повторить</Txt>
            </View>
          </View>
        </Section>

        {/* Деталка */}
        <Section title="ДЕТАЛКА" colors={colors} styles={styles}>
          <View style={styles.previewBox}>
            <Ionicons name="mic-off-outline" size={26} color={colors.textMuted} />
            <Txt weight="bold" size={fontSize.body} align="center" style={{ marginTop: spacing.sm }}>Речь не распознана</Txt>
            <Txt size={fontSize.small} color={colors.textSecondary} align="center" style={{ marginTop: 6, lineHeight: 18 }}>
              На записи не обнаружено речи. Проверь микрофон и попробуй записать ещё раз.
            </Txt>
          </View>
        </Section>

        {/* Вход */}
        <Section title="ОШИБКИ ВХОДА" colors={colors} styles={styles}>
          {[
            'Неверный email или пароль',
            'Нет соединения. Проверь интернет',
            'Сервер недоступен. Попробуй позже',
          ].map((msg) => (
            <View key={msg} style={styles.errBox}>
              <Ionicons name="alert-circle" size={16} color={colors.dangerText} />
              <Txt size={fontSize.small} color={colors.dangerText} style={{ flex: 1 }}>{msg}</Txt>
            </View>
          ))}
        </Section>

        {/* Баннеры записи */}
        <Section title="БАННЕРЫ ЗАПИСИ" colors={colors} styles={styles}>
          <Banner icon="pause" text="Запись на паузе" tone="ink" styles={styles} colors={colors} />
          <Banner icon="save-outline" text="Запись остановлена: закончилось место" tone="danger" styles={styles} colors={colors} />
          <Banner icon="volume-mute-outline" text="Звук не поступает" tone="ink" styles={styles} colors={colors} />
          <Banner icon="warning-outline" text="Мало места, запись может прерваться" tone="danger" styles={styles} colors={colors} />
        </Section>

        {/* Тосты */}
        <Section title="ТОСТЫ" colors={colors} styles={styles}>
          <View style={styles.chipsWrap}>
            {TOASTS.map((t) => (
              <Pressable key={t} onPress={() => setToast(t)} style={styles.chip}>
                <Txt size={fontSize.small}>{t}</Txt>
              </Pressable>
            ))}
          </View>
        </Section>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Тост */}
      {toast ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toast}>
            <Txt weight="semibold" size={fontSize.small} color={colors.bg}>{toast}</Txt>
          </View>
        </View>
      ) : null}

      {/* Инлайн-оверлеи полноэкранных состояний */}
      {overlay === 'update' ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setOverlay(null)} />
          <View style={styles.dialog}>
            <Ionicons name="cloud-download-outline" size={30} color={colors.accent} />
            <Txt weight="bold" size={fontSize.title} align="center" style={{ marginTop: spacing.md }}>Обновите приложение</Txt>
            <Txt size={fontSize.small} color={colors.textSecondary} align="center" style={styles.dialogText}>
              Эта версия больше не поддерживается. Обновите Modus, чтобы продолжить.
            </Txt>
            <View style={styles.dialogPrimary}>
              <Txt weight="semibold" size={fontSize.base} color={colors.onAccent}>Обновить</Txt>
            </View>
          </View>
        </View>
      ) : null}

      {overlay === 'cancel' ? (
        <ConfirmDialog
          title="Удалить запись?"
          text="Записанное аудио будет потеряно."
          confirm="Удалить"
          onClose={() => setOverlay(null)}
          styles={styles}
          colors={colors}
        />
      ) : null}

      {overlay === 'logout' ? (
        <ConfirmDialog
          title="Выйти из аккаунта?"
          text="На устройстве 2 записи, не загруженные на сервер. Выход удалит их."
          confirm="Выйти и удалить"
          onClose={() => setOverlay(null)}
          styles={styles}
          colors={colors}
        />
      ) : null}
    </Screen>
  );
}

function Section({ title, colors, styles, children }: { title: string; colors: Palette; styles: Styles; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Txt weight="semibold" size={fontSize.caption} color={colors.textMuted} style={styles.sectionLabel}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

function RowBtn({ icon, label, onPress, styles, colors }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; styles: Styles; colors: Palette }) {
  return (
    <Pressable onPress={onPress} style={styles.rowBtn} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={18} color={colors.ink} />
      <Txt size={fontSize.base} style={{ flex: 1 }}>{label}</Txt>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function Banner({ icon, text, tone, styles, colors }: { icon: keyof typeof Ionicons.glyphMap; text: string; tone: 'ink' | 'danger'; styles: Styles; colors: Palette }) {
  const danger = tone === 'danger';
  return (
    <View style={[styles.banner, danger && { backgroundColor: colors.dangerBg }]}>
      <Ionicons name={icon} size={16} color={danger ? colors.dangerText : colors.ink} />
      <Txt size={fontSize.small} color={danger ? colors.dangerText : colors.ink} style={{ flex: 1 }}>{text}</Txt>
    </View>
  );
}

function ConfirmDialog({ title, text, confirm, onClose, styles, colors }: { title: string; text: string; confirm: string; onClose: () => void; styles: Styles; colors: Palette }) {
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayFill} onPress={onClose} />
      <View style={styles.dialog}>
        <Txt weight="bold" size={fontSize.title} align="center">{title}</Txt>
        <Txt size={fontSize.small} color={colors.textSecondary} align="center" style={styles.dialogText}>{text}</Txt>
        <Pressable onPress={onClose} style={styles.dialogDanger}>
          <Txt weight="semibold" size={fontSize.base} color={colors.onAccent}>{confirm}</Txt>
        </Pressable>
        <Pressable onPress={onClose} style={styles.dialogGhost}>
          <Txt weight="semibold" size={fontSize.base} color={colors.ink}>Отмена</Txt>
        </Pressable>
      </View>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
    intro: { lineHeight: 18, marginBottom: spacing.lg },
    section: { marginBottom: spacing.xl },
    sectionLabel: { letterSpacing: 1.5, marginBottom: spacing.md },
    cardItem: { marginBottom: spacing.md },
    cardLabel: { letterSpacing: 1, marginBottom: 6 },
    rowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    previewBox: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.card,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    ctaPill: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      marginTop: spacing.md,
    },
    errBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.dangerBg,
      borderRadius: radius.chip,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.chipBg,
      borderRadius: radius.chip,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center', zIndex: 50 },
    toast: {
      backgroundColor: colors.ink,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      ...shadow.card,
    },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, zIndex: 40 },
    overlayFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,17,17,0.4)' },
    dialog: {
      backgroundColor: colors.surface,
      borderRadius: radius.sheet,
      padding: spacing.xl,
      alignItems: 'center',
      alignSelf: 'stretch',
      ...shadow.card,
    },
    dialogText: { lineHeight: 18, marginTop: spacing.sm, marginBottom: spacing.lg, maxWidth: 260 },
    dialogPrimary: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    dialogDanger: {
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    dialogGhost: {
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      alignSelf: 'stretch',
      marginTop: spacing.sm,
    },
  });
