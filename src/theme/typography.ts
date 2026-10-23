import type { TextStyle } from 'react-native';

/**
 * Inter is embedded at build time by the expo-font plugin (app.json) as one Android font
 * family with 400, 600 and 700 faces, so `fontWeight` picks the matching face.
 */
export const fontFamily = 'Inter';

/** Text styles from the design system. Line height is 1.5x the font size. */
export const typography = {
  /** Titles. */
  title: { fontFamily, fontSize: 24, lineHeight: 36, fontWeight: '700' },
  /** Subtitles and top bars. */
  subtitles: { fontFamily, fontSize: 20, lineHeight: 30, fontWeight: '600' },
  text_bold: { fontFamily, fontSize: 16, lineHeight: 24, fontWeight: '600' },
  /** Main text style. */
  text: { fontFamily, fontSize: 16, lineHeight: 24, fontWeight: '400' },
  /** Notes and comments. */
  notes: { fontFamily, fontSize: 14, lineHeight: 21, fontWeight: '400' },
  /** Least relevant text. */
  caption: { fontFamily, fontSize: 12, lineHeight: 18, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
