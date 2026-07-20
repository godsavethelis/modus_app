import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AudioPlayer } from '@/components/AudioPlayer';
import { DotCloud } from '@/components/DotCloud';
import { OSShareSheet } from '@/components/OSShareSheet';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { Reveal } from '@/components/ui/Reveal';
import {
  useRecording,
  usePatchRecording,
  useProcessingStatus,
  useRetryProcessing,
  useDeleteRecording,
  useStartGeneration,
  useRegenerateSummary,
} from '@/hooks/useRecordings';
import { useMockPlayer } from '@/hooks/useMockPlayer';
import { formatDateTime, formatTimecode } from '@/lib/format';
import { goBack } from '@/lib/nav';
import { font, fontSize, radius, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import type { ExportKind, ProcessingStatus } from '@/types';

type Tab = 'transcript' | 'summary';

/** Стадии, на которых запись ещё обрабатывается. */
const IN_PROGRESS: ProcessingStatus[] = ['uploading', 'transcribing', 'summarizing'];

const STAGE_TITLE: Partial<Record<ProcessingStatus, string>> = {
  uploading: 'Загружаем аудио',
  transcribing: 'Распознаём речь',
  summarizing: 'Собираем саммари',
};

const STAGE_TAG: Partial<Record<ProcessingStatus, string>> = {
  uploading: 'ЗАГРУЗКА',
  transcribing: 'РАСШИФРОВКА',
  summarizing: 'САММАРИ',
};

/** Как показать файл каждого типа в шапке системного share sheet. */
const FILE_INFO: Record<ExportKind, { label: string; ext: string; meta: string; glyph: 'musical-notes' | 'document-text' | 'list' }> = {
  audio: { label: 'Аудио', ext: 'm4a', meta: 'Аудиозапись', glyph: 'musical-notes' },
  transcript: { label: 'Транскрипт', ext: 'txt', meta: 'Текстовый файл', glyph: 'document-text' },
  summary: { label: 'Саммари', ext: 'txt', meta: 'Текстовый файл', glyph: 'list' },
};

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: rec, isLoading } = useRecording(id);
  // Пока идёт расшифровка — опрашиваем статус; на ready экран сам переключится.
  const { data: live } = useProcessingStatus(id, !!rec && IN_PROGRESS.includes(rec.status));
  const patch = usePatchRecording(id);
  const del = useDeleteRecording();
  const retry = useRetryProcessing(id);
  const gen = useStartGeneration(id);
  const regen = useRegenerateSummary(id);
  const player = useMockPlayer(rec?.durationSec ?? 0);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [tab, setTab] = useState<Tab>('transcript');
  /** Спикер, которого переименовываем в попапе (null — попап закрыт). */
  const [speakerEdit, setSpeakerEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  /** Тип файла, для которого открыт системный share sheet (null — закрыт). */
  const [shareFile, setShareFile] = useState<ExportKind | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  /** Текст тоста внизу экрана; null — тоста нет. */
  const [toast, setToast] = useState<string | null>(null);

  // Скролл текста «схлопывает» блоки выше: заголовок уезжает,
  // дорожка плеера сворачивается. Наверху всё раскрывается обратно.
  const collapseAnim = useRef(new Animated.Value(0)).current;
  const collapsedRef = useRef(false);
  const [collapsed, setCollapsed] = useState(false);
  const [headH, setHeadH] = useState(0);

  const setCollapse = useCallback(
    (next: boolean) => {
      if (collapsedRef.current === next) return;
      collapsedRef.current = next;
      setCollapsed(next);
      Animated.spring(collapseAnim, { toValue: next ? 1 : 0, friction: 10, tension: 90, useNativeDriver: false }).start();
    },
    [collapseAnim],
  );

  function onBodyScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    // Схлопываем только длинный контент: короткому после схлопывания
    // не хватит прокрутки, и шапка начнёт дёргаться туда-обратно.
    const longEnough = contentSize.height > layoutMeasurement.height + 220;
    if (contentOffset.y > 64 && longEnough) setCollapse(true);
    else if (contentOffset.y < 16) setCollapse(false);
  }

  // При смене вкладки скролл начинается с нуля — раскрываем шапку.
  useEffect(() => {
    setCollapse(false);
  }, [tab, setCollapse]);

  // Готовый текст уезжает в Modus сам — сообщаем об этом, когда генерация закончилась.
  const finishedNow = live?.status === 'ready' && (rec?.segments.length ?? 0) > 0;
  useEffect(() => {
    if (finishedNow) setToast('Отправлено в Modus');
  }, [finishedNow]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (isLoading || !rec) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  // Свежий статус приходит из опроса, пока он идёт; иначе берём из записи.
  const stage = live?.status ?? rec.status;
  const progress = live?.progress ?? rec.progress ?? 0;
  const generating = IN_PROGRESS.includes(stage);
  const isFailed = stage === 'failed';
  const summary = rec.summary;
  // Транскрипт и саммари появляются вместе — после «Сгенерировать».
  const generated = rec.segments.length > 0 || !!summary;
  const speakerName = (sid: string) => rec.speakers.find((s) => s.id === sid)?.label ?? 'Спикер';

  /** Пустая вкладка: объяснение + запуск генерации. Одинакова для обеих вкладок. */
  const generateBlock = (hint: string) => (
    <View style={styles.genWrap}>
      <View style={styles.genCenter}>
        <View style={styles.genIcon}>
          <Ionicons name="document-text-outline" size={26} color={colors.textMuted} />
        </View>
        <Txt weight="bold" size={fontSize.lg} align="center">
          Готово к генерации
        </Txt>
        <Txt size={fontSize.small} color={colors.textSecondary} align="center" style={styles.genHint}>
          {hint}
        </Txt>
      </View>
      <Pressable
        onPress={() => gen.mutate()}
        disabled={gen.isPending}
        style={[styles.genBtn, gen.isPending && styles.genBtnOff]}
      >
        {gen.isPending ? (
          <ActivityIndicator color={colors.onAccent} size="small" />
        ) : (
          <Ionicons name="sparkles" size={16} color={colors.accent} />
        )}
        <Txt weight="semibold" size={fontSize.base} color={colors.onAccent}>
          {gen.isPending ? 'Генерируем…' : 'Сгенерировать'}
        </Txt>
      </Pressable>
    </View>
  );

  function openSpeakerEdit(sid: string) {
    setDraft(speakerName(sid));
    setSpeakerEdit(sid);
  }
  /** Имя сохраняется на спикере, поэтому подставляется во все его реплики. */
  function commitSpeaker() {
    if (speakerEdit && draft.trim()) patch.mutate({ speakers: { [speakerEdit]: draft.trim() } });
    setSpeakerEdit(null);
    setDraft('');
  }
  function jumpTo(sec: number) {
    player.seekTo(sec);
    player.play();
  }
  function onDelete() {
    del.mutate(id, { onSuccess: () => goBack(router) });
  }
  function onPickFile(kind: ExportKind) {
    // Файл выбран — открываем системное меню «Поделиться» (мок).
    // TODO(recorder): на устройстве сначала exportRecording → localUri,
    // затем нативный Share.share({ url }). Здесь показываем мок OSShareSheet.
    setShareOpen(false);
    setShareFile(kind);
  }

  return (
    <Screen>
      {/* Верхняя панель */}
      <View style={styles.topBar}>
        <Pressable onPress={() => goBack(router)} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
        <View style={styles.topRight}>
          <Pressable onPress={() => setShareOpen(true)} hitSlop={8} accessibilityLabel="Поделиться">
            <Ionicons name="share-outline" size={22} color={colors.ink} />
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} accessibilityLabel="Ещё">
            <Ionicons name="ellipsis-horizontal" size={21} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {/* Заголовок. Схлопывается при скролле текста ниже. */}
      <Animated.View
        style={{
          overflow: 'hidden',
          opacity: collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          height:
            headH > 0
              ? collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [headH, 0], extrapolate: 'clamp' })
              : undefined,
        }}
      >
        <View style={styles.head} onLayout={(e) => setHeadH(e.nativeEvent.layout.height)}>
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
          {/* Отправка в Inbox автоматическая — показываем её след, тост живёт недолго. */}
          {rec.sentToInbox ? (
            <View style={styles.sentRow}>
              <Ionicons name="checkmark-circle" size={13} color={colors.ink} />
              <Txt size={fontSize.caption} color={colors.ink}>
                Отправлено в Modus
              </Txt>
            </View>
          ) : null}
        </View>
      </Animated.View>

      {generating ? (
        /* Текст из аудио ещё генерируется: вкладки и плеер показывать нечего. */
        <Reveal key="generating" delay={40} offset={10} style={styles.tabBody}>
          <View style={styles.stateWrap}>
            <View style={styles.stateCenter}>
              <DotCloud size={200} count={38} />
              <Txt weight="bold" size={fontSize.title} align="center" style={styles.stateTitle}>
                {STAGE_TITLE[stage] ?? 'Обрабатываем'}
              </Txt>
              <Txt size={fontSize.small} color={colors.textSecondary} align="center" style={styles.stateHint}>
                Распознаём речь, разделяем её по спикерам и собираем саммари. Транскрипт и саммари появятся здесь,
                когда закончим.
              </Txt>
            </View>
            <View style={styles.stateFooter}>
              <View style={styles.stateMeta}>
                <Txt weight="semibold" size={fontSize.micro} color={colors.accent} style={{ letterSpacing: 1.4 }}>
                  {STAGE_TAG[stage] ?? 'ОБРАБОТКА'}
                </Txt>
                <Txt weight="medium" size={fontSize.micro} color={colors.textSecondary}>
                  {Math.round(progress * 100)}%
                </Txt>
              </View>
              <ProgressBar progress={progress} />
            </View>
          </View>
        </Reveal>
      ) : isFailed ? (
        <Reveal key="failed" delay={40} offset={10} style={styles.tabBody}>
          <View style={styles.stateWrap}>
            <View style={styles.stateCenter}>
              <View style={styles.failIcon}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.dangerText} />
              </View>
              <Txt weight="bold" size={fontSize.title} align="center" style={styles.stateTitle}>
                Не удалось расшифровать
              </Txt>
              <Txt size={fontSize.small} color={colors.textSecondary} align="center" style={styles.stateHint}>
                Аудио сохранено. Можно запустить расшифровку ещё раз.
              </Txt>
            </View>
            <Pressable onPress={() => retry.mutate()} disabled={retry.isPending} style={styles.retryBtn}>
              {retry.isPending ? (
                <ActivityIndicator color={colors.onAccent} size="small" />
              ) : (
                <Ionicons name="refresh" size={16} color={colors.onAccent} />
              )}
              <Txt weight="semibold" size={fontSize.base} color={colors.onAccent}>
                {retry.isPending ? 'Запускаем…' : 'Повторить'}
              </Txt>
            </Pressable>
          </View>
        </Reveal>
      ) : (
        <>
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

      <AudioPlayer player={player} durationSec={rec.durationSec} collapsed={collapsed} />

      {tab === 'summary' ? (
        summary ? (
          <Reveal key="summary" delay={20} offset={8} style={styles.tabBody}>
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              onScroll={onBodyScroll}
              scrollEventThrottle={16}
            >
              <Txt weight="bold" size={fontSize.lg} style={styles.h}>
                Обзор
              </Txt>
              <Txt size={fontSize.base} color={colors.ink} style={styles.para}>
                {summary.theme}
              </Txt>

              {(summary.notes?.length ?? 0) > 0 ? (
                <Txt weight="bold" size={fontSize.lg} style={styles.h}>
                  Заметки
                </Txt>
              ) : null}
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
              {(summary.decisions?.length ?? 0) > 0 ? (
                <>
                  <Txt weight="bold" size={fontSize.lg} style={styles.h}>
                    Решения
                  </Txt>
                  {summary.decisions!.map((d, i) => (
                    <View key={i} style={styles.bullet}>
                      <Ionicons name="checkmark" size={13} color={colors.accent} style={{ marginTop: 3 }} />
                      <Txt size={fontSize.small} color={colors.ink} style={{ flex: 1, lineHeight: 19 }}>
                        {d}
                      </Txt>
                    </View>
                  ))}
                </>
              ) : null}
              {summary.nextSteps.length > 0 ? (
                <>
                  <Txt weight="bold" size={fontSize.lg} style={styles.h}>
                    Дальнейшие шаги
                  </Txt>
                  {summary.nextSteps.map((s, i) => (
                    <View key={i} style={styles.bullet}>
                      <Txt size={fontSize.small} color={colors.textMuted}>
                        →
                      </Txt>
                      <Txt size={fontSize.small} color={colors.ink} style={{ flex: 1, lineHeight: 19 }}>
                        {s}
                      </Txt>
                    </View>
                  ))}
                </>
              ) : null}
              {summary.conclusion ? (
                <Txt size={fontSize.small} color={colors.textSecondary} style={styles.concl}>
                  {summary.conclusion}
                </Txt>
              ) : null}
            </ScrollView>
          </Reveal>
        ) : (
          <Reveal key="summary-empty" delay={20} offset={8} style={styles.tabBody}>
            {generateBlock('Саммари появится здесь после генерации')}
          </Reveal>
        )
      ) : rec.segments.length === 0 ? (
        <Reveal key="transcript-empty" delay={20} offset={8} style={styles.tabBody}>
          {generateBlock('Транскрипт появится здесь после генерации')}
        </Reveal>
      ) : (
        <Reveal key="transcript" delay={20} offset={8} style={styles.tabBody}>
          <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              onScroll={onBodyScroll}
              scrollEventThrottle={16}
            >
            {rec.segments.map((seg, i) => (
                <Pressable
                  key={seg.id}
                  onPress={() => jumpTo(seg.start)}
                  style={[styles.seg, i < rec.segments.length - 1 && styles.segBorder]}
                >
                  <View style={styles.segHeader}>
                    <Pressable style={styles.speakerTap} onPress={() => openSpeakerEdit(seg.speakerId)} hitSlop={6}>
                      <Txt
                        weight="bold"
                        size={10}
                        color={i % 2 === 0 ? colors.accent : colors.ink}
                        style={{ letterSpacing: 0.5, textTransform: 'uppercase' }}
                      >
                        {speakerName(seg.speakerId)}
                      </Txt>
                      <Ionicons name="pencil" size={12} color={colors.textMuted} />
                    </Pressable>
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
            ))}
          </ScrollView>
        </Reveal>
      )}

        </>
      )}

      {toast ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <Reveal offset={20}>
            <View style={styles.toast}>
              <Ionicons name="checkmark-circle" size={16} color={colors.onAccent} />
              <Txt weight="medium" size={fontSize.small} color={colors.onAccent}>
                {toast}
              </Txt>
            </View>
          </Reveal>
        </View>
      ) : null}

      {/* Шеринг: ссылка + выгрузка файлом */}
      {shareOpen ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setShareOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />

            <Txt weight="bold" size={fontSize.lg} style={styles.sheetTitle}>
              Поделиться файлом
            </Txt>
            <Txt size={fontSize.small} color={colors.textSecondary} style={styles.sheetHint}>
              Через меню телефона — в мессенджер, почту или Файлы.
            </Txt>
            {(
              [
                { kind: 'audio' as const, icon: 'pulse-outline' as const, label: 'Аудио', on: true },
                { kind: 'transcript' as const, icon: 'document-text-outline' as const, label: 'Транскрипт', on: generated },
                { kind: 'summary' as const, icon: 'list-outline' as const, label: 'Саммари', on: !!summary },
              ]
            ).map((row) => (
              <Pressable
                key={row.kind}
                style={styles.sheetRow}
                disabled={!row.on}
                onPress={() => onPickFile(row.kind)}
              >
                <Ionicons name={row.icon} size={19} color={row.on ? colors.ink : colors.textMuted} />
                <Txt size={fontSize.base} color={row.on ? colors.ink : colors.textMuted} style={{ flex: 1 }}>
                  {row.label}
                </Txt>
                <Ionicons name="share-outline" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Системное меню «Поделиться» (мок iOS share sheet) */}
      {shareFile && rec ? (
        <OSShareSheet
          fileName={`${FILE_INFO[shareFile].label} — ${rec.title}.${FILE_INFO[shareFile].ext}`}
          fileMeta={FILE_INFO[shareFile].meta}
          fileGlyph={FILE_INFO[shareFile].glyph}
          onClose={() => setShareFile(null)}
        />
      ) : null}

      {/* Меню записи */}
      {menuOpen ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setMenuOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            {summary ? (
              <>
                <Pressable
                  style={styles.sheetRow}
                  disabled={regen.isPending}
                  onPress={() => {
                    setMenuOpen(false);
                    regen.mutate(undefined, { onSuccess: () => setToast('Саммари обновлено') });
                  }}
                >
                  <Ionicons name="refresh" size={18} color={colors.ink} />
                  <Txt size={fontSize.base}>{regen.isPending ? 'Генерируем…' : 'Перегенерировать саммари'}</Txt>
                </Pressable>
                <View style={styles.sheetDivider} />
              </>
            ) : null}
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

      {/* Имя спикера — подставится во все его реплики */}
      {speakerEdit ? (
        <View style={[styles.overlay, styles.overlayCenter]}>
          <Pressable style={styles.overlayFill} onPress={() => setSpeakerEdit(null)} />
          <View style={styles.dialog}>
            <Txt weight="bold" size={fontSize.lg}>
              Кто говорит?
            </Txt>
            <Txt size={fontSize.small} color={colors.textSecondary} style={{ marginTop: 6, lineHeight: 18 }}>
              Имя подставится во все реплики этого спикера.
            </Txt>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              placeholder="Например, Андрей"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={commitSpeaker}
              style={styles.dialogInput}
            />
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setSpeakerEdit(null)} style={styles.dialogBtn}>
                <Txt size={fontSize.base} color={colors.textSecondary}>
                  Отмена
                </Txt>
              </Pressable>
              <Pressable onPress={commitSpeaker} style={styles.dialogBtn}>
                <Txt weight="semibold" size={fontSize.base} color={colors.accent}>
                  Сохранить
                </Txt>
              </Pressable>
            </View>
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
    sentRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
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
    body: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
    h: { marginTop: spacing.lg, marginBottom: spacing.sm },
    para: { lineHeight: 22 },
    note: { marginBottom: spacing.md },
    noteHead: { flexDirection: 'row', gap: 4, marginBottom: 6 },
    bullet: { flexDirection: 'row', gap: 8, paddingLeft: spacing.lg, marginBottom: 6 },
    concl: { marginTop: spacing.md, lineHeight: 19, fontStyle: 'italic' },
    insight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
    seg: { paddingVertical: 13 },
    segBorder: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
    segHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
    speakerTap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    segTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    /** Экраны состояний (генерация текста, ошибка): контент по центру, действие внизу. */
    stateWrap: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
    stateCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    stateTitle: { marginTop: spacing.lg },
    stateHint: { lineHeight: 18, marginTop: spacing.sm, maxWidth: 290 },
    stateFooter: { gap: spacing.sm },
    stateMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    failIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.dangerBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radius.card,
      paddingVertical: spacing.lg,
    },
    /** Пустая вкладка: текст по центру, кнопка генерации прижата вниз. */
    genWrap: { flex: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
    genCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    genIcon: {
      width: 62,
      height: 62,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    genHint: { lineHeight: 18, maxWidth: 260 },
    genBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.ink,
      borderRadius: radius.card,
      paddingVertical: spacing.lg,
    },
    genBtnOff: { opacity: 0.45 },
    toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 28, alignItems: 'center' },
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
    sheetTitle: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xs },
    sheetHint: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm, lineHeight: 17 },
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
