import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { getPostAuthLandingHref } from '@/lib/navigation/post-auth-landing';
import { useAppTheme } from '@/hooks/useAppTheme';
import { type Href, Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

/**
 * Вход. Фаза 1: логин через Nest `POST /api/app/auth/login`.
 */
export default function LoginScreen(): React.JSX.Element {
  const { signInWithCredentials, signIn, isReady } = useAuth();
  const router = useRouter();
  const t = useAppTheme();
  const styles = useMemo(() => createLoginStyles(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onDevContinue(): void {
    signIn('dev-mock-access-token');
    router.replace('/(app)/(tabs)' as Href);
  }

  async function onSubmit(): Promise<void> {
    setError(null);
    if (!isReady) {
      return;
    }
    setLoading(true);
    try {
      const me = await signInWithCredentials(email.trim(), password);
      router.replace(getPostAuthLandingHref(me));
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось войти. Повторите попытку.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.hero, { borderBottomColor: t.border }]}>
          <Text style={[styles.kicker, { color: t.tint }]}>Neuro</Text>
          <Text style={[styles.title, { color: t.text }]}>Вход</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            Введите email и пароль учётной записи приложения.
          </Text>
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: t.surface,
              borderColor: t.border,
              color: t.text,
            },
          ]}
          placeholderTextColor={t.textMuted}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Email"
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: t.surface,
              borderColor: t.border,
              color: t.text,
            },
          ]}
          placeholderTextColor={t.textMuted}
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль"
          secureTextEntry
          textContentType="password"
          accessibilityLabel="Пароль"
        />

        {error ? <Text style={[styles.error, { color: t.error }]}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: t.tint, opacity: loading ? 0.65 : pressed ? 0.92 : 1 },
          ]}
          onPress={onSubmit}
          disabled={loading}
          accessibilityLabel="Войти"
        >
          {loading ? (
            <ActivityIndicator color={t.tintForeground} />
          ) : (
            <Text style={[styles.buttonText, { color: t.tintForeground }]}>Войти</Text>
          )}
        </Pressable>

        <Link href={'/(auth)/register' as Href} style={[styles.link, { color: t.link }]}>
          Нет аккаунта? Регистрация
        </Link>

        {__DEV__ && process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH !== 'true' ? (
          <Pressable
            style={[
              styles.buttonSecondary,
              { borderColor: t.border },
            ]}
            onPress={onDevContinue}
          >
            <Text style={[styles.buttonSecondaryText, { color: t.textSecondary }]}>
              Продолжить без бэка (dev)
            </Text>
          </Pressable>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

function createLoginStyles() {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      borderRadius: 14,
      marginTop: 8,
      paddingHorizontal: 22,
      paddingVertical: 16,
    },
    buttonSecondary: {
      borderRadius: 14,
      borderWidth: 1,
      marginTop: 26,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    buttonSecondaryText: { fontSize: 15, textAlign: 'center' },
    buttonText: { fontSize: 16, fontWeight: '700' },
    container: {
      flex: 1,
      justifyContent: 'center',
      maxWidth: 440,
      paddingHorizontal: 24,
      width: '100%',
      alignSelf: 'center',
    },
    error: { fontSize: 14, marginTop: 8 },
    hero: {
      marginBottom: 28,
      paddingBottom: 20,
      borderBottomWidth: 1,
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      fontSize: 16,
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    kicker: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 1.2,
      marginBottom: 8,
      textTransform: 'uppercase' as const,
    },
    link: { fontSize: 15, marginTop: 22, textAlign: 'center' },
    screen: { flex: 1 },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      marginTop: 8,
    },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  });
}
