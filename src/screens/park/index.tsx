import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Check, CircleAlert, MapPin, MessageSquare, Navigation, PencilLine, ShieldCheck } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { Text, type TextTone } from '@/components/text';
import { useAppSettings } from '@/data/catalog';
import { usePark, useParkPhotos, useParkReviews } from '@/data/parks';
import type { Enums } from '@/lib/database.types';
import { colors, radius, spacing } from '@/theme';

import { Section } from './section';
import { Stars } from './stars';

const conditions: Record<Enums<'equipment_condition'>, { label: string; tone: TextTone }> = {
  good: { label: 'Good', tone: 'secondary' },
  worn: { label: 'Worn', tone: 'accent' },
  broken: { label: 'Broken', tone: 'default' },
};

export function ParkScreen({ id }: { id: string }) {
  const router = useRouter();
  const park = usePark(id);
  const reviews = useParkReviews(id);
  const photos = useParkPhotos(id);
  const settings = useAppSettings();

  if (park.isPending) {
    return (
      <Centered>
        <ActivityIndicator color={colors.textMuted} />
      </Centered>
    );
  }
  if (park.isError) {
    return (
      <Centered>
        <EmptyState icon={CircleAlert} title="Couldn't load this park" message={park.error.message}>
          <Button title="Try again" variant="secondary" onPress={() => park.refetch()} />
        </EmptyState>
      </Centered>
    );
  }
  if (!park.data) {
    return (
      <Centered>
        <EmptyState icon={MapPin} title="Park not found" message="It may have been removed." />
      </Centered>
    );
  }

  const p = park.data;
  const pendingCreate = p.submissions.find((s) => s.kind === 'create' && s.status === 'pending');
  const pendingChanges = p.submissions.filter((s) => s.kind !== 'create' && s.status === 'pending').length;
  const confirmationsRequired = settings.data?.confirmations_required;
  const equipment = p.equipment
    .flatMap((item) => (item.type ? [{ ...item.type, condition: item.condition, quantity: item.quantity }] : []))
    .sort((a, b) => a.sort_order - b.sort_order);
  const amenities = p.amenities
    .flatMap((item) => (item.type ? [item.type] : []))
    .sort((a, b) => a.category.localeCompare(b.category) || a.sort_order - b.sort_order);
  const ratings = [
    { label: 'Overall', value: p.rating_overall },
    { label: 'Equipment quality', value: p.rating_equipment },
    { label: 'Environment', value: p.rating_environment },
    { label: 'Cleanliness', value: p.rating_cleanliness },
    { label: 'Safety', value: p.rating_safety },
  ];

  const verify = () => router.push({ pathname: '/park/[id]/verify', params: { id } });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="title">{p.name}</Text>
        {pendingCreate ? (
          <View style={styles.badge}>
            <Text variant="caption" tone="secondary">
              {`Unverified · ${pendingCreate.confirmations}/${confirmationsRequired ?? '?'} confirmations`}
            </Text>
          </View>
        ) : null}
        {p.review_count > 0 && p.rating_overall !== null ? (
          <View style={styles.inline}>
            <Stars value={p.rating_overall} />
            <Text variant="notes" tone="secondary">
              {`${p.rating_overall.toFixed(1)} · ${p.review_count} ${p.review_count === 1 ? 'review' : 'reviews'}`}
            </Text>
          </View>
        ) : (
          <Text variant="notes" tone="muted">
            No reviews yet
          </Text>
        )}
        {p.description ? <Text tone="secondary">{p.description}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Button
          title="Directions"
          icon={Navigation}
          variant="secondary"
          size="s"
          onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`)}
        />
        {pendingCreate ? (
          <Button title="Confirm or reject" icon={ShieldCheck} size="s" onPress={verify} />
        ) : (
          <>
            <Button
              title="Review"
              icon={MessageSquare}
              size="s"
              onPress={() => router.push({ pathname: '/park/[id]/review', params: { id } })}
            />
            <Button
              title="Suggest edit"
              icon={PencilLine}
              variant="secondary"
              size="s"
              onPress={() => router.push({ pathname: '/park/[id]/edit', params: { id } })}
            />
          </>
        )}
      </View>
      {pendingChanges > 0 ? (
        <Pressable accessibilityRole="link" onPress={verify} hitSlop={8}>
          <Text variant="notes" tone="accent">
            {`${pendingChanges} pending ${pendingChanges === 1 ? 'change' : 'changes'} waiting for confirmation`}
          </Text>
        </Pressable>
      ) : null}

      <Section title="Photos">
        {photos.data && photos.data.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
            {photos.data.map((photo) => (
              <Image
                key={photo.id}
                source={{ uri: photo.url }}
                style={styles.photo}
                contentFit="cover"
                accessibilityLabel="Park photo"
              />
            ))}
          </ScrollView>
        ) : (
          <Muted>{photos.isPending ? 'Loading…' : photos.isError ? "Couldn't load photos." : 'No photos yet.'}</Muted>
        )}
      </Section>

      <Section title="Equipment">
        {equipment.length === 0 ? <Muted>No equipment listed.</Muted> : null}
        {equipment.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.flex}>
              {item.name}
              {item.quantity > 1 ? <Text tone="muted">{` ×${item.quantity}`}</Text> : null}
            </Text>
            {item.condition === 'broken' ? <CircleAlert size={16} color={colors.danger} /> : null}
            <Text variant="notes" tone={conditions[item.condition].tone}>
              {conditions[item.condition].label}
            </Text>
          </View>
        ))}
      </Section>

      <Section title="Amenities & accessibility">
        {amenities.length === 0 ? (
          <Muted>None listed.</Muted>
        ) : (
          <View style={styles.tags}>
            {amenities.map((amenity) => (
              <View key={amenity.id} style={styles.tag}>
                <Check size={14} color={colors.accent} />
                <Text variant="notes">{amenity.name}</Text>
              </View>
            ))}
          </View>
        )}
      </Section>

      <Section title="Ratings">
        {p.review_count === 0 ? <Muted>Ratings appear after the first review.</Muted> : null}
        {p.review_count > 0
          ? ratings.map((rating) => (
              <View key={rating.label} style={styles.row}>
                <Text variant="notes" style={styles.flex}>
                  {rating.label}
                </Text>
                <Stars value={rating.value ?? 0} />
                <Text variant="notes" tone="secondary" style={styles.ratingValue}>
                  {rating.value?.toFixed(1) ?? '–'}
                </Text>
              </View>
            ))
          : null}
      </Section>

      <Section title="Reviews">
        {reviews.isPending ? <Muted>Loading…</Muted> : null}
        {reviews.isError ? <Muted>{"Couldn't load reviews."}</Muted> : null}
        {reviews.data?.length === 0 ? <Muted>No reviews yet.</Muted> : null}
        {reviews.data?.map((review) => (
          <View key={review.id} style={styles.review}>
            <View style={styles.row}>
              <Text variant="text_bold" style={styles.flex}>
                {review.author?.display_name ?? 'Anonymous'}
              </Text>
              <Text variant="caption" tone="muted">
                {new Date(review.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Stars value={review.rating_overall} />
            {review.body ? (
              <Text variant="notes" tone="secondary">
                {review.body}
              </Text>
            ) : null}
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

function Muted({ children }: { children: string }) {
  return (
    <Text variant="notes" tone="muted">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
    gap: spacing.l,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.m,
  },
  header: {
    gap: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs / 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.pending,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: -spacing.xs,
  },
  photos: {
    gap: spacing.xs,
  },
  photo: {
    width: 160,
    height: 120,
    borderRadius: radius.l,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  ratingValue: {
    minWidth: spacing.l,
    textAlign: 'right',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  review: {
    gap: spacing.xxs,
    paddingVertical: spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
