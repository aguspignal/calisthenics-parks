import type { Region } from 'react-native-maps';

import type { DistanceUnit } from '@/providers/preferences-provider';

export type Bounds = { minLat: number; minLng: number; maxLat: number; maxLng: number };

/** Viewports taller than this many degrees of latitude are too zoomed out to load parks. */
export const MAX_LOADABLE_LATITUDE_DELTA = 1;

/** Map viewport to a bounding box, widened to 4 decimals (~11 m) so small pans reuse cached queries. */
export function regionToBounds(region: Region): Bounds {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  return {
    minLat: Math.max(-90, Math.floor((region.latitude - halfLat) * 1e4) / 1e4),
    maxLat: Math.min(90, Math.ceil((region.latitude + halfLat) * 1e4) / 1e4),
    minLng: Math.max(-180, Math.floor((region.longitude - halfLng) * 1e4) / 1e4),
    maxLng: Math.min(180, Math.ceil((region.longitude + halfLng) * 1e4) / 1e4),
  };
}

export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (unit === 'mi') {
    const miles = meters / 1609.344;
    return miles < 0.1 ? `${Math.round(meters * 3.28084)} ft` : `${miles.toFixed(1)} mi`;
  }
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}
