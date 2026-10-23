import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { isGoogleSignInConfigured, signInWithGoogle } from '@/lib/google-sign-in';
import { spacing } from '@/theme';

export function SignInScreen() {
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  const continueWithGoogle = async () => {
    setSigningIn(true);
    try {
      if (await signInWithGoogle()) router.back();
    } catch (error) {
      Alert.alert("Couldn't sign in with Google", error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="title">Sign in to contribute</Text>
      <Text tone="secondary">
        Anyone can browse parks. An account lets you add parks, review them and confirm other people&apos;s changes.
      </Text>
      <View style={styles.buttons}>
        <Button
          title="Continue with Google"
          variant="secondary"
          onPress={continueWithGoogle}
          loading={signingIn}
          disabled={!isGoogleSignInConfigured}
        />
        <Button title="Continue with email" icon={Mail} variant="secondary" disabled />
      </View>
      <Text variant="caption" tone="muted">
        Email sign-in (one-time code, or email and password) is coming soon.
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
