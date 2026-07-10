import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { Reveal } from '@/components/ui/Reveal';
import {
  useRecording,
  usePatchRecording,
  useSendToInbox,
  useDeleteRecording,
  useRegenerateSummary,
} from '@/hooks/useRecordings';
import { useMockPlayer } from '@/hooks/useMockPlayer';
import { formatDateTime, formatTimecode } from '@/lib/format';
import { font, fontSize, radius, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Tab = 'transcript' | 'summary';

const WAVE = Array.from({ length: 44 }, (_, i) => 4 + Math.round(22 * Math.abs(Math.sin(i * 0.6))));

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: rec, isLoading } = useRecording(id);
  const patch = usePatchRecording(id);
  const send = useSendToInbox(id);
  const del = useDeleteRecording();
  const regen = useRegenerateSummary(id);
  const player = useMockPlayer(rec?.durationSec ?? 0);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [tab, setTab] = useState<Tab>('summary');
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [waveW, setWaveW] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [toast, setToast] = useState(false);

  if (isLoading || !rec) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  const isReady = rec.status === 'ready';
  const alreadySent = rec.sentToInbox || toast;
  const summary = rec.summary;
  const speakerName = (sid: string) => rec.speakers.find((s) => s.id === sid)?.label ?? 'Спикер';

  function commitSpeaker(sid: string) {
    if (draft.trim()) patch.mutate({ speakers: { [sid]: draft.trim() } });
    setEditingSpeaker(null);
    setDraft('');
  }
  function jumpTo(sec: number) {
    player.seekTo(sec);
    player.play();
  }
  function onSend() {
    send.mutate(undefined, {
      onSuccess: () => {
        setToast(true);
        setTimeout(() => router.back(), 1200);
      },
    });
  }
  function onDelete() {
    del.mutate(id, { onSuccess: () => router.back() });
  }

  return (
    <Screen bottomInset={false}>
      {/* Верхняя панель */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={styles.topRight}>
          <Pressable onPress={onSend} disabled={!isReady || alreadySent} hitSlop={8}>
            <Ionicons
              name={alreadySent ? 'checkmark-circle' : 'paper-plane-outline'}
              size={21}
              color={alreadySent ? colors.textSecondary : isReady ? colors.accent : colors.textMuted}
            />
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={21} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {/* Заголовок */}
      <View style={styles.head}>
        <Txt weight="bold" size={fontSize.title} style={{ lineHeight: 26 }}>
          {rec.title}
        </Txt>
        <View style={styles.metaRow}>
          <Txt size={fontSize.small} color={colors.textSecondary}>
            {formatDateTime(rec.createdAt)}
          </Txt>
          <Txt size={fontSize.small} color={colors.textSecondary}>
            {formatTimecode(rec.durationSec)}
          </Txt>
        </View>
      </View>

      {/* Сегмент-контрол */}
      <View style={styles.segment}>
        {(
          [
            { key: 'transcript' as Tab, icon: 'document-text-outline' as const, label: 'Транскрипт' },
            { key: 'summary' as Tab, icon: 'list-outline' as const, label: 'Саммари' },
          ]
        ).map((s) => {
          const on = tab === s.key;
          return (
            <Pressable key={s.key} onPress={() => setTab(s.key)} style={[styles.segItem, on && styles.segItemOn]}>
              <Ionicons name={s.icon} size={17} color={on ? colors.ink : colors.textMuted} />
              <Txt weight={on ? 'semibold' : 'regular'} size={fontSize.body} color={on ? colors.ink : colors.textMuted}>
                {s.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {tab === 'summary' ? (
        <Reveal key="summary" delay={20} offset={8} style={styles.tabBody}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {!summary ? (
              <Txt size={fontSize.body} color={colors.textSecondary}>
                Саммари появится после обработки.
              </Txt>
            ) : (
              <>
                <Txt weight="bold" size={fontSize.lg} style={styles.h}>
                  Обзор
                </Txt>
                  <Txt size={fontSize.base} color={colors.ink} style={styles.para}>
                    {summary.theme}
                  </Txt>

                  <Txt weight="bold" size={fontSize.lg} style={styles.h}>
                    Заметки
                  </Txt>
                  {(summary.notes ?? []).map((note, i) => (
                    <View key={i} style={styles.note}>
                      <View style={styles.noteHead}>
                        <Txt weight="bold" size={fontSize.base} color={colors.accent} style={{ width: 20 }}>
                          {i + 1}.
                        </Txt>
                        <Txt weight="semibold" size={fontSize.base} color={colors.ink} style={{ flex: 1 }}>
                          {note.title}
                        </Txt>
                      </View>
                      {note.points.map((p, j) => (
                        <View key={j} style={styles.bullet}>
                          <Txt size={fontSize.base} color={colors.textMuted}>
                            •
                          </Txt>
                          <Txt size={fontSize.small} color={colors.ink} style={{ flex: 1, lineHeight: 19 }}>
                            {p}
                          </Txt>
                        </View>
                      ))}
                    </View>
                  ))}
                  {summary.conclusion ? (
                    <Txt size={fontSize.small} color={colors.textSecondary} style={styles.concl}>
                      {summary.conclusion}
                    </Txt>
                  ) : null}
              </>
            )}

            {summary ? (
              <Pressable onPress={() => regen.mutate()} disabled={regen.isPending} style={styles.regenBtn}>
                <Ionicons name="refresh" size={15} color={colors.ink} />
                <Txt weight="medium" size={fontSize.small}>
                  {regen.isPending ? 'Генерируем…' : 'Перегенерировать'}
                </Txt>
              </Pressable>
            ) : null}
          </ScrollView>
        </Reveal>
      ) : (
        <Reveal key="transcript" delay={20} offset={8} style={styles.tabBody}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {rec.segments.length === 0 ? (
              <Txt size={fontSize.body} color={colors.textSecondary}>
                Транскрипт появится после обработки.
              </Txt>
            ) : (
              rec.segments.map((seg, i) => {
                const isEditing = editingSpeaker === seg.speakerId;
                return (
                  <Pressable
                    key={seg.id}
                    onPress={() => !isEditing && jumpTo(seg.start)}
                    style={[styles.seg, i < rec.segments.length - 1 && styles.segBorder]}
                  >
                    <View style={styles.segHeader}>
                      {isEditing ? (
                        <TextInput
                          value={draft}
                          onChangeText={setDraft}
                          autoFocus
                          onSubmitEditing={() => commitSpeaker(seg.speakerId)}
                          onBlur={() => commitSpeaker(seg.speakerId)}
                          style={styles.speakerInput}
                        />
                      ) : (
                        <Pressable
                          style={styles.speakerTap}
                          onPress={() => {
                            setEditingSpeaker(seg.speakerId);
                            setDraft(speakerName(seg.speakerId));
                          }}
                        >
                          <Txt weight="bold" size={10} color={i % 2 === 0 ? colors.accent : colors.ink} style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            {speakerName(seg.speakerId)}
                          </Txt>
                          <Ionicons name="pencil" size={12} color={colors.textMuted} />
                        </Pressable>
                      )}
                      <View style={styles.segTime}>
                        <Ionicons name="play" size={9} color={colors.textMuted} />
                        <Txt size={10} color={colors.textMuted}>
                          {formatTimecode(seg.start)}
                        </Txt>
                      </View>
                    </View>
                    <Txt size={fontSize.small} color={colors.ink} style={{ lineHeight: 18 }}>
                      {seg.text}
                    </Txt>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </Reveal>
      )}

      {/* Нижняя панель плеера */}
      <View style={[styles.playerBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={player.toggle} style={styles.barPlay}>
          <Ionicons name={player.playing ? 'pause' : 'play'} size={20} color="#111111" />
        </Pressable>
        <Pressable
          style={styles.barWave}
          onLayout={(e) => setWaveW(e.nativeEvent.layout.width)}
          onPress={(e) => {
            if (waveW > 0) player.seekTo((e.nativeEvent.locationX / waveW) * rec.durationSec);
          }}
        >
          {WAVE.map((h, i) => (
            <View
              key={i}
              style={{
                width: 2.5,
                height: h,
                borderRadius: 2,
                backgroundColor: i / WAVE.length <= player.progress ? colors.accent : '#5A5A5A',
              }}
            />
          ))}
        </Pressable>
        <Txt size={fontSize.caption} color="#B8B8B8">
          {formatTimecode(player.positionSec)} / {formatTimecode(rec.durationSec)}
        </Txt>
      </View>

      {toast ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <Reveal offset={20}>
            <View style={styles.toast}>
              <Ionicons name="checkmark-circle" size={16} color={colors.onAccent} />
              <Txt weight="medium" size={fontSize.small} color={colors.onAccent}>
                Отправлено в Modus
              </Txt>
            </View>
          </Reveal>
        </View>
      ) : null}

      {/* Меню записи */}
      {menuOpen ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setMenuOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setMenuOpen(false);
                setDraftTitle(rec.title);
                setRenameOpen(true);
              }}
            >
              <Ionicons name="pencil" size={18} color={colors.ink} />
              <Txt size={fontSize.base}>Переименовать</Txt>
            </Pressable>
            <View style={styles.sheetDivider} />
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.dangerText} />
              <Txt size={fontSize.base} color={colors.dangerText}>
                Удалить
              </Txt>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Переименование */}
      {renameOpen ? (
        <View style={[styles.overlay, styles.overlayCenter]}>
          <Pressable style={styles.overlayFill} onPress={() => setRenameOpen(false)} />
          <View style={styles.dialog}>
            <Txt weight="bold" size={fontSize.lg}>
              Переименовать
            </Txt>
            <TextInput value={draftTitle} onChangeText={setDraftTitle} autoFocus multiline style={styles.dialogInput} />
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setRenameOpen(false)} style={styles.dialogBtn}>
                <Txt size={fontSize.base} color={colors.textSecondary}>
                  Отмена
                </Txt>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (draftTitle.trim()) patch.mutate({ title: draftTitle.trim() });
                  setRenameOpen(false);
                }}
                style={styles.dialogBtn}
              >
                <Txt weight="semibold" size={fontSize.base} color={colors.accent}>
                  Сохранить
                </Txt>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      {/* Удаление */}
      {deleteOpen ? (
        <View style={[styles.overlay, styles.overlayCenter]}>
          <Pressable style={styles.overlayFill} onPress={() => setDeleteOpen(false)} />
          <View style={styles.dialog}>
            <Txt weight="bold" size={fontSize.lg}>
              Удалить запись?
            </Txt>
            <Txt size={fontSize.small} color={colors.textSecondary} style={{ marginTop: 6, lineHeight: 18 }}>
              Действие необратимо. Запись будет удалена без возможности восстановления.
            </Txt>
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setDeleteOpen(false)} style={styles.dialogBtn}>
                <Txt size={fontSize.base} color={colors.textSecondary}>
                  Отмена
                </Txt>
              </Pressable>
              <Pressable
                onPress={() => {
                  setDeleteOpen(false);
                  onDelete();
                }}
                style={styles.dialogBtn}
              >
                <Txt weight="semibold" size={fontSize.base} color={colors.dangerText}>
                  Удалить
                </Txt>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    head: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.sm },
    playerBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#111111',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: 12,
    },
    barPlay: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    barWave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 26 },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.chipBg,
      borderRadius: radius.pill,
      padding: 3,
      marginHorizontal: spacing.xl,
      marginTop: spacing.lg,
    },
    segItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingVertical: 9,
      borderRadius: radius.pill,
    },
    segItemOn: { backgroundColor: colors.surface },
    tabBody: { flex: 1, minHeight: 0 },
    body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 120 },
    h: { marginTop: spacing.lg, marginBottom: spacing.sm },
    para: { lineHeight: 22 },
    note: { marginBottom: spacing.md },
    noteHead: { flexDirection: 'row', gap: 4, marginBottom: 6 },
    bullet: { flexDirection: 'row', gap: 8, paddingLeft: spacing.lg, marginBottom: 6 },
    concl: { marginTop: spacing.md, lineHeight: 19, fontStyle: 'italic' },
    insight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
    regenBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      alignSelf: 'flex-start',
      marginTop: spacing.xl,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    seg: { paddingVertical: 13 },
    segBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
    segHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    speakerTap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    segTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    speakerInput: {
      fontFamily: font.bold,
      fontSize: 11,
      color: colors.ink,
      padding: 0,
      minWidth: 120,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent,
    },
    toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center' },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.ink,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 20 },
    overlayCenter: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    overlayFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(17,17,17,0.35)' },
    sheet: {
      backgroundColor: colors.surface,
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
      backgroundColor: colors.hairline,
      marginBottom: spacing.sm,
    },
    sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
    sheetDivider: { height: 1, backgroundColor: colors.hairline, marginHorizontal: spacing.xl },
    dialog: { width: '100%', maxWidth: 340, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl },
    dialogInput: {
      fontFamily: font.regular,
      fontSize: fontSize.body,
      color: colors.ink,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 12,
      padding: spacing.md,
      marginTop: spacing.md,
      minHeight: 48,
    },
    dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
    dialogBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  });
