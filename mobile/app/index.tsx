import { useAuth } from '@/contexts/AuthContext';
import { type Href, Redirect } from 'expo-router';

/**
 * Начальная точка: редирект в приложение или на экран входа.
 */
export default function Index(): React.JSX.Element | null {
  const { isLoggedIn, isReady, user } = useAuth();

  if (!isReady) {
    return null;
  }
  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }
  if (user == null) {
    return <Redirect href="/(app)/(tabs)" />;
  }
  if (user.needsOnboarding) {
    return <Redirect href={'/(onboarding)' as Href} />;
  }
  return <Redirect href="/(app)/(tabs)" />;
}
