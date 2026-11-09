import { findConcept, getEntry, type Concept, type ContentBundle } from '@/content';
import { findCourse, getLanguage, normalizeAnswer, type CourseId } from '@/features/languages';

import { shuffle, type Rng } from './rng';
import type { Direction, Question, QuizOption } from './types';

export const DEFAULT_OPTION_COUNT = 4;

type BuildQuestionInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  conceptId: string;
  direction: Direction;
  /** Concepts wrong options may come from (typically the unit or level). */
  distractorIds: readonly string[];
  optionCount?: number;
  rng: Rng;
};

/**
 * Builds one multiple-choice question, or null when the concept lacks text or
 * there is not a single usable wrong option.
 *
 * Wrong options: same kind (word with words, sentence with sentences), never a
 * text that would also be correct (the answer or its alternatives), preferring
 * the same topic and a similar length so the right answer does not stand out.
 */
export function buildQuestion({
  bundle,
  courseId,
  conceptId,
  direction,
  distractorIds,
  optionCount = DEFAULT_OPTION_COUNT,
  rng,
}: BuildQuestionInput): Question | null {
  const course = findCourse(courseId);
  const concept = findConcept(bundle, conceptId);
  if (!course || !concept) return null;

  const promptLang = direction === 'targetToNative' ? course.targetLang : course.nativeLang;
  const answerLang = direction === 'targetToNative' ? course.nativeLang : course.targetLang;
  const promptEntry = getEntry(bundle, promptLang, conceptId);
  const answerEntry = getEntry(bundle, answerLang, conceptId);
  if (!promptEntry || !answerEntry) return null;

  const lang = getLanguage(answerLang);
  const norm = (s: string) => normalizeAnswer(lang, s);
  const correctTexts = new Set([answerEntry.text, ...(answerEntry.alt ?? [])].map(norm));
  const promptNorm = (s: string) => normalizeAnswer(getLanguage(promptLang), s);
  const promptTexts = new Set([promptEntry.text, ...(promptEntry.alt ?? [])].map(promptNorm));

  type Candidate = { concept: Concept; text: string; score: number };
  const candidates: Candidate[] = [];
  const usedTexts = new Set(correctTexts);
  for (const id of new Set(distractorIds)) {
    if (id === conceptId) continue;
    const other = findConcept(bundle, id);
    if (!other || other.kind !== concept.kind) continue;
    const entry = getEntry(bundle, answerLang, id);
    if (!entry) continue;
    // Skip any option whose text (or one of its alternatives) is also a correct answer.
    const otherTexts = [entry.text, ...(entry.alt ?? [])].map(norm);
    if (otherTexts.some((t) => correctTexts.has(t))) continue;
    // Homonyms: "orange" (fruit) asked → "turuncu" (colour, also "orange") would be correct too.
    const otherPrompt = getEntry(bundle, promptLang, id);
    const otherPromptTexts = otherPrompt ? [otherPrompt.text, ...(otherPrompt.alt ?? [])] : [];
    if (otherPromptTexts.map(promptNorm).some((t) => promptTexts.has(t))) continue;
    candidates.push({
      concept: other,
      text: entry.text,
      score:
        (other.topic === concept.topic ? 0 : 100) +
        Math.abs(entry.text.length - answerEntry.text.length) +
        rng() * 3,
    });
  }

  const distractors: Candidate[] = [];
  // A false friend's look-alike is always one of the wrong options.
  const trap = answerEntry.trap;
  if (trap && !usedTexts.has(norm(trap)) && optionCount > 1) {
    usedTexts.add(norm(trap));
    distractors.push({
      concept: { ...concept, id: `${conceptId}#trap`, image: undefined },
      text: trap,
      score: -1,
    });
  }
  for (const c of candidates.sort((a, b) => a.score - b.score)) {
    if (distractors.length >= optionCount - 1) break;
    const key = norm(c.text);
    if (usedTexts.has(key)) continue; // two concepts with the same text
    usedTexts.add(key);
    distractors.push(c);
  }
  if (distractors.length === 0) return null;
  const note = answerEntry.note ?? promptEntry.note;

  const correct: QuizOption = { conceptId, text: answerEntry.text, image: concept.image };
  const options = shuffle(
    [
      correct,
      ...distractors.map((d) => ({
        conceptId: d.concept.id,
        text: d.text,
        image: d.concept.image,
      })),
    ],
    rng,
  );

  return {
    conceptId,
    direction,
    promptLang,
    answerLang,
    prompt: promptEntry.text,
    image: concept.image,
    options,
    correctIndex: options.findIndex((o) => o.conceptId === conceptId),
    ...(note ? { note } : {}),
  };
}

export type DirectionMode = Direction | 'mixed';

type GenerateQuizInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  /** Concepts to ask about. */
  conceptIds: readonly string[];
  /** Defaults to conceptIds. */
  distractorIds?: readonly string[];
  count: number;
  directions: DirectionMode;
  optionCount?: number;
  rng: Rng;
};

/**
 * A round of questions in random order. Concepts repeat only when `count`
 * exceeds the pool, and never twice in a row. Concepts that cannot form a
 * question are skipped.
 */
export function generateQuiz(input: GenerateQuizInput): Question[] {
  const { conceptIds, count, directions, rng } = input;
  const pool = [...new Set(conceptIds)];
  const distractorIds = input.distractorIds ?? pool;
  const questions: Question[] = [];
  let order: string[] = [];
  let attemptsLeft = count * 3 + pool.length;

  while (questions.length < count && pool.length > 0 && attemptsLeft-- > 0) {
    if (order.length === 0) {
      order = shuffle(pool, rng);
      // Avoid the same concept at the end of one pass and the start of the next.
      const last = questions.at(-1)?.conceptId;
      if (order.length > 1 && order[0] === last) [order[0], order[1]] = [order[1], order[0]];
    }
    const conceptId = order.shift()!;
    const direction: Direction =
      directions === 'mixed' ? (rng() < 0.5 ? 'targetToNative' : 'nativeToTarget') : directions;
    const question = buildQuestion({ ...input, conceptId, direction, distractorIds, rng });
    if (question) questions.push(question);
  }
  return questions;
}
