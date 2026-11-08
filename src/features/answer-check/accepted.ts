import { getEntry, type ContentBundle } from '@/content';
import { LANGUAGES, type LanguageCode } from '@/features/languages';

import { canonical } from './check';

/** Main text first, then alternatives; empty when the concept has no text in `lang`. */
export function acceptedAnswers(
  bundle: ContentBundle,
  lang: LanguageCode,
  conceptId: string,
): string[] {
  const entry = getEntry(bundle, lang, conceptId);
  return entry ? [entry.text, ...(entry.alt ?? [])] : [];
}

/** Canonical forms of all words and sentences in `lang`, for checkAnswer's knownForms. */
export function knownForms(bundle: ContentBundle, lang: LanguageCode): Set<string> {
  const def = LANGUAGES[lang];
  const { words, sentences } = bundle.languages[lang];
  const forms = new Set<string>();
  for (const entry of [...Object.values(words), ...Object.values(sentences)]) {
    for (const text of [entry.text, ...(entry.alt ?? [])]) forms.add(canonical(def, text));
  }
  return forms;
}
