import { BottomSheet, Host, RNHostView } from '@expo/ui';
import { Check, CircleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { Text } from '@/components/text';
import { useCatalog } from '@/data/catalog';
import type { ParkFilters } from '@/data/parks';
import { colors, controlSize, radius, spacing } from '@/theme';

export type FilterSection = 'equipment' | 'amenities' | 'rating';

const titles: Record<FilterSection, string> = {
  equipment: 'Equipment',
  amenities: 'Amenities & accessibility',
  rating: 'Minimum rating',
};

const ratingOptions = [3, 4, 4.5] as const;

type Props = {
  /** The open section, or null when the sheet is closed. */
  section: FilterSection | null;
  filters: ParkFilters;
  onChange: (filters: ParkFilters) => void;
  onClose: () => void;
};

/** Native bottom sheet for one filter section. Changes apply immediately. */
export function FilterSheet({ section, filters, onChange, onClose }: Props) {
  // Keep rendering the last section while the sheet animates closed.
  const [shownSection, setShownSection] = useState<FilterSection>(section ?? 'equipment');
  if (section !== null && section !== shownSection) {
    setShownSection(section);
  }

  const { height } = useWindowDimensions();
  const catalog = useCatalog();

  const toggle = (key: 'equipment' | 'amenities', id: string) => {
    const current = filters[key];
    onChange({ ...filters, [key]: current.includes(id) ? current.filter((value) => value !== id) : [...current, id] });
  };

  const clear = () => {
    if (shownSection === 'rating') onChange({ ...filters, minRating: null });
    else onChange({ ...filters, [shownSection]: [] });
  };

  let body;
  if (shownSection === 'rating') {
    body = (
      <View style={styles.ratingRow}>
        <Chip label="Any" selected={filters.minRating === null} onPress={() => onChange({ ...filters, minRating: null })} />
        {ratingOptions.map((value) => (
          <Chip
            key={value}
            label={`${value}+ stars`}
            selected={filters.minRating === value}
            onPress={() => onChange({ ...filters, minRating: value })}
          />
        ))}
      </View>
    );
  } else if (catalog.isError) {
    body = <EmptyState icon={CircleAlert} title="Couldn't load filters" message={catalog.error.message} />;
  } else if (catalog.isPending) {
    body = (
      <Text tone="muted" style={styles.loading}>
        Loading…
      </Text>
    );
  } else {
    const groups =
      shownSection === 'equipment'
        ? [{ title: null, options: catalog.data.equipment }]
        : [
            { title: 'Amenities', options: catalog.data.amenities.filter((a) => a.category === 'amenity') },
            { title: 'Accessibility', options: catalog.data.amenities.filter((a) => a.category === 'accessibility') },
          ];
    body = (
      <ScrollView nestedScrollEnabled style={{ maxHeight: height * 0.55 }}>
        {groups.map((group) => (
          <View key={group.title ?? 'all'}>
            {group.title ? (
              <Text variant="caption" tone="muted" style={styles.groupTitle}>
                {group.title.toUpperCase()}
              </Text>
            ) : null}
            {group.options.map((option) => (
              <OptionRow
                key={option.id}
                label={option.name}
                selected={filters[shownSection].includes(option.id)}
                onPress={() => toggle(shownSection, option.id)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <Host matchContents colorScheme="dark">
      <BottomSheet isPresented={section !== null} onDismiss={onClose} containerColor={colors.surface}>
        {/* The sheet has its own window with no React root above it. RNHostView acts as that root, so
            touches and the option list's scroll gesture work. A bare ScrollView here crashes on scroll. */}
        <RNHostView matchContents={{ vertical: true }}>
          <View style={styles.content}>
            <Text variant="subtitles">{titles[shownSection]}</Text>
            {body}
            <View style={styles.actions}>
              <Button title="Clear" variant="ghost" onPress={clear} />
              <Button title="Done" onPress={onClose} />
            </View>
          </View>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceRaised }]}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected ? <Check size={16} color={colors.onAccent} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.m,
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.m,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  loading: {
    paddingVertical: spacing.l,
  },
  groupTitle: {
    paddingTop: spacing.s,
    paddingBottom: spacing.xxs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: controlSize.m,
    borderRadius: radius.m,
  },
  optionLabel: {
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.s,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
});
