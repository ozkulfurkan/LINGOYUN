import { LANGUAGE_CODES, type LanguageCode, type LanguageDef } from './types';

// Turkish has a dotted and a dotless i: I ↔ ı and İ ↔ i. The default JS case
// mapping gets this wrong (I → i), and locale-aware variants depend on the
// device's ICU data, so the mapping is spelled out here.
const turkishLower = (s: string) => s.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
const turkishUpper = (s: string) => s.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();

const TURKISH: LanguageDef = {
  code: 'tr',
  nativeName: 'Türkçe',
  locale: 'tr-TR',
  ttsVoice: 'tr-TR',
  direction: 'ltr',
  charset: 'çğıİöşüÇĞÖŞÜ',
  toLower: turkishLower,
  toUpper: turkishUpper,
  foldMap: { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' },
  articles: [],
};

const ENGLISH: LanguageDef = {
  code: 'en',
  nativeName: 'English',
  locale: 'en-US',
  ttsVoice: 'en-US',
  direction: 'ltr',
  charset: '',
  toLower: (s) => s.toLowerCase(),
  toUpper: (s) => s.toUpperCase(),
  foldMap: {},
  articles: ['a', 'an', 'the', 'to'],
};

export const LANGUAGES: Readonly<Record<LanguageCode, LanguageDef>> = {
  tr: TURKISH,
  en: ENGLISH,
};

export function isLanguageCode(value: string): value is LanguageCode {
  return (LANGUAGE_CODES as readonly string[]).includes(value);
}

export function getLanguage(code: LanguageCode): LanguageDef {
  return LANGUAGES[code];
}

/** Every special letter across all supported languages (for font checks). */
export function allCharsets(): string {
  return [...new Set(LANGUAGE_CODES.flatMap((c) => [...LANGUAGES[c].charset]))].join('');
}
