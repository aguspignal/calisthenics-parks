/**
 * Palette from the Parks design system (claude.ai artifact "Design System", tokens.json).
 * Keep these hex values in sync with the design system; never add colors outside it.
 */
export const palette = {
  white_0: '#fafafa',
  white_1: '#fefefe',
  black_0: '#121212',
  black_1: '#232323',
  black_2: '#343434',
  black_3: '#454545',
  gray_0: '#b0b0b0',
  gray_1: '#dadada',
  gray_2: '#eaeaea',
  red: '#e53944',
  orange: '#ff8f1f',
} as const;

/**
 * Semantic roles. The app is dark-only, so each role maps to one palette value.
 * Contrast ratios are against `background` unless noted.
 */
export const colors = {
  /** Screen background. */
  background: palette.black_1,
  /** Cards, sheets and floating controls on top of the background or the map. */
  surface: palette.black_2,
  /** Inputs and pressed states on top of `surface`. */
  surfaceRaised: palette.black_3,
  /** Hairlines and control outlines. */
  border: palette.black_3,
  /** Primary text (15.6:1). */
  text: palette.white_1,
  /** Secondary text (11.2:1). */
  textSecondary: palette.gray_1,
  /** Captions and placeholders (7.3:1; 4.4:1 on `surfaceRaised`, so no small muted text there). */
  textMuted: palette.gray_0,
  /** Brand accent: primary actions, verified park markers (6.9:1). */
  accent: palette.orange,
  /** Text and icons on `accent` (8.2:1). White on orange fails contrast. */
  onAccent: palette.black_0,
  /** Selected controls, such as an active filter chip. */
  inverse: palette.white_0,
  onInverse: palette.black_0,
  /** Destructive actions and errors (3.7:1): icons and large text (24px, or 19px bold) only. */
  danger: palette.red,
  /** Unverified (pending) park markers. */
  pending: palette.gray_0,
} as const;
