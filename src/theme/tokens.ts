/** Spacing scale shared by every theme (in dp). */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Border widths shared by every theme (in dp). */
export const stroke = {
  thin: 1,
  thick: 3,
} as const;

/** Scale of a pressed control (game-feel skill). */
export const pressedScale = 0.94;

/** Opacity of answers that no longer matter once a question is decided. */
export const dimmedOpacity = 0.55;

/** Minimum touch target per profile type (kids-ux skill). */
export const touchTarget = {
  mini: 64,
  kid: 48,
  adult: 44,
} as const;
