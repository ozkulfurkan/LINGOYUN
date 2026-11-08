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

/** Minimum touch target per profile type (kids-ux skill). */
export const touchTarget = {
  mini: 64,
  kid: 48,
  adult: 44,
} as const;
