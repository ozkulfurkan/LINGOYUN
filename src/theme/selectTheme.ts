import type { ProfileType } from '@/features/profiles/types';

import { adultDarkTheme, adultLightTheme, kidsTheme } from './themes';
import type { Theme } from './types';

/** User preference for the adult theme mode (kids are always light). */
export type AppearancePreference = 'system' | 'light' | 'dark';

/**
 * Picks the theme for the active profile.
 * - mini / kid → kids theme ("Oyun Hamuru"), always light.
 * - adult → Sözlük light or Gece Nehri dark, following the preference or,
 *   for "system", the device colour scheme (light when unknown).
 * - no profile yet (first launch) → kids theme.
 */
export function selectTheme(
  profileType: ProfileType | null,
  systemScheme: 'light' | 'dark' | null | undefined,
  preference: AppearancePreference = 'system',
): Theme {
  if (profileType !== 'adult') return kidsTheme;
  const mode = preference === 'system' ? (systemScheme ?? 'light') : preference;
  return mode === 'dark' ? adultDarkTheme : adultLightTheme;
}
