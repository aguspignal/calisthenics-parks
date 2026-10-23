import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, controlSize, radius, shadows, spacing } from '@/theme';

import { Text, type TextTone } from './text';

const variants = {
  primary: { backgroundColor: colors.accent, tone: 'onAccent', foreground: colors.onAccent },
  secondary: { backgroundColor: colors.surface, tone: 'default', foreground: colors.text },
  ghost: { backgroundColor: 'transparent', tone: 'default', foreground: colors.text },
  danger: { backgroundColor: 'transparent', tone: 'danger', foreground: colors.danger },
} as const satisfies Record<string, { backgroundColor: string; tone: TextTone; foreground: string }>;

const sizes = {
  s: { minHeight: controlSize.s, paddingHorizontal: spacing.s, gap: spacing.xxs, iconSize: 16 },
  m: { minHeight: controlSize.m, paddingHorizontal: spacing.l, gap: spacing.xs, iconSize: 20 },
} as const;

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** `pill` is for floating actions over the map. */
  shape?: 'rounded' | 'pill';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  /** Layout overrides only (margins, flex). */
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'm',
  shape = 'rounded',
  icon: Icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { backgroundColor, tone, foreground } = variants[variant];
  const { iconSize, ...sizeStyle } = sizes[size];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        {
          backgroundColor,
          borderRadius: shape === 'pill' ? radius.pill : radius.m,
          boxShadow: shape === 'pill' ? shadows.base : undefined,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {Icon ? <Icon size={iconSize} color={foreground} /> : null}
          <Text variant="text_bold" tone={tone}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
