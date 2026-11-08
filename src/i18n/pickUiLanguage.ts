import { isLanguageCode, type LanguageCode } from '@/features/languages';

/** UI language used when none of the device languages is supported. */
export const FALLBACK_UI_LANGUAGE: LanguageCode = 'en';

/**
 * Picks the UI language from the device's preferred languages, in order.
 * Accepts BCP 47 tags ("tr-TR", "en-GB") or bare codes ("tr").
 */
export function pickUiLanguage(preferred: readonly (string | null | undefined)[]): LanguageCode {
  for (const tag of preferred) {
    const code = tag?.split(/[-_]/)[0]?.toLowerCase();
    if (code && isLanguageCode(code)) return code;
  }
  return FALLBACK_UI_LANGUAGE;
}
