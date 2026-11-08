import type { LanguageDef } from './types';

// Punctuation and apostrophes are ignored when comparing answers:
// "Don't!" and "dont" count as the same answer.
const PUNCTUATION = /[\p{P}\p{S}]/gu;

/** Canonical form of an answer in a given language. */
export function normalizeAnswer(lang: LanguageDef, input: string): string {
  return lang.toLower(input.normalize('NFC')).replace(PUNCTUATION, '').replace(/\s+/g, ' ').trim();
}

/** Normalized form with special letters folded (ş → s), for near-miss checks. */
export function foldAnswer(lang: LanguageDef, input: string): string {
  return [...normalizeAnswer(lang, input)].map((ch) => lang.foldMap[ch] ?? ch).join('');
}

/**
 * True when two answers differ only by special letters, e.g. "kisi" vs "kişi".
 * Exact matches are not near misses.
 */
export function isNearMiss(lang: LanguageDef, given: string, expected: string): boolean {
  if (normalizeAnswer(lang, given) === normalizeAnswer(lang, expected)) return false;
  return foldAnswer(lang, given) === foldAnswer(lang, expected);
}
