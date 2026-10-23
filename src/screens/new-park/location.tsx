import { useRouter } from 'expo-router';
import { CircleAlert, Layers, LocateFixed, MapPin, MapPinOff } from 'lucide-react-native';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { useAppSettings } from '@/data/catalog';
import { noFilters, useParksInView } from '@/data/parks';
import { useUserLocation, type Coordinates } from '@/hooks/use-user-location';
import { usePreferences } from '@/providers/preferences-provider';
import { ParkMarker } from '@/screens/map/park-marker';
import { blockedCircle, colors, mapStyle, rangeCircle, spacing } from '@/theme';
import { boundsAround, distanceMeters, formatDistance } from '@/utils/geo';

/** Close enough to put the pin on a specific bar. */
const PIN_ZOOM = 18;
const PIN_SIZE = 40;

/** Step 1 of adding a park: the user pans the map under a fixed pin, inside their contribution range. */
export function NewParkLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { distanceUnit } = usePreferences();
  const { hasPermission, getLocation } = useUserLocation();
  const settings = useAppSettings();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(true);
  /** The map center, under the pin. Null until the map reports its first position. */
  const [pin, setPin] = useState<Coordinates | null>(null);
  const [satellite, setSatellite] = useState(false);
  const proximity = settings.data?.proximity_meters;
  const duplicateRadius = settings.data?.duplicate_radius_meters;
  // A pin at the edge of the range can still be too close to a park just outside it.
  const reach = proximity !== undefined && duplicateRadius !== undefined ? proximity + duplicateRadius : undefined;
  const parks = useParksInView(location && reach !== undefined ? boundsAround(location, reach) : null, noFilters);

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

  const recenter = async () => {
    try {
      const current = await getLocation();
      if (!current) return;
      setLocation(current);
      mapRef.current?.animateCamera({ center: current, zoom: PIN_ZOOM }, { duration: 600 });
    } catch {
      Alert.alert("Couldn't find your location", 'Check that location is turned on and try again.');
    }
  };

  if (locating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }
  if (!location) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon={MapPinOff}
          title="Location needed"
          message="Parks can only be added near where you are, so the app needs your location.">
          <Button title="Use my location" variant="secondary" onPress={() => locate(true)} />
        </EmptyState>
      </View>
    );
  }

  const spot = pin ?? location;
  const outOfRange = proximity !== undefined && distanceMeters(location, spot) > proximity;
  // Mirrors create_park's duplicate check, which has the final say.
  const duplicate =
    duplicateRadius !== undefined
      ? parks.data?.find((park) => distanceMeters(spot, { latitude: park.lat, longitude: park.lng }) < duplicateRadius)
      : undefined;

  let message = "Move the map to put the pin on the park's equipment.";
  if (outOfRange) {
    message = `Too far from you. Keep the pin inside the circle, within ${formatDistance(proximity, distanceUnit)} of where you are.`;
  } else if (duplicate && duplicateRadius !== undefined) {
    message = `${duplicate.name} is already on the map here. New parks need to be at least ${formatDistance(duplicateRadius, distanceUnit)} from other parks.`;
  }
  const blocked = outOfRange || duplicate !== undefined;

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          mapType={satellite ? 'satellite' : 'standard'}
          customMapStyle={mapStyle}
          initialCamera={{ center: location, zoom: PIN_ZOOM, heading: 0, pitch: 0 }}
          showsUserLocation={hasPermission}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          moveOnMarkerPress={false}
          onRegionChangeComplete={(region) => setPin({ latitude: region.latitude, longitude: region.longitude })}>
          {proximity !== undefined ? <Circle center={location} radius={proximity} {...rangeCircle} /> : null}
          {duplicateRadius !== undefined
            ? parks.data?.map((park) => (
                <Circle
                  key={`blocked-${park.id}`}
                  center={{ latitude: park.lat, longitude: park.lng }}
                  radius={duplicateRadius}
                  {...blockedCircle}
                />
              ))
            : null}
          {parks.data?.map((park) => (
            <ParkMarker key={park.id} park={park} />
          ))}
        </MapView>

        <View style={styles.pinLayer} pointerEvents="none">
          <MapPin size={PIN_SIZE} color={colors.onAccent} fill={colors.accent} strokeWidth={1.5} style={styles.pin} />
        </View>

        <View style={styles.mapControls} pointerEvents="box-none">
          <IconButton
            icon={Layers}
            accessibilityLabel={satellite ? 'Show map' : 'Show satellite'}
            onPress={() => setSatellite((value) => !value)}
          />
          <IconButton icon={LocateFixed} accessibilityLabel="Center on my location" onPress={recenter} />
        </View>
      </View>

      <View style={[styles.panel, { paddingBottom: insets.bottom + spacing.m }]}>
        <View style={styles.message}>
          {blocked ? <CircleAlert size={18} color={colors.danger} /> : null}
          <Text variant="notes" tone="secondary" style={styles.flex}>
            {message}
          </Text>
        </View>
        <Button
          title="Use this spot"
          disabled={blocked}
          onPress={() =>
            router.push({
              pathname: '/contribute/new-park/details',
              params: { lat: String(spot.latitude), lng: String(spot.longitude) },
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.m,
  },
  map: {
    flex: 1,
  },
  pinLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    // The icon's tip sits at 92% of its height: lift it so the tip, not the middle, marks the map center.
    transform: [{ translateY: -PIN_SIZE * 0.42 }],
  },
  mapControls: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    gap: spacing.xs,
  },
  panel: {
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
});
