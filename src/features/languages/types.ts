/**
 * Supported language codes. Adding a language = adding a code here,
 * a LanguageDef in registry.ts, content under src/content/languages/<code>/
 * and UI strings in src/i18n/<code>.json. See docs/languages.md.
 */
export const LANGUAGE_CODES = ['tr', 'en'] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export type LanguageDef = {
  code: LanguageCode;
  /** Name of the language in itself, e.g. "Türkçe". */
  nativeName: string;
  /** BCP 47 locale used for sorting, number formatting and TTS. */
  locale: string;
  /** Voice language passed to expo-speech. */
  ttsVoice: string;
  direction: 'ltr' | 'rtl';
  /** Special letters every font we ship must contain. */
  charset: string;
  /** Language-correct case mapping; never rely on the device locale. */
  toLower: (s: string) => string;
  toUpper: (s: string) => string;
  /** Maps letters a learner may type without the keyboard's special keys (ş → s). */
  foldMap: Readonly<Record<string, string>>;
  /** Leading articles that may be added or left out in answers ("an apple" = "apple"). */
  articles: readonly string[];
};
