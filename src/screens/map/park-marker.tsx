import { Dumbbell } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import type { ParkInView } from '@/data/parks';
import { colors, radius } from '@/theme';

type Props = {
  park: ParkInView;
  onPress: () => void;
};

/** Orange marker for verified parks, grey outlined marker for unverified (pending) ones. */
export function ParkMarker({ park, onPress }: Props) {
  // Android draws custom marker views as bitmaps: track changes until the icon has rendered, then stop.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const pending = park.status === 'pending';

  return (
    <Marker
      coordinate={{ latitude: park.lat, longitude: park.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      onPress={onPress}
      accessibilityLabel={pending ? `${park.name}, unverified` : park.name}>
      <View style={[styles.marker, pending ? styles.pending : styles.verified]}>
        <Dumbbell size={16} color={pending ? colors.text : colors.onAccent} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verified: {
    backgroundColor: colors.accent,
    borderColor: colors.background,
  },
  pending: {
    backgroundColor: colors.surface,
    borderColor: colors.pending,
  },
});
