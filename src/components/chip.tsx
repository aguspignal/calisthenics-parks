import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, controlSize, radius, shadows, spacing } from '@/theme';

import { Text } from './text';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Shown after the label, e.g. a chevron when the chip opens a sheet. */
  trailingIcon?: LucideIcon;
  /** `floating` adds a shadow for use over the map. */
  floating?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Toggle or filter chip. Selected chips use the inverse (light) surface. */
export function Chip({ label, selected = false, onPress, trailingIcon: Icon, floating = false, style }: ChipProps) {
  const foreground = selected ? colors.onInverse : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: selected ? colors.inverse : pressed ? colors.surfaceRaised : colors.surface,
          boxShadow: floating ? shadows.base : undefined,
        },
        style,
      ]}>
      <Text variant="notes" tone={selected ? 'onInverse' : 'default'} numberOfLines={1}>
        {label}
      </Text>
      {Icon ? <Icon size={16} color={foreground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: controlSize.s,
    paddingHorizontal: spacing.s,
    borderRadius: radius.pill,
  },
});
