import { getEntry, type ContentBundle } from '@/content';
import { LANGUAGES, type LanguageCode } from '@/features/languages';

import { canonical } from './check';
import { withFreeOrders } from './freeOrder';

/** Main text first, then alternatives; empty when the concept has no text in `lang`. */
export function acceptedAnswers(
  bundle: ContentBundle,
  lang: LanguageCode,
  conceptId: string,
): string[] {
  const entry = getEntry(bundle, lang, conceptId);
  return entry ? withFreeOrders([entry.text, ...(entry.alt ?? [])], entry.anyOrder) : [];
}

/**
 * Answers in `answerLang` of the other concepts whose `promptLang` texts
 * include this concept's prompt: "hiç" is time_links.ever, but time.never also
 * accepts "hiç", so "never" is a right idea for that prompt. Kinds stay apart
 * (a word prompt never matches a sentence).
 */
export function twinAnswers(
  bundle: ContentBundle,
  promptLang: LanguageCode,
  answerLang: LanguageCode,
  conceptId: string,
): string[] {
  const promptDef = LANGUAGES[promptLang];
  const prompt = getEntry(bundle, promptLang, conceptId);
  if (!prompt) return [];
  const form = canonical(promptDef, prompt.text);
  const own = new Set(acceptedAnswers(bundle, answerLang, conceptId));
  const { words, sentences } = bundle.languages[promptLang];
  const file = conceptId in words ? words : sentences;
  const twins: string[] = [];
  for (const [id, entry] of Object.entries(file)) {
    if (id === conceptId) continue;
    if (![entry.text, ...(entry.alt ?? [])].some((t) => canonical(promptDef, t) === form)) continue;
    for (const answer of acceptedAnswers(bundle, answerLang, id)) {
      if (!own.has(answer)) twins.push(answer);
    }
  }
  return twins;
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
