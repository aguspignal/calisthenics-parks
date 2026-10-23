import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/providers/auth-provider';
import { PreferencesProvider } from '@/providers/preferences-provider';
import { colors, fontFamily, typography } from '@/theme';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
  fonts: {
    regular: { fontFamily, fontWeight: '400' },
    medium: { fontFamily, fontWeight: '600' },
    bold: { fontFamily, fontWeight: '700' },
    heavy: { fontFamily, fontWeight: '700' },
  },
} satisfies typeof DarkTheme;

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreferencesProvider>
          <ThemeProvider value={navigationTheme}>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.text,
                headerTitleStyle: {
                  fontFamily,
                  fontSize: typography.subtitles.fontSize,
                  fontWeight: typography.subtitles.fontWeight,
                },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: colors.background },
              }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="park/[id]/index" options={{ title: '' }} />
              <Stack.Screen name="park/[id]/review" options={{ title: 'Review' }} />
              <Stack.Screen name="park/[id]/edit" options={{ title: 'Suggest an edit' }} />
              <Stack.Screen name="park/[id]/verify" options={{ title: 'Confirm changes' }} />
              <Stack.Screen name="contribute/index" options={{ title: 'Contribute' }} />
              <Stack.Screen name="contribute/new-park" options={{ title: 'Add a park' }} />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
              <Stack.Screen name="sign-in" options={{ presentation: 'modal', title: 'Sign in' }} />
            </Stack>
            <StatusBar style="light" />
          </ThemeProvider>
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
