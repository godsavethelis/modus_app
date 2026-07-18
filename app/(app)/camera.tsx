/**
 * Мок-камера в нативном iOS-стиле: чёрный экран, жёлтые акценты, зум-чипы,
 * белый затвор. «Видоискатель» показывает стоковый кадр; затвор делает
 * стоп-кадр, дальше — «Переснять» / «Отправить».
 * TODO(recorder): заменить на expo-camera (живое превью + реальный снимок).
 */
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/components/ui/Txt';
import { goBack } from '@/lib/nav';
import { recordingsApi } from '@/services/api';
import { mockCameraShots } from '@/services/mocks/data';
import { fontSize, radius, spacing } from '@/theme';

/** Жёлтый системной камеры iPhone. Осознанно вне палитры Modus: экран мимикрирует под натив. */
const IOS_YELLOW = '#FFCC00';

const ZOOMS = ['0,5', '1×', '2', '3'];

export default function CameraScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(), []);

  // «Объектив»: индекс кадра в пуле. Кнопка переворота листает пул —
  // видно, что камера «смотрит» на другую сцену.
  const [lens, setLens] = useState(0);
  const [shot, setShot] = useState<(typeof mockCameraShots)[number] | null>(null);
  const [sending, setSending] = useState(false);

  const live = mockCameraShots[lens % mockCameraShots.length];

  function send() {
    if (!shot || sending) return;
    setSending(true);
    // Загрузка идёт в фоне — сразу на главный, карточка покажет прогресс.
    recordingsApi
      .uploadPhotos([shot])
      .then(() => queryClient.invalidateQueries({ queryKey: ['recordings'] }))
      .catch(() => {});
    router.replace('/(app)');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 14) }]}>
      {/* Верхняя панель: вспышка, как в системной камере */}
      <View style={styles.topBar}>
        <Ionicons name="flash-off-outline" size={18} color="#F4F4F4" />
        <Ionicons name="chevron-up" size={16} color={IOS_YELLOW} />
        <View style={{ width: 18 }} />
      </View>

      {/* Видоискатель */}
      <View style={styles.finder}>
        <Image source={{ uri: (shot ?? live).photoUrl }} style={styles.finderImg} />
        {!shot ? (
          <>
            {/* Рамка фокуса */}
            <View style={styles.focus} pointerEvents="none" />
            <View style={styles.zoomRow}>
              {ZOOMS.map((z, i) => (
                <View key={z} style={[styles.zoom, i === 1 && styles.zoomOn]}>
                  <Txt weight="semibold" size={i === 1 ? 11 : 9.5} color={i === 1 ? IOS_YELLOW : 'rgba(255,255,255,0.8)'}>
                    {z}
                  </Txt>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </View>

      {shot ? (
        /* Стоп-кадр: подтверждение перед отправкой в библиотеку */
        <View style={styles.confirmBar}>
          <Pressable onPress={() => setShot(null)} style={styles.ghostBtn} accessibilityRole="button">
            <Txt weight="bold" size={fontSize.small} color="#F4F4F4" style={{ letterSpacing: 1.2 }}>
              ПЕРЕСНЯТЬ
            </Txt>
          </Pressable>
          <Pressable onPress={send} style={styles.sendBtn} accessibilityRole="button">
            <Txt weight="bold" size={fontSize.small} color="#FFFFFF" style={{ letterSpacing: 1.2 }}>
              ОТПРАВИТЬ
            </Txt>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Режимы, как на iPhone: активен только «Фото» */}
          <View style={styles.modes}>
            <Txt weight="semibold" size={11} color="rgba(255,255,255,0.55)" style={{ letterSpacing: 1.5 }}>
              ВИДЕО
            </Txt>
            <Txt weight="bold" size={11} color={IOS_YELLOW} style={{ letterSpacing: 1.5 }}>
              ФОТО
            </Txt>
            <Txt weight="semibold" size={11} color="rgba(255,255,255,0.55)" style={{ letterSpacing: 1.5 }}>
              ПОРТРЕТ
            </Txt>
          </View>

          {/* Нижняя панель: закрыть / затвор / переворот */}
          <View style={styles.bottomBar}>
            <Pressable onPress={() => goBack(router)} style={styles.sideBtn} accessibilityRole="button" accessibilityLabel="Закрыть камеру">
              <Ionicons name="close" size={20} color="#F4F4F4" />
            </Pressable>
            <Pressable onPress={() => setShot(live)} style={styles.shutter} accessibilityRole="button" accessibilityLabel="Сделать снимок">
              <View style={styles.shutterCore} />
            </Pressable>
            <Pressable
              onPress={() => setLens((l) => l + 1)}
              style={styles.sideBtn}
              accessibilityRole="button"
              accessibilityLabel="Сменить камеру"
            >
              <Ionicons name="camera-reverse-outline" size={20} color="#F4F4F4" />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000000' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    finder: { flex: 1, overflow: 'hidden', backgroundColor: '#0A0A0A', justifyContent: 'flex-end' },
    finderImg: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined, resizeMode: 'cover' },
    focus: {
      position: 'absolute',
      top: '38%',
      left: '32%',
      width: 84,
      height: 84,
      borderWidth: 1,
      borderColor: IOS_YELLOW,
      opacity: 0.9,
    },
    zoomRow: {
      flexDirection: 'row',
      alignSelf: 'center',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(0,0,0,0.35)',
      borderRadius: radius.pill,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginBottom: spacing.lg,
    },
    zoom: { minWidth: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    zoomOn: { backgroundColor: 'rgba(0,0,0,0.55)' },
    modes: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.xxl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.md,
    },
    sideBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutter: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      borderColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutterCore: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' },
    confirmBar: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    },
    ghostBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.45)',
      borderRadius: radius.pill,
      paddingVertical: 13,
      alignItems: 'center',
    },
    sendBtn: {
      flex: 1,
      backgroundColor: '#E1543A',
      borderRadius: radius.pill,
      paddingVertical: 13,
      alignItems: 'center',
      boxShadow: '0 10px 26px rgba(225,84,58,0.4)',
    },
  });
