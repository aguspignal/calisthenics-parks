import { useRouter } from 'expo-router';
import { LocateFixed, Plus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { noFilters, useParksInView, type ParkFilters } from '@/data/parks';
import { useUserLocation } from '@/hooks/use-user-location';
import { isSupabaseConfigured } from '@/lib/supabase';
import { colors, controlSize, mapStyle, radius, shadows, spacing } from '@/theme';
import { MAX_LOADABLE_LATITUDE_DELTA, regionToBounds } from '@/utils/geo';

import { FilterBar } from './filter-bar';
import { FilterSheet, type FilterSection } from './filter-sheet';
import { ParkMarker } from './park-marker';

const USER_ZOOM = 15;
/** Space the overlays take, so Google's logo and camera moves stay clear of them. */
const TOP_OVERLAY = controlSize.m + spacing.xs;
const BOTTOM_OVERLAY = controlSize.m + spacing.m;

export function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasPermission, getLocation } = useUserLocation();
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [filters, setFilters] = useState<ParkFilters>(noFilters);
  const [openSection, setOpenSection] = useState<FilterSection | null>(null);

  const zoomedOut = region === null || region.latitudeDelta > MAX_LOADABLE_LATITUDE_DELTA;
  const bounds = isSupabaseConfigured && region && !zoomedOut ? regionToBounds(region) : null;
  const parks = useParksInView(bounds, filters);

  const centerOnUser = async (explainDenial: boolean) => {
    try {
      const location = await getLocation({ explainDenial });
      if (location) {
        mapRef.current?.animateCamera({ center: location, zoom: USER_ZOOM }, { duration: 600 });
      }
    } catch {
      // Location services off or no fix yet.
      if (explainDenial) Alert.alert("Couldn't find your location", 'Check that location is turned on and try again.');
    }
  };

  const hasFilters =
    filters.equipment.length > 0 || filters.amenities.length > 0 || filters.minRating !== null || filters.verifiedOnly;

  let notice: string | null = null;
  if (!isSupabaseConfigured) notice = 'Supabase is not configured: see README';
  else if (zoomedOut) notice = 'Zoom in to see parks';
  else if (parks.isError) notice = "Couldn't load parks";
  else if (parks.data?.length === 0 && hasFilters) notice = 'No parks match these filters here';

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        showsUserLocation={hasPermission}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        mapPadding={{
          top: insets.top + TOP_OVERLAY,
          right: 0,
          bottom: insets.bottom + BOTTOM_OVERLAY,
          left: 0,
        }}
        onMapReady={() => centerOnUser(false)}
        onRegionChangeComplete={setRegion}>
        {parks.data?.map((park) => (
          <ParkMarker
            key={park.id}
            park={park}
            onPress={() => router.push({ pathname: '/park/[id]', params: { id: park.id } })}
          />
        ))}
      </MapView>

      <View style={[styles.top, { paddingTop: insets.top + spacing.xs }]} pointerEvents="box-none">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onOpenSection={setOpenSection}
          onOpenSettings={() => router.push('/settings')}
        />
        {notice ? (
          <View style={styles.notice} pointerEvents="none">
            <Text variant="notes">{notice}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.m }]} pointerEvents="box-none">
        <View style={styles.sideSlot} />
        <Button title="Contribute" icon={Plus} shape="pill" onPress={() => router.push('/contribute')} />
        <IconButton icon={LocateFixed} accessibilityLabel="Center on my location" onPress={() => centerOnUser(true)} />
      </View>

      <FilterSheet section={openSection} filters={filters} onChange={setFilters} onClose={() => setOpenSection(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: spacing.xs,
  },
  notice: {
    alignSelf: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    boxShadow: shadows.base,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
  },
  sideSlot: {
    width: controlSize.m,
  },
});
