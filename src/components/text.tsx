import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme';

const tones = {
  default: colors.text,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  accent: colors.accent,
  danger: colors.danger,
  onAccent: colors.onAccent,
  onInverse: colors.onInverse,
} as const;

export type TextTone = keyof typeof tones;

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
};

/** All app text goes through here so it uses the design system's type styles. */
export function Text({ variant = 'text', tone = 'default', style, ...rest }: TextProps) {
  return <RNText style={[typography[variant], { color: tones[tone] }, style]} {...rest} />;
}
