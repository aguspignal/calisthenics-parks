import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { Coordinates } from '@/hooks/use-user-location';
import { getSupabase } from '@/lib/supabase';
import type { Bounds } from '@/utils/geo';

export type ParkFilters = {
  equipment: string[];
  amenities: string[];
  minRating: number | null;
  verifiedOnly: boolean;
};

export const noFilters: ParkFilters = { equipment: [], amenities: [], minRating: null, verifiedOnly: false };

/** Parks inside the map viewport; `bounds` null means the map is too zoomed out to query. */
export function useParksInView(bounds: Bounds | null, filters: ParkFilters) {
  return useQuery({
    queryKey: ['parks', 'in-view', bounds, filters],
    enabled: bounds !== null,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (!bounds) return [];
      const { data, error } = await getSupabase().rpc('parks_in_view', {
        min_lat: bounds.minLat,
        min_lng: bounds.minLng,
        max_lat: bounds.maxLat,
        max_lng: bounds.maxLng,
        equipment_ids: filters.equipment,
        amenity_ids: filters.amenities,
        min_rating: filters.minRating ?? undefined,
        verified_only: filters.verifiedOnly,
      });
      if (error) throw error;
      return data;
    },
  });
}

export type ParkInView = NonNullable<ReturnType<typeof useParksInView>['data']>[number];

export function usePark(id: string) {
  return useQuery({
    queryKey: ['parks', id],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('parks')
        .select(
          `id, name, description, lat, lng, status, review_count,
          rating_overall, rating_equipment, rating_environment, rating_cleanliness, rating_safety,
          equipment:park_equipment(condition, type:equipment_types(id, name, sort_order)),
          amenities:park_amenities(type:amenity_types(id, name, category, sort_order)),
          submissions:park_submissions(id, kind, status, confirmations, rejections)`,
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type ParkDetails = NonNullable<ReturnType<typeof usePark>['data']>;

export function useParkReviews(parkId: string) {
  return useQuery({
    queryKey: ['parks', parkId, 'reviews'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('reviews')
        .select('id, rating_overall, body, created_at, author:profiles(display_name)')
        .eq('park_id', parkId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useParkPhotos(parkId: string) {
  return useQuery({
    queryKey: ['parks', parkId, 'photos'],
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('park_photos')
        .select('id, storage_path, width, height')
        .eq('park_id', parkId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data.map((photo) => ({
        ...photo,
        url: supabase.storage.from('park-photos').getPublicUrl(photo.storage_path).data.publicUrl,
      }));
    },
  });
}

/** Parks within contribution range (app_settings.proximity_meters) of the user. */
export function useNearbyParks(location: Coordinates | null) {
  return useQuery({
    queryKey: ['parks', 'nearby', location],
    enabled: location !== null,
    queryFn: async () => {
      if (!location) return [];
      const { data, error } = await getSupabase().rpc('nearby_parks', {
        user_lat: location.latitude,
        user_lng: location.longitude,
      });
      if (error) throw error;
      return data;
    },
  });
}
