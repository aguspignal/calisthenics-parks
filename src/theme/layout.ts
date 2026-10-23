/** Spacing scale from the design system (space_xxs ... space_x3l). */
export const spacing = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
  x3l: 64,
} as const;

/** Corner radii from the design system (radius_s ... radius_pill). */
export const radius = {
  s: 4,
  m: 8,
  l: 12,
  pill: 99,
} as const;

/** Shadows from the design system. `base` is shadow_0. */
export const shadows = {
  base: '1px 2px 2px #0101014d',
} as const;

/** Minimum touch target and the size of round floating controls. */
export const controlSize = {
  s: 36,
  m: 48,
} as const;
