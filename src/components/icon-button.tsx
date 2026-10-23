import type { LucideIcon } from 'lucide-react-native';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { colors, controlSize, radius, shadows } from '@/theme';

export type IconButtonProps = {
  icon: LucideIcon;
  /** Required: the button has no visible text. */
  accessibilityLabel: string;
  onPress?: () => void;
  /** `floating` adds a surface and shadow for use over the map. */
  variant?: 'floating' | 'plain';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Round, icon-only button with a 48dp touch target. */
export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'floating',
  disabled = false,
  style,
}: IconButtonProps) {
  const floating = variant === 'floating';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={floating ? undefined : 4}
      style={({ pressed }) => [
        {
          width: controlSize.m,
          height: controlSize.m,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.surfaceRaised : floating ? colors.surface : 'transparent',
          boxShadow: floating ? shadows.base : undefined,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}>
      <Icon size={22} color={colors.text} />
    </Pressable>
  );
}
