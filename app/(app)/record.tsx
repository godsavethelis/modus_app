import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { PulseBars } from '@/components/PulseBars';
import { formatTimecode } from '@/lib/format';
import { recordingsApi, transcribeApi } from '@/services/api';
import { MOCK_MIC_DENIED } from '@/services/mocks/data';
import { fontSize, radius, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

// Демонстрационный поток слов «распознавания». TODO(backend): заменить на стрим STT.
const DEMO_WORDS =
  'давайте зафиксируем цели на спринт и разнесём задачи по владельцам первый блок это загрузка аудио дальше статусы обработки'.split(
    ' ',
  );

export default function RecordScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [seconds, setSeconds] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopping, setStopping] = useState(false);
  const tick = useRef(0);

  // TODO(recorder): реальный запрос доступа к микрофону через expo-audio.
  const [micDenied] = useState(MOCK_MIC_DENIED);

  useEffect(() => {
    if (micDenied) return;
    const timer = setInterval(() => {
      if (paused) return;
      tick.current += 1;
      if (tick.current % 2 === 0) setSeconds((s) => s + 1);
      setWordCount((c) => (c < DEMO_WORDS.length ? c + 1 : c));
    }, 380);
    return () => clearInterval(timer);
  }, [paused, micDenied]);

  function onStop() {
    if (stopping) return;
    setStopping(true);
    // TODO(recorder): остановить expo-audio и получить localUri файла (.m4a).
    // Загрузка идёт в фоне: сразу возвращаемся на главный, там карточка
    // новой записи показывает прогресс полоской.
    recordingsApi
      .uploadRecording('mock://audio/new.m4a', seconds)
      .then(async (created) => {
        queryClient.invalidateQueries({ queryKey: ['recordings'] });
        await transcribeApi.startTranscription(created.id);
      })
      .catch(() => {});
    router.replace('/(app)');
  }

  function openSettings() {
    if (Platform.OS === 'web') return;
    Linking.openSettings().catch(() => {});
  }

  if (micDenied) {
    return (
      <Screen>
        <View style={styles.topRow}>
          <View />
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.denied}>
          <View style={styles.deniedIcon}>
            <Ionicons name="mic-off-outline" size={34} color={colors.accent} />
          </View>
          <Txt weight="bold" size={fontSize.title} align="center">
            Нет доступа к микрофону
          </Txt>
          <Txt size={fontSize.body} color={colors.textSecondary} align="center" style={styles.deniedText}>
            Чтобы записывать аудио, разреши доступ к микрофону в настройках телефона.
          </Txt>
          <Pressable onPress={openSettings} style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={16} color={colors.onAccent} />
            <Txt weight="semibold" size={fontSize.base} color={colors.onAccent}>
              Открыть настройки
            </Txt>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Таймер */}
      <View style={styles.header}>
        <View style={styles.recTag}>
          {paused ? (
            <Txt weight="semibold" size={fontSize.caption} style={{ letterSpacing: 2 }}>
              ПАУЗА
            </Txt>
          ) : null}
        </View>
        <Txt weight="light" size={fontSize.hero} align="center" style={{ marginTop: spacing.sm }}>
          {formatTimecode(seconds)}
        </Txt>
      </View>

      {/* Визуализация: пульсирующие линии, на паузе замирают */}
      <View style={styles.cloud}>
        <PulseBars height={160} paused={paused} />
      </View>

      {/* Живая расшифровка */}
      <View style={styles.transcript}>
        <Txt weight="semibold" size={fontSize.micro} color={colors.textMuted} style={styles.transcriptLabel}>
          РАСШИФРОВКА
        </Txt>
        <Txt size={fontSize.body} style={{ lineHeight: 20 }} numberOfLines={3}>
          {DEMO_WORDS.slice(0, wordCount).join(' ')}
          <Txt size={fontSize.body} color={colors.accent}>
            {paused ? '' : ' ▍'}
          </Txt>
        </Txt>
      </View>

      {/* Основные контролы */}
      <View style={styles.controls}>
        <View style={styles.ctrl}>
          <Pressable onPress={() => router.back()} style={styles.circle}>
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
          <Txt size={fontSize.small} color={colors.textSecondary}>
            Отмена
          </Txt>
        </View>

        <View style={styles.ctrl}>
          <Pressable onPress={onStop} style={[styles.circle, styles.circleMain]}>
            <View style={styles.stopSquare} />
          </Pressable>
          <Txt weight="semibold" size={fontSize.small}>
            Готово
          </Txt>
        </View>

        <View style={styles.ctrl}>
          <Pressable onPress={() => setPaused((p) => !p)} style={styles.circle}>
            <Ionicons name={paused ? 'play' : 'pause'} size={20} color={colors.ink} />
          </Pressable>
          <Txt size={fontSize.small} color={colors.textSecondary}>
            {paused ? 'Продолжить' : 'Пауза'}
          </Txt>
        </View>
      </View>

    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
    },
    header: { alignItems: 'center', paddingTop: spacing.lg },
    recTag: { flexDirection: 'row', alignItems: 'center', height: 16 },
    cloud: { alignSelf: 'stretch', marginTop: spacing.xl },
    transcript: { flex: 1, justifyContent: 'flex-start', paddingHorizontal: spacing.xxl, marginTop: spacing.sm },
    transcriptLabel: { letterSpacing: 1.5, marginBottom: spacing.sm, textAlign: 'center' },
    controls: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: spacing.xxl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    ctrl: { alignItems: 'center', gap: spacing.sm },
    circle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
      boxShadow: '0 6px 18px rgba(17,17,17,0.12)',
    },
    circleMain: { width: 74, height: 74, borderRadius: 37 },
    stopSquare: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.accent },
    denied: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.md },
    deniedIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.dangerBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    deniedText: { lineHeight: 20, marginBottom: spacing.md },
    settingsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
    },
  });
