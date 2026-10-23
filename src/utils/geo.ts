import type { Region } from 'react-native-maps';

import type { Coordinates } from '@/hooks/use-user-location';
import type { DistanceUnit } from '@/providers/preferences-provider';

export type Bounds = { minLat: number; minLng: number; maxLat: number; maxLng: number };

const EARTH_RADIUS_METERS = 6_371_008.8;
const METERS_PER_DEGREE_LATITUDE = (2 * Math.PI * EARTH_RADIUS_METERS) / 360;

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

/** Box around `center` that reaches at least `meters` in every direction. */
export function boundsAround(center: Coordinates, meters: number): Bounds {
  const latDelta = meters / METERS_PER_DEGREE_LATITUDE;
  const lngDelta = Math.min(180, latDelta / Math.cos((center.latitude * Math.PI) / 180));
  return {
    minLat: Math.max(-90, center.latitude - latDelta),
    maxLat: Math.min(90, center.latitude + latDelta),
    minLng: Math.max(-180, center.longitude - lngDelta),
    maxLng: Math.min(180, center.longitude + lngDelta),
  };
}

/** Great-circle distance in meters (haversine), close enough to PostGIS for range checks in the UI. */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (unit === 'mi') {
    const miles = meters / 1609.344;
    return miles < 0.1 ? `${Math.round(meters * 3.28084)} ft` : `${miles.toFixed(1)} mi`;
  }
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}
