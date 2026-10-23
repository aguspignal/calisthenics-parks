import { useQuery } from '@tanstack/react-query';

import { getSupabase } from '@/lib/supabase';

/** Server-side rule settings (confirmations required, proximity radius, ...), keyed by name. */
export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await getSupabase().from('app_settings').select('key, value');
      if (error) throw error;
      return Object.fromEntries(data.map((setting) => [setting.key, setting.value])) as Record<string, number | undefined>;
    },
  });
}

/** Equipment and amenity types. They change only through migrations, so they are cached for the session. */
export function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    staleTime: Infinity,
    queryFn: async () => {
      const supabase = getSupabase();
      const [equipment, amenities] = await Promise.all([
        supabase.from('equipment_types').select('id, name').order('sort_order'),
        supabase.from('amenity_types').select('id, name, category').order('category').order('sort_order'),
      ]);
      if (equipment.error) throw equipment.error;
      if (amenities.error) throw amenities.error;
      return { equipment: equipment.data, amenities: amenities.data };
    },
  });
}
