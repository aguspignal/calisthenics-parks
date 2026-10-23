import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LogIn, LogOut, Trash, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { links } from '@/constants';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { usePreferences } from '@/providers/preferences-provider';
import { colors, spacing } from '@/theme';

import { Group, Row } from './group';

export function SettingsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { distanceUnit, setDistanceUnit } = usePreferences();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const { error } = await getSupabase().auth.signOut();
    setBusy(false);
    if (error) Alert.alert("Couldn't sign out", error.message);
  };

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in at any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', onPress: signOut },
    ]);

  const deleteAccount = async () => {
    if (!session) return;
    setBusy(true);
    const supabase = getSupabase();
    // Photo files are not deleted with the account, so remove them first.
    const { data: photos } = await supabase.from('park_photos').select('storage_path').eq('user_id', session.user.id);
    if (photos && photos.length > 0) {
      await supabase.storage.from('park-photos').remove(photos.map((photo) => photo.storage_path));
    }
    const { error } = await supabase.rpc('delete_account');
    if (error) {
      setBusy(false);
      Alert.alert("Couldn't delete your account", error.message);
      return;
    }
    await supabase.auth.signOut({ scope: 'local' });
    setBusy(false);
  };

  const confirmDeleteAccount = () =>
    Alert.alert(
      'Delete your account?',
      'Your account, reviews and photos are deleted for good. Parks and changes you added stay.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteAccount },
      ],
    );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Group title="Account">
        {session ? (
          <Row label={session.user.email ?? 'Signed in'} icon={UserRound} />
        ) : (
          <Row label="Sign in" icon={LogIn} onPress={() => router.push('/sign-in')} />
        )}
        {session ? <Row label="Sign out" icon={LogOut} onPress={confirmSignOut} disabled={busy} /> : null}
        {session ? (
          <Row
            label="Delete account"
            icon={Trash}
            iconColor={colors.danger}
            onPress={confirmDeleteAccount}
            disabled={busy}
          />
        ) : null}
      </Group>

      <Group title="Distance units">
        <View style={styles.units}>
          <Chip label="Kilometers" selected={distanceUnit === 'km'} onPress={() => setDistanceUnit('km')} />
          <Chip label="Miles" selected={distanceUnit === 'mi'} onPress={() => setDistanceUnit('mi')} />
        </View>
      </Group>

      <Group title="About">
        <Row label="Version" value={Constants.expoConfig?.version ?? '–'} />
        <Row
          label="Privacy policy"
          value={links.privacyPolicy ? undefined : 'Not available yet'}
          onPress={() => links.privacyPolicy && WebBrowser.openBrowserAsync(links.privacyPolicy)}
          disabled={!links.privacyPolicy}
        />
        <Row
          label="Terms of service"
          value={links.termsOfService ? undefined : 'Not available yet'}
          onPress={() => links.termsOfService && WebBrowser.openBrowserAsync(links.termsOfService)}
          disabled={!links.termsOfService}
        />
        <Row
          label="Contact"
          value={links.contactEmail ?? 'Not available yet'}
          onPress={() => links.contactEmail && Linking.openURL(`mailto:${links.contactEmail}`)}
          disabled={!links.contactEmail}
        />
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
    gap: spacing.l,
  },
  units: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.s,
  },
});
