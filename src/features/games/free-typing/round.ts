import { findConcept, getEntry, type ContentBundle } from '@/content';
import {
  acceptedAnswers,
  checkAnswerWithTwins,
  knownForms,
  twinAnswers,
  type Verdict,
} from '@/features/answer-check';
import { planConcepts } from '@/features/games/multiple-choice/round';
import { findCourse, getLanguage, type CourseId, type LanguageCode } from '@/features/languages';
import { shuffle, type Rng } from '@/features/quiz/rng';
import { gradeFromVerdict, type Deck, type Grade } from '@/features/srs';

/** Typing takes longest; a short round keeps a session around five minutes. */
export const TYPING_ROUND_LENGTH = 8;

export type TypingItem = {
  conceptId: string;
  /** Shown in the native language. */
  prompt: string;
  promptLang: LanguageCode;
  answerLang: LanguageCode;
  /** Main answer first, then alternatives. */
  accepted: string[];
  /** Answers of other concepts with the same prompt: right idea, not the word asked. */
  otherAnswers: string[];
  isSentence: boolean;
};

export type TypingResult = {
  verdict: Verdict;
  /** The accepted answer to show (the closest one, or the main one). */
  expected: string;
  /** What the learner typed; empty for "I don't know". */
  typed: string;
};

export type TypingRound = {
  items: TypingItem[];
  results: TypingResult[];
};

/** A native-language prompt to translate into the target language, or null. */
export function buildTypingItem(
  bundle: ContentBundle,
  courseId: CourseId,
  conceptId: string,
): TypingItem | null {
  const course = findCourse(courseId);
  const concept = findConcept(bundle, conceptId);
  if (!course || !concept) return null;
  const prompt = getEntry(bundle, course.nativeLang, conceptId);
  const accepted = acceptedAnswers(bundle, course.targetLang, conceptId);
  if (!prompt || accepted.length === 0) return null;
  return {
    conceptId,
    prompt: prompt.text,
    promptLang: course.nativeLang,
    answerLang: course.targetLang,
    accepted,
    otherAnswers: twinAnswers(bundle, course.nativeLang, course.targetLang, conceptId),
    isSentence: concept.kind === 'sentence',
  };
}

type StartInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  deck: Deck;
  today: number;
  levelConcepts: readonly string[];
  rng: Rng;
};

/** Due reviews and new concepts first, like the other games; words and sentences mixed. */
export function startTypingRound({
  bundle,
  courseId,
  deck,
  today,
  levelConcepts,
  rng,
}: StartInput): TypingRound {
  const items: TypingItem[] = [];
  for (const id of planConcepts(deck, today, levelConcepts)) {
    if (items.length >= TYPING_ROUND_LENGTH) break;
    const item = buildTypingItem(bundle, courseId, id);
    if (item) items.push(item);
  }
  return { items: shuffle(items, rng), results: [] };
}

export function currentItem(round: TypingRound): TypingItem | null {
  return round.items[round.results.length] ?? null;
}

/** Answered so far but not yet moved on from: the last result, if its item is current. */
export function isTypingFinished(round: TypingRound): boolean {
  return round.results.length >= round.items.length;
}

const formsCache = new WeakMap<ContentBundle, Map<LanguageCode, Set<string>>>();

/** Canonical forms of every text in a language, computed once per bundle. */
export function cachedKnownForms(bundle: ContentBundle, lang: LanguageCode): Set<string> {
  let byLang = formsCache.get(bundle);
  if (!byLang) {
    byLang = new Map();
    formsCache.set(bundle, byLang);
  }
  let forms = byLang.get(lang);
  if (!forms) {
    forms = knownForms(bundle, lang);
    byLang.set(lang, forms);
  }
  return forms;
}

/** Checks what was typed for an item ("" = I don't know). */
export function checkTyping(bundle: ContentBundle, item: TypingItem, typed: string): TypingResult {
  if (!typed.trim()) return { verdict: 'wrong', expected: item.accepted[0], typed: '' };
  return {
    ...checkAnswerWithTwins(
      getLanguage(item.answerLang),
      typed,
      item.accepted,
      item.otherAnswers,
      cachedKnownForms(bundle, item.answerLang),
    ),
    typed,
  };
}

/** Checks what was typed for the current item ("" = I don't know). */
export function answerTyping(
  bundle: ContentBundle,
  round: TypingRound,
  typed: string,
): TypingRound {
  const item = currentItem(round);
  if (!item) return round;
  const result = checkTyping(bundle, item, typed);
  return { ...round, results: [...round.results, result] };
}

/** One grade per answered item: correct → good, near miss or typo → hard, wrong → again. */
export function typingGrades(round: TypingRound): Grade[] {
  return round.results.map((r) => gradeFromVerdict(r.verdict));
}
