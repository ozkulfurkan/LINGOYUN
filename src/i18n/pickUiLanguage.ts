import { isLanguageCode, type LanguageCode } from '@/features/languages';

/** UI language used when the phone's language is not supported. */
export const FALLBACK_UI_LANGUAGE: LanguageCode = 'en';

/**
 * Picks the UI language from the phone's primary language only (the first
 * entry of the device's preferred languages): if that language is supported
 * the app opens in it, otherwise in English. Secondary device languages are
 * ignored on purpose. Supporting a new language (registry + i18n file) makes
 * it selectable here automatically.
 * Accepts BCP 47 tags ("tr-TR", "en-GB") or bare codes ("tr").
 */
export function pickUiLanguage(preferred: readonly (string | null | undefined)[]): LanguageCode {
  const code = preferred[0]?.split(/[-_]/)[0]?.toLowerCase();
  return code && isLanguageCode(code) ? code : FALLBACK_UI_LANGUAGE;
}
