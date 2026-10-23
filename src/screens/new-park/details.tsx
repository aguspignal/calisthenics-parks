import { useRouter } from 'expo-router';
import { CircleAlert, MapPin, MapPinOff } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { OptionRow } from '@/components/option-row';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { Stepper } from '@/components/stepper';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useAppSettings, useCatalog } from '@/data/catalog';
import { useParkNameSuggestions } from '@/data/park-names';
import { useCreatePark } from '@/data/parks';
import { useUserLocation, type Coordinates } from '@/hooks/use-user-location';
import type { Enums } from '@/lib/database.types';
import { Section } from '@/screens/park/section';
import { colors, controlSize, radius, spacing } from '@/theme';

type Condition = Enums<'equipment_condition'>;
type EquipmentItem = { condition: Condition; quantity: number };

const conditions: { value: Condition; label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'worn', label: 'Worn' },
  { value: 'broken', label: 'Broken' },
];

/** Limits enforced by create_park. */
const DESCRIPTION_MAX = 1000;
const QUANTITY_MAX = 20;

/** Step 2 of adding a park: name (picked from suggestions), description, equipment with quantity and condition, amenities. */
export function NewParkDetailsScreen({ location }: { location: Coordinates }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();
  const settings = useAppSettings();
  const nameSuggestions = useParkNameSuggestions(location);
  const { getLocation } = useUserLocation();
  const createPark = useCreatePark();
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  /** Selected equipment types with their condition and quantity. */
  const [equipment, setEquipment] = useState<Record<string, EquipmentItem>>({});
  const [amenityIds, setAmenityIds] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);

  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
    return (
      <View style={styles.centered}>
        <EmptyState icon={MapPinOff} title="No location" message="Place the pin on the map first.">
          <Button title="Back to the map" variant="secondary" onPress={() => router.back()} />
        </EmptyState>
      </View>
    );
  }

  // The first suggestion is selected until the user picks another.
  const name = pickedName ?? nameSuggestions.data?.[0] ?? null;

  const toggleEquipment = (id: string) =>
    setEquipment(({ [id]: current, ...others }) =>
      current ? others : { ...others, [id]: { condition: 'good', quantity: 1 } },
    );

  const updateEquipment = (id: string, changes: Partial<EquipmentItem>) =>
    setEquipment((current) => ({ ...current, [id]: { ...current[id], ...changes } }));

  const toggleAmenity = (id: string) =>
    setAmenityIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  const submit = async () => {
    if (!name) return;
    let userLocation: Coordinates | null;
    setLocating(true);
    try {
      // The server checks that the user, not just the pin, is near the park.
      userLocation = await getLocation();
    } catch {
      Alert.alert("Couldn't find your location", 'Check that location is turned on and try again.');
      return;
    } finally {
      setLocating(false);
    }
    // Declined: getLocation already pointed to Settings if Android won't ask again.
    if (!userLocation) return;

    createPark.mutate(
      {
        park: {
          name,
          description,
          location,
          equipment: Object.entries(equipment).map(([type, item]) => ({ type, ...item })),
          amenityIds,
        },
        userLocation,
      },
      {
        onSuccess: (id) => {
          // The new park's page takes the place of both add-park steps, so Back returns to Contribute.
          router.dismiss();
          router.replace({ pathname: '/park/[id]', params: { id } });
        },
        onError: (error) => Alert.alert("Couldn't add the park", error.message),
      },
    );
  };

  let nameContent;
  if (nameSuggestions.isPending) {
    nameContent = (
      <View style={styles.inline}>
        <ActivityIndicator color={colors.textMuted} />
        <Text variant="notes" tone="muted">
          Looking up the address…
        </Text>
      </View>
    );
  } else if (nameSuggestions.isError) {
    nameContent = (
      <EmptyState
        icon={CircleAlert}
        title="Couldn't look up the address"
        message="Names come from the address at the pin, which needs a connection.">
        <Button title="Try again" variant="secondary" onPress={() => nameSuggestions.refetch()} />
      </EmptyState>
    );
  } else {
    nameContent = (
      <View>
        {nameSuggestions.data.map((suggestion) => (
          <OptionRow
            key={suggestion}
            type="radio"
            label={suggestion}
            selected={suggestion === name}
            onPress={() => setPickedName(suggestion)}
          />
        ))}
      </View>
    );
  }

  let catalogContent;
  if (catalog.isPending) {
    catalogContent = <ActivityIndicator color={colors.textMuted} style={styles.loading} />;
  } else if (catalog.isError) {
    catalogContent = (
      <EmptyState icon={CircleAlert} title="Couldn't load equipment and amenities" message={catalog.error.message}>
        <Button title="Try again" variant="secondary" onPress={() => catalog.refetch()} />
      </EmptyState>
    );
  } else {
    const amenityGroups = [
      { title: 'Amenities', options: catalog.data.amenities.filter((a) => a.category === 'amenity') },
      { title: 'Accessibility', options: catalog.data.amenities.filter((a) => a.category === 'accessibility') },
    ];
    catalogContent = (
      <>
        <Section title="Equipment">
          <Text variant="notes" tone="muted">
            Tick what the park has, how many, and how it&apos;s holding up.
          </Text>
          <View>
            {catalog.data.equipment.map((item) => {
              const selected = equipment[item.id];
              return (
                <View key={item.id}>
                  <OptionRow label={item.name} selected={selected !== undefined} onPress={() => toggleEquipment(item.id)} />
                  {selected ? (
                    <View style={styles.equipmentDetails}>
                      <View style={styles.conditions}>
                        {conditions.map((option) => (
                          <Chip
                            key={option.value}
                            label={option.label}
                            selected={selected.condition === option.value}
                            onPress={() => updateEquipment(item.id, { condition: option.value })}
                          />
                        ))}
                      </View>
                      <Stepper
                        value={selected.quantity}
                        min={1}
                        max={QUANTITY_MAX}
                        onChange={(quantity) => updateEquipment(item.id, { quantity })}
                        accessibilityLabel={`${item.name} quantity`}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Section>

        <Section title="Amenities & accessibility">
          {amenityGroups.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text variant="caption" tone="muted">
                {group.title.toUpperCase()}
              </Text>
              <View style={styles.chips}>
                {group.options.map((option) => (
                  <Chip
                    key={option.id}
                    label={option.name}
                    selected={amenityIds.includes(option.id)}
                    onPress={() => toggleAmenity(option.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </Section>
      </>
    );
  }

  const confirmations = settings.data?.confirmations_required;
  const rejections = settings.data?.rejections_required;
  const rulesText =
    confirmations && rejections
      ? `The park shows as unverified until ${confirmations} other people nearby confirm it. ${rejections} rejections remove it.`
      : 'The park shows as unverified until other people nearby confirm it.';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.locationCard}>
          <MapPin size={20} color={colors.accent} />
          <View style={styles.flex}>
            <Text>Pin placed</Text>
            <Text variant="caption" tone="muted">
              {`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
            </Text>
          </View>
          <Button title="Change" variant="ghost" size="s" onPress={() => router.back()} />
        </View>

        <Section title="Name">
          <Text variant="notes" tone="muted">
            Pick the name everyone will see. The options come from the address at the pin.
          </Text>
          {nameContent}
        </Section>

        <TextField
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          placeholder="How to find it, surface, crowds…"
          multiline
          maxLength={DESCRIPTION_MAX}
          hint={`${description.length}/${DESCRIPTION_MAX}`}
        />

        {catalogContent}

        <Text variant="caption" tone="muted">
          {rulesText}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.s }]}>
        <Button
          title="Add park"
          onPress={submit}
          loading={locating || createPark.isPending}
          disabled={!name}
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
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
    gap: spacing.l,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingLeft: spacing.m,
    paddingRight: spacing.xs,
    paddingVertical: spacing.s,
    borderRadius: radius.l,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSize.m,
  },
  loading: {
    paddingVertical: spacing.l,
  },
  equipmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingBottom: spacing.s,
  },
  conditions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  group: {
    gap: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
