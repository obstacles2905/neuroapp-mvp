import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { getPostAuthLandingHref } from '@/lib/navigation/post-auth-landing';
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

import { useAppTheme } from '@/hooks/useAppTheme';

const MIN_PASSWORD = 8;

export default function RegisterScreen(): React.JSX.Element {
  const { signUp, isReady } = useAuth();
  const router = useRouter();
  const t = useAppTheme();
  const styles = useMemo(() => createRegisterStyles(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(): Promise<void> {
    setError(null);
    if (!isReady) {
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Пароль не короче ${String(MIN_PASSWORD)} символов`);
      return;
    }
    if (password !== passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }
    const name = displayName.trim();
    if (name.length === 0) {
      setError('Укажите имя');
      return;
    }
    setLoading(true);
    try {
      const me = await signUp(email.trim(), password, passwordConfirm, name);
      router.replace(getPostAuthLandingHref(me));
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Регистрация не удалась. Повторите позже.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const inputTone = [
    styles.input,
    {
      backgroundColor: t.surface,
      borderColor: t.border,
      color: t.text,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: t.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.hero, { borderBottomColor: t.border }]}>
          <Text style={[styles.kicker, { color: t.tint }]}>Neuro</Text>
          <Text style={[styles.title, { color: t.text }]}>Регистрация</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            Создайте учётную запись для Neuro.
          </Text>
        </View>

        <TextInput
          style={inputTone}
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
          style={inputTone}
          placeholderTextColor={t.textMuted}
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль (от 8 символов)"
          secureTextEntry
          textContentType="newPassword"
          accessibilityLabel="Пароль"
        />
        <TextInput
          style={inputTone}
          placeholderTextColor={t.textMuted}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          placeholder="Повторите пароль"
          secureTextEntry
          textContentType="newPassword"
          accessibilityLabel="Повтор пароля"
        />
        <TextInput
          style={inputTone}
          placeholderTextColor={t.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Имя"
          textContentType="name"
          accessibilityLabel="Имя"
        />

        {error ? <Text style={[styles.error, { color: t.error }]}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: t.tint, opacity: loading ? 0.65 : pressed ? 0.92 : 1 },
          ]}
          onPress={onSubmit}
          disabled={loading}
          accessibilityLabel="Зарегистрироваться"
        >
          {loading ? (
            <ActivityIndicator color={t.tintForeground} />
          ) : (
            <Text style={[styles.buttonText, { color: t.tintForeground }]}>
              Зарегистрироваться
            </Text>
          )}
        </Pressable>

        <Link href={'/(auth)/login' as Href} style={[styles.link, { color: t.link }]}>
          Уже есть аккаунт? Войти
        </Link>
      </KeyboardAvoidingView>
    </View>
  );
}

function createRegisterStyles() {
  return StyleSheet.create({
    button: {
      alignItems: 'center',
      borderRadius: 14,
      marginTop: 8,
      paddingHorizontal: 22,
      paddingVertical: 16,
    },
    buttonText: { fontSize: 16, fontWeight: '700' },
    container: {
      flex: 1,
      justifyContent: 'center',
      maxWidth: 440,
      paddingHorizontal: 24,
      paddingVertical: 12,
      width: '100%',
      alignSelf: 'center',
    },
    error: { fontSize: 14, marginTop: 8 },
    hero: {
      marginBottom: 22,
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
