import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { Reveal } from '@/components/ui/Reveal';
import { useAuth } from '@/context/AuthContext';
import { fontSize, radius, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors, mode, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const initials = (user?.name ?? 'M').trim().slice(0, 1).toUpperCase();

  return (
    <Screen>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Txt weight="bold" size={fontSize.lg}>
          Профиль
        </Txt>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.body}>
        <Reveal delay={0}>
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Txt weight="bold" size={22} color={colors.onAccent}>
                {initials}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="bold" size={fontSize.title}>
                {user?.name ?? 'Пользователь'}
              </Txt>
              <Txt size={fontSize.small} color={colors.textSecondary} style={{ marginTop: 4 }}>
                {user?.email ?? ''}
              </Txt>
            </View>
          </View>
        </Reveal>

        <Reveal delay={90}>
          <Txt weight="semibold" size={fontSize.caption} color={colors.textMuted} style={styles.sectionLabel}>
            НАСТРОЙКИ
          </Txt>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="moon-outline" size={18} color={colors.ink} />
                <Txt size={fontSize.base}>Тёмная тема</Txt>
              </View>
              <Pressable
                onPress={toggle}
                style={[styles.toggle, mode === 'dark' && styles.toggleOn]}
                accessibilityRole="switch"
                accessibilityState={{ checked: mode === 'dark' }}
              >
                <View style={[styles.knob, mode === 'dark' && styles.knobOn]} />
              </Pressable>
            </View>
          </View>
        </Reveal>

        <Reveal delay={150}>
          <Pressable onPress={signOut} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={colors.dangerText} />
            <Txt weight="semibold" size={fontSize.base} color={colors.dangerText}>
              Выйти
            </Txt>
          </Pressable>
        </Reveal>
      </View>

      <Txt size={fontSize.caption} color={colors.textMuted} align="center" style={styles.version}>
        Modus · v{Constants.expoConfig?.version ?? '1.0.0'}
      </Txt>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
    userCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionLabel: { letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.sm },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: colors.hairline, padding: 3, flexDirection: 'row' },
    toggleOn: { backgroundColor: colors.accent },
    knob: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#FFFFFF',
      boxShadow: '0 1px 3px rgba(17,17,17,0.25)',
    },
    knobOn: { marginLeft: 20 },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
    },
    version: { paddingBottom: spacing.xl },
  });
