import { useRouter } from 'expo-router';
import { ChevronRight, CircleAlert, MapPin, MapPinOff, Plus } from 'lucide-react-native';
import { useEffect, useEffectEvent, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Text } from '@/components/text';
import { useAppSettings } from '@/data/catalog';
import { useNearbyParks } from '@/data/parks';
import { useUserLocation, type Coordinates } from '@/hooks/use-user-location';
import { useAuth } from '@/providers/auth-provider';
import { usePreferences } from '@/providers/preferences-provider';
import { colors, controlSize, radius, spacing } from '@/theme';
import { formatDistance } from '@/utils/geo';

export function ContributeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { distanceUnit } = usePreferences();
  const { getLocation } = useUserLocation();
  const settings = useAppSettings();
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(true);
  const nearby = useNearbyParks(location);

  const fetchLocation = (explainDenial: boolean) =>
    getLocation({ explainDenial })
      .then(setLocation)
      // Location services off or no fix: the empty state offers a retry.
      .catch(() => setLocation(null))
      .finally(() => setLocating(false));

  const locate = (explainDenial: boolean) => {
    setLocating(true);
    fetchLocation(explainDenial);
  };

  const locateOnOpen = useEffectEvent(() => {
    fetchLocation(false);
  });
  useEffect(() => {
    locateOnOpen();
  }, []);

  const proximity = settings.data?.proximity_meters;
  const rangeText = proximity
    ? `You can add, edit, review or confirm parks within ${formatDistance(proximity, distanceUnit)} of where you are.`
    : 'You can only contribute to parks near where you are.';

  let nearbyContent;
  if (locating) {
    nearbyContent = <ActivityIndicator color={colors.textMuted} style={styles.loading} />;
  } else if (!location) {
    nearbyContent = (
      <EmptyState icon={MapPinOff} title="Location needed" message="Turn on location to see the parks you can contribute to.">
        <Button title="Use my location" variant="secondary" onPress={() => locate(true)} />
      </EmptyState>
    );
  } else if (nearby.isPending) {
    nearbyContent = <ActivityIndicator color={colors.textMuted} style={styles.loading} />;
  } else if (nearby.isError) {
    nearbyContent = <EmptyState icon={CircleAlert} title="Couldn't load nearby parks" message={nearby.error.message} />;
  } else if (nearby.data.length === 0) {
    nearbyContent = (
      <EmptyState
        icon={MapPin}
        title="No parks near you"
        message="If you're at a park that isn't on the map yet, add it."
      />
    );
  } else {
    nearbyContent = (
      <View style={styles.list}>
        {nearby.data.map((park) => {
          const state =
            park.status === 'pending'
              ? 'Unverified'
              : park.pending_submissions > 0
                ? `${park.pending_submissions} pending ${park.pending_submissions === 1 ? 'change' : 'changes'}`
                : 'Verified';
          return (
            <Pressable
              key={park.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/park/[id]', params: { id: park.id } })}
              style={({ pressed }) => [styles.parkRow, pressed && { backgroundColor: colors.surfaceRaised }]}>
              <View style={styles.flex}>
                <Text>{park.name}</Text>
                <Text variant="notes" tone="muted">
                  {`${state} · ${formatDistance(park.distance_meters, distanceUnit)}`}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {!session ? (
        <View style={styles.signIn}>
          <Text variant="text_bold">Sign in to contribute</Text>
          <Text variant="notes" tone="secondary">
            Anyone can browse. To add parks, review them or confirm other people&apos;s changes, you need an account.
          </Text>
          <Button title="Sign in" size="s" onPress={() => router.push('/sign-in')} style={styles.alignStart} />
        </View>
      ) : null}

      <View style={styles.block}>
        <Button
          title="Add a park here"
          icon={Plus}
          disabled={!session}
          onPress={() => router.push('/contribute/new-park')}
        />
        <Text variant="caption" tone="muted">
          {rangeText}
        </Text>
      </View>

      <View style={styles.block}>
        <Text variant="text_bold">Parks near you</Text>
        {nearbyContent}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.m,
    gap: spacing.l,
  },
  signIn: {
    gap: spacing.xs,
    padding: spacing.m,
    borderRadius: radius.l,
    backgroundColor: colors.surface,
  },
  alignStart: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
  },
  block: {
    gap: spacing.xs,
  },
  loading: {
    paddingVertical: spacing.l,
  },
  list: {
    borderRadius: radius.l,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  parkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: controlSize.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  flex: {
    flex: 1,
  },
});
