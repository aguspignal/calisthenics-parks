import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './text';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  message?: string;
  /** Actions, such as a Button. */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Centered icon + message for empty, unavailable or not-yet-built content. */
export function EmptyState({ icon: Icon, title, message, children, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Icon size={32} color={colors.textMuted} />
      <Text variant="text_bold" style={styles.center}>
        {title}
      </Text>
      {message ? (
        <Text variant="notes" tone="muted" style={styles.center}>
          {message}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.m,
  },
  center: {
    textAlign: 'center',
  },
});
