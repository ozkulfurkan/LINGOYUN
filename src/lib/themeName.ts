import type { useTranslation } from 'react-i18next';

import type { Theme } from '@/content';

type T = ReturnType<typeof useTranslation>['t'];

/** A theme's own name, e.g. "Restoranda". */
export function themeLabel(t: T, theme: Theme): string {
  // Titles come from content; src/i18n/themeNames.test.ts checks each has a name.
  return t(`themes.names.${theme.title}` as 'themes.names.greetings');
}

/** A theme as learners see it: "9. Restoranda". */
export function themeName(t: T, theme: Theme, number: number): string {
  return t('path.themeName', { number, name: themeLabel(t, theme) });
}
