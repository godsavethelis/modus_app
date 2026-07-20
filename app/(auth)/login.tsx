import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { Reveal } from '@/components/ui/Reveal';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api';
import { font, fontSize, radius, readable, spacing, type Palette } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('andrey@modus.app');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      // Успех: RootNavigator сам уведёт на главный экран.
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Что-то пошло не так. Попробуй ещё раз');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={styles.brand}>
        <Txt weight="bold" size={fontSize.lg} style={{ letterSpacing: 2.5 }}>
          MODUS
        </Txt>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.form}
      >
        <Reveal delay={0}>
          <View style={{ marginBottom: spacing.xs }}>
            <Txt weight="bold" size={fontSize.display}>
              Вход
            </Txt>
            <Txt size={fontSize.body} color={colors.textSecondary} style={{ marginTop: 6 }}>
              войди, чтобы записывать
            </Txt>
          </View>
        </Reveal>

        <Reveal delay={90}>
          <View style={styles.field}>
            <Ionicons name="mail-outline" size={17} color={colors.textMuted} style={styles.fieldIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>
        </Reveal>

        <Reveal delay={150}>
          <View style={styles.field}>
            <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} style={styles.fieldIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="пароль"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={secure}
              style={[styles.input, { flex: 1 }]}
            />
            <Pressable onPress={() => setSecure((s) => !s)} hitSlop={10}>
              <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={17} color={colors.textMuted} />
            </Pressable>
          </View>
        </Reveal>

        {error ? (
          <Txt size={fontSize.small} color={colors.dangerText}>
            {error}
          </Txt>
        ) : null}

        <Reveal delay={220}>
          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={({ pressed }) => [styles.button, (pressed || loading) && { opacity: 0.85 }]}
          >
            <Txt weight="semibold" size={fontSize.base} color={colors.onAccent}>
              {loading ? 'Входим…' : 'Войти'}
            </Txt>
          </Pressable>
        </Reveal>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  brand: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xl },
  form: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xxl, gap: spacing.lg },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  fieldIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: readable(fontSize.body),
    color: colors.ink,
    padding: 0,
  },
  button: {
    height: 52,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
});
