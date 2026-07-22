/**
 * Просмотрщик фото: тёмный лайтбокс с оригиналом в цвете.
 * Закрывается крестиком; «...» в топбаре открывает переименование и удаление —
 * тот же паттерн, что на экране записи. Экран живёт вне темы приложения,
 * поэтому диалоги идут с tone="dark".
 */
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/components/ui/Txt';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { RenameDialog } from '@/components/RenameDialog';
import { useDeleteRecording, useRecording, useRenameRecording } from '@/hooks/useRecordings';
import { formatDateTime } from '@/lib/format';
import { goBack } from '@/lib/nav';
import { fontSize, radius, spacing } from '@/theme';

/** Экран всегда тёмный, независимо от темы приложения — это лайтбокс. */
const C = {
  bg: '#0A0A0A',
  ink: '#F4F4F4',
  muted: '#8A8A84',
  hairline: 'rgba(244,244,244,0.16)',
  accent: '#E1543A',
};

export default function PhotoViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(), []);
  const { data: photo, isLoading } = useRecording(id ?? '');
  const rename = useRenameRecording();
  const del = useDeleteRecording();

  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.topBar}>
        <View style={{ width: 30 }} />
        <View style={styles.topRight}>
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={styles.close}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Ещё"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={C.ink} />
          </Pressable>
          <Pressable onPress={() => goBack(router)} style={styles.close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Закрыть">
            <Ionicons name="close" size={18} color={C.ink} />
          </Pressable>
        </View>
      </View>

      {isLoading || !photo ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.accent} />
        </View>
      ) : (
        <>
          <View style={styles.photoWrap}>
            <Image source={{ uri: photo.photoUrl }} style={styles.photo} resizeMode="contain" />
          </View>

          <View style={styles.meta}>
            <Txt weight="bold" size={fontSize.base} color={C.ink}>
              {photo.title}
            </Txt>
            <Txt size={fontSize.caption} color={C.muted} style={{ marginTop: spacing.sm }}>
              {formatDateTime(photo.createdAt)}
              {photo.sizeMb ? ` · ${String(photo.sizeMb).replace('.', ',')} МБ` : ''}
            </Txt>
            {photo.sentToInbox ? (
              <View style={styles.statusChip}>
                <View style={styles.statusDot} />
                <Txt weight="semibold" size={fontSize.micro} color={C.muted} style={{ letterSpacing: 1.2 }}>
                  В БИБЛИОТЕКЕ
                </Txt>
              </View>
            ) : null}
          </View>
        </>
      )}

      {/* Меню действий. Оверлей, а не RN Modal, — иначе на вебе вылезет из рамки телефона. */}
      {menuOpen ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayFill} onPress={() => setMenuOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setMenuOpen(false);
                setRenameOpen(true);
              }}
            >
              <Ionicons name="pencil" size={18} color={C.ink} />
              <Txt size={fontSize.base} color={C.ink}>
                Переименовать
              </Txt>
            </Pressable>
            <View style={styles.sheetDivider} />
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                setMenuOpen(false);
                setDeleteOpen(true);
              }}
            >
              <Ionicons name="trash-outline" size={18} color={C.accent} />
              <Txt size={fontSize.base} color={C.accent}>
                Удалить
              </Txt>
            </Pressable>
          </View>
        </View>
      ) : null}

      {renameOpen && photo ? (
        <RenameDialog
          tone="dark"
          value={photo.title}
          onSave={(title) => rename.mutate({ id: photo.id, title })}
          onClose={() => setRenameOpen(false)}
        />
      ) : null}

      {deleteOpen && photo ? (
        <ConfirmDialog
          tone="dark"
          title="Удалить фото?"
          text="Действие необратимо. Восстановить не получится."
          confirm="Удалить"
          onConfirm={() => {
            setDeleteOpen(false);
            del.mutate(photo.id);
            goBack(router);
          }}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: spacing.xl },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    close: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: C.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    photoWrap: {
      flex: 1,
      marginTop: spacing.lg,
      borderRadius: radius.card,
      overflow: 'hidden',
      backgroundColor: '#161616',
    },
    photo: { flex: 1 },
    meta: { paddingTop: spacing.xl },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: C.hairline,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      marginTop: spacing.lg,
    },
    statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'flex-end',
      zIndex: 20,
    },
    overlayFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: '#161616',
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
      backgroundColor: C.hairline,
      marginBottom: spacing.sm,
    },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
    },
    sheetDivider: { height: 1, backgroundColor: C.hairline, marginHorizontal: spacing.xl },
  });
