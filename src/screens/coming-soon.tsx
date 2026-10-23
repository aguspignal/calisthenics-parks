import type { LucideIcon } from 'lucide-react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { Text } from '@/components/text';
import { spacing } from '@/theme';

type Props = {
  icon: LucideIcon;
  /** What this screen will do once built. */
  description: string;
  /** Product rules that apply, one per line. */
  rules?: string[];
};

/** Placeholder for a contribution flow that is not built yet. The title comes from the root layout. */
export function ComingSoon({ icon, description, rules = [] }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <EmptyState icon={icon} title="Coming soon" message={description} />
      {rules.map((rule) => (
        <Text key={rule} variant="notes" tone="secondary">
          {`•  ${rule}`}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.m,
    gap: spacing.xs,
  },
});
