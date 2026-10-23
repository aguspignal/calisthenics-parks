import { Mail } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { spacing } from '@/theme';

/** Placeholder: Google, email one-time code and email + password sign-in are the next step. */
export function SignInScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="title">Sign in to contribute</Text>
      <Text tone="secondary">
        Anyone can browse parks. An account lets you add parks, review them and confirm other people&apos;s changes.
      </Text>
      <View style={styles.buttons}>
        <Button title="Continue with Google" variant="secondary" disabled />
        <Button title="Continue with email" icon={Mail} variant="secondary" disabled />
      </View>
      <Text variant="caption" tone="muted">
        Sign-in is not built yet. It will offer Google, an emailed one-time code, and email with password.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.m,
    gap: spacing.m,
  },
  buttons: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
