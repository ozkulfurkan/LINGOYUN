import '@/i18n';

import * as Sentry from '@sentry/react-native';
import { useFonts } from 'expo-font';
import { ErrorBoundary as ExpoErrorBoundary, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { buildSentryOptions } from '@/lib/monitoring';
import { FONT_ASSETS, ThemeProvider, useTheme } from '@/theme';

Sentry.init(buildSentryOptions({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN, isDev: __DEV__ }));

// Reports render errors in any route to Sentry, then shows Expo's error screen.
export const ErrorBoundary = Sentry.wrapExpoRouterErrorBoundary(ExpoErrorBoundary);

// Keep the native splash screen up until the fonts are ready, so no screen
// ever renders in a fallback font.
void SplashScreen.preventAutoHideAsync();

function ThemedStack() {
  const theme = useTheme();
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  // No profile exists yet (onboarding is LNG-16), so the kids theme is used.
  return (
    <ThemeProvider profileType={null}>
      <ThemedStack />
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
