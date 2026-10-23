import { ChevronDown, Settings } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { IconButton } from '@/components/icon-button';
import type { ParkFilters } from '@/data/parks';
import { spacing } from '@/theme';

import type { FilterSection } from './filter-sheet';

type Props = {
  filters: ParkFilters;
  onChange: (filters: ParkFilters) => void;
  onOpenSection: (section: FilterSection) => void;
  onOpenSettings: () => void;
};

const withCount = (label: string, count: number) => (count > 0 ? `${label} · ${count}` : label);

/** Filter chips over the top of the map, with the settings button at the end. */
export function FilterBar({ filters, onChange, onOpenSection, onOpenSettings }: Props) {
  return (
    <View style={styles.row} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.chips}>
        <Chip
          floating
          label={withCount('Equipment', filters.equipment.length)}
          selected={filters.equipment.length > 0}
          trailingIcon={ChevronDown}
          onPress={() => onOpenSection('equipment')}
        />
        <Chip
          floating
          label={withCount('Amenities', filters.amenities.length)}
          selected={filters.amenities.length > 0}
          trailingIcon={ChevronDown}
          onPress={() => onOpenSection('amenities')}
        />
        <Chip
          floating
          label={filters.minRating === null ? 'Rating' : `${filters.minRating}+ stars`}
          selected={filters.minRating !== null}
          trailingIcon={ChevronDown}
          onPress={() => onOpenSection('rating')}
        />
        <Chip
          floating
          label="Verified only"
          selected={filters.verifiedOnly}
          onPress={() => onChange({ ...filters, verifiedOnly: !filters.verifiedOnly })}
        />
      </ScrollView>
      <IconButton icon={Settings} accessibilityLabel="Settings" onPress={onOpenSettings} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingRight: spacing.m,
  },
  scroll: {
    flex: 1,
  },
  chips: {
    gap: spacing.xs,
    paddingLeft: spacing.m,
    paddingRight: spacing.xs,
    // Room for the chips' shadows, which the scroll view would clip.
    paddingVertical: spacing.xxs,
  },
});
