import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';

import type { Coordinates } from '@/hooks/use-user-location';

/** create_park accepts names of 2 to 80 characters. */
const NAME_MIN = 2;
const NAME_MAX = 80;

/** Open Location Code ("8Q7X+2C"), which Android sometimes returns as the place name. */
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{2,8}\+[23456789CFGHJMPQRVWX]*$/i;
const HAS_LETTER = /\p{L}/u;

/** Joins the non-empty parts with commas, skipping repeats ("Madrid, Madrid"). */
function joinParts(...parts: (string | null)[]): string {
  const unique: string[] = [];
  for (const part of parts) {
    const trimmed = part?.trim();
    if (trimmed && !unique.some((seen) => seen.toLowerCase() === trimmed.toLowerCase())) unique.push(trimmed);
  }
  return unique.join(', ');
}

/**
 * Names built from the address: the place's own name and its street. City and area names are left
 * out, as they name a town or neighbourhood rather than the spot.
 */
function buildSuggestions(addresses: Location.LocationGeocodedAddress[], location: Coordinates): string[] {
  const candidates: string[] = [];
  for (const address of addresses) {
    const { name, street, city } = address;
    // Android's place name is often just the house number, a plus code or the street address.
    const isPlaceName =
      name !== null &&
      HAS_LETTER.test(name) &&
      !PLUS_CODE.test(name.split(' ')[0]) &&
      !(street !== null && name.includes(street));
    if (isPlaceName) candidates.push(joinParts(name));
    // The neighbourhood tells apart streets with the same name; Android sometimes repeats the city there.
    const district = address.district?.toLowerCase() === city?.toLowerCase() ? null : address.district;
    if (street) candidates.push(joinParts(street, district));
  }

  const suggestions: string[] = [];
  for (const candidate of candidates) {
    const fits = candidate.length >= NAME_MIN && candidate.length <= NAME_MAX;
    if (fits && !suggestions.some((seen) => seen.toLowerCase() === candidate.toLowerCase())) {
      suggestions.push(candidate);
    }
  }
  // No place or street name (open country, sea): fall back to its coordinates.
  if (suggestions.length === 0) {
    suggestions.push(`Park at ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
  }
  return suggestions;
}

/**
 * Names a new park can take, from the address at its pin (the device's geocoder, so it needs a
 * connection). Users pick one instead of typing a name.
 */
export function useParkNameSuggestions(location: Coordinates) {
  return useQuery({
    queryKey: ['park-name-suggestions', location.latitude, location.longitude],
    enabled: Number.isFinite(location.latitude) && Number.isFinite(location.longitude),
    staleTime: Infinity,
    queryFn: async () => buildSuggestions(await Location.reverseGeocodeAsync(location), location),
  });
}
