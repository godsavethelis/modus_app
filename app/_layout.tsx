import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WebPhoneFrame } from '@/components/WebPhoneFrame';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

/** Редирект между группами (auth) и (app) в зависимости от сессии. */
function RootNavigator() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [user, initializing, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  // CoFo Sans — локальные .ttf в assets/fonts (конверт из woff2). Имена ключей
  // совпадают с font.* в src/theme/tokens.ts.
  const [fontsLoaded] = useFonts({
    'CoFoSans-Regular': require('../assets/fonts/CoFoSans-Regular.ttf'),
    'CoFoSans-Medium': require('../assets/fonts/CoFoSans-Medium.ttf'),
    'CoFoSans-Bold': require('../assets/fonts/CoFoSans-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemedStatusBar />
            <WebPhoneFrame>
              <RootNavigator />
            </WebPhoneFrame>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
