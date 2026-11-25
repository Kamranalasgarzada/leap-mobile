import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider, useThemeMode } from '../src/contexts/ThemeContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import i18n, { getStoredLanguage } from '../src/i18n';
import { getColors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function InnerLayout() {
  const { mode } = useThemeMode();
  const c = getColors(mode);

  const paperTheme = {
    ...(mode === 'dark' ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(mode === 'dark' ? MD3DarkTheme : MD3LightTheme).colors,
      primary: c.primary,
      background: c.background,
      surface: c.surface,
      error: c.error,
      onSurface: c.textHeading,
      onBackground: c.textBody,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }} />
          <Toast />
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const lang = await getStoredLanguage();
        await i18n.changeLanguage(lang);
      } catch {}
      setReady(true);
      SplashScreen.hideAsync().catch(() => {});
    })();
  }, []);

  if (!ready) return null;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <InnerLayout />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
