import type { LanguageCode } from '@/features/languages';

import en from './en.json';
import tr from './tr.json';

/** UI strings per language. Turkish is the reference file for key types. */
export const resources = {
  tr: { translation: tr },
  en: { translation: en },
} as const satisfies Record<LanguageCode, { translation: typeof tr }>;
