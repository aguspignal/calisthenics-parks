import { useRouter } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/providers/auth-provider';
import { colors, spacing } from '@/theme';

import { Button } from './button';
import { EmptyState } from './empty-state';

type Props = {
  /** Why this screen needs an account, shown to signed-out users. */
  reason: string;
  children: ReactNode;
};

/** Renders children for signed-in users, and a sign-in prompt otherwise. */
export function RequireAuth({ reason, children }: Props) {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  if (session) return children;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator color={colors.textMuted} />
      ) : (
        <EmptyState icon={LogIn} title="Sign in to contribute" message={reason}>
          <Button title="Sign in" onPress={() => router.push('/sign-in')} style={styles.button} />
        </EmptyState>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.m,
  },
  button: {
    marginTop: spacing.xs,
  },
});
