import type { ContentBundle, Theme, ThemeTier } from '@/content';
import type { CourseId } from '@/features/languages';
import { buildTypingItem, type TypingItem } from '@/features/games/free-typing/round';
import { buildPuzzle, type Puzzle } from '@/features/games/letter-order/puzzle';
import { DECOYS } from '@/features/games/sentence-builder/round';
import { buildSentencePuzzle, type SentencePuzzle } from '@/features/games/sentence-builder/puzzle';
import { buildQuestion } from '@/features/quiz/generate';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Question } from '@/features/quiz/types';
import type { Deck } from '@/features/srs';

/** Steps per theme: four that teach ten new words each, then the theme exam. */
export const STEP_COUNT = 5;
export const EXAM_STEP = STEP_COUNT - 1;
export const WORDS_PER_STEP = 10;
/** Words of the step typed in English after their multiple choice (letters for kids). */
export const TYPING_PER_STEP = 3;
export const LISTEN_PER_STEP = 3;
export const SENTENCES_PER_STEP = 2;
/** 10 + 3 + 3 + 2. */
export const QUESTIONS_PER_STEP =
  WORDS_PER_STEP + TYPING_PER_STEP + LISTEN_PER_STEP + SENTENCES_PER_STEP;

/** The exam: 7 words (3 with letter tiles) + 5 typed + 3 listening + 3 sentences = 18. */
export const EXAM_WORDS = 7;
export const EXAM_LETTER_QUESTIONS = 3;
export const EXAM_TYPING = 5;
export const EXAM_SENTENCES = 3;

export type Difficulty = 1 | 2 | 3;
export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3];

/**
 * choice: multiple choice in either direction. listen: the English word is only
 * heard (text hidden), options in Turkish. letters: spell the word with tiles.
 * typing: write the English word for the Turkish prompt (adults).
 * sentence: rebuild the English sentence from word blocks.
 */
export type StepItem =
  | { kind: 'choice'; conceptId: string; question: Question }
  | { kind: 'listen'; conceptId: string; question: Question }
  | { kind: 'letters'; conceptId: string; puzzle: Puzzle }
  | { kind: 'typing'; conceptId: string; item: TypingItem }
  | { kind: 'sentence'; conceptId: string; puzzle: SentencePuzzle };

/** The ten new words of a teaching step (fewer when the theme is short). */
export function stepWords(theme: Theme, stepIndex: number): string[] {
  if (stepIndex >= EXAM_STEP) return [];
  return theme.words.slice(stepIndex * WORDS_PER_STEP, (stepIndex + 1) * WORDS_PER_STEP);
}

/** Words taught up to and including a step: everything the exam may ask. */
export function wordsUpTo(theme: Theme, stepIndex: number): string[] {
  return theme.words.slice(0, Math.min(stepIndex + 1, EXAM_STEP) * WORDS_PER_STEP);
}

/**
 * Sentences for a difficulty: that tier, else the nearest easier one, else the
 * nearest harder one, so a theme with any sentences always has some.
 */
export function themeSentences(theme: Theme, difficulty: Difficulty): string[] {
  const order = [
    difficulty,
    ...[3, 2, 1].filter((t) => t < difficulty),
    ...[1, 2, 3].filter((t) => t > difficulty),
  ];
  for (const tier of order) {
    const list = theme.sentences[String(tier) as ThemeTier] ?? [];
    if (list.length > 0) return list;
  }
  return [];
}

type BuildInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  profileType: 'kid' | 'adult';
  theme: Theme;
  stepIndex: number;
  difficulty: Difficulty;
  /** Concepts missed in the previous step: asked first. */
  mistakes: readonly string[];
  /** Sentences of other themes of the same band, used when the theme has too few. */
  extraSentences?: readonly string[];
  /** Spaced-repetition deck; the exam prefers the weakest words. */
  deck?: Deck;
  rng: Rng;
};

/**
 * The eighteen questions of a step. Previous mistakes come first and take the
 * place of listening (words) or sentence slots, so a step never grows longer.
 * Missing words are filled from earlier steps of the theme.
 */
export function buildStep(input: BuildInput): StepItem[] {
  const { bundle, courseId, profileType, theme, stepIndex, difficulty, rng } = input;
  const exam = stepIndex >= EXAM_STEP;
  const known = new Set(bundle.concepts.map((c) => c.id));
  const isSentence = (id: string) => bundle.concepts.find((c) => c.id === id)?.kind === 'sentence';
  const mistakes = [...new Set(input.mistakes)].filter((id) => known.has(id));
  const wrongWords = exam ? [] : mistakes.filter((id) => !isSentence(id));
  const wrongSentences = exam ? [] : mistakes.filter(isSentence);

  const taught = wordsUpTo(theme, stepIndex);
  let words: string[];
  let typed: string[];
  if (exam) {
    // The weakest words first: some are recognized, others typed.
    const box = (id: string) => input.deck?.[id]?.box ?? -1;
    const weakest = shuffle(taught, rng).sort((a, b) => box(a) - box(b));
    words = weakest.slice(0, EXAM_WORDS);
    // A short theme has too few other words: its exam words are typed again.
    typed = [...new Set([...weakest.slice(EXAM_WORDS), ...words])];
  } else {
    words = stepWords(theme, stepIndex);
    const filler = shuffle(
      taught.filter((id) => !words.includes(id)),
      rng,
    );
    words = [...words, ...filler].slice(0, WORDS_PER_STEP);
    // Typed only after their multiple choice in this same step.
    typed = shuffle(words, rng);
  }
  const typingCount = exam ? EXAM_TYPING : TYPING_PER_STEP;
  const sentenceCount = exam ? EXAM_SENTENCES : SENTENCES_PER_STEP;
  // Wrong options come from the theme, so they share its subject.
  const distractors = theme.words;

  const choice = (conceptId: string, kind: 'choice' | 'listen'): StepItem | null => {
    const question = buildQuestion({
      bundle,
      courseId,
      conceptId,
      direction:
        kind === 'listen' ? 'targetToNative' : rng() < 0.5 ? 'targetToNative' : 'nativeToTarget',
      distractorIds: distractors,
      rng,
    });
    if (!question) return null;
    return kind === 'listen'
      ? { kind: 'listen', conceptId, question }
      : { kind: 'choice', conceptId, question };
  };
  const letters = (conceptId: string): StepItem | null => {
    const puzzle = buildPuzzle({ bundle, courseId, conceptId, rng });
    return puzzle ? { kind: 'letters', conceptId, puzzle } : null;
  };
  // Adults type on the keyboard; kids spell with letter tiles instead.
  const typing = (conceptId: string): StepItem | null => {
    if (profileType === 'kid') return letters(conceptId);
    const item = buildTypingItem(bundle, courseId, conceptId);
    return item ? { kind: 'typing', conceptId, item } : null;
  };

  const sentencePool = [
    ...new Set([...themeSentences(theme, difficulty), ...(input.extraSentences ?? [])]),
  ];
  const sentence = (conceptId: string): StepItem | null => {
    const puzzle = buildSentencePuzzle({
      bundle,
      courseId,
      conceptId,
      decoys: DECOYS[profileType],
      decoyPool: sentencePool,
      rng,
    });
    return puzzle ? { kind: 'sentence', conceptId, puzzle } : null;
  };

  const items: StepItem[] = [];
  const push = (item: StepItem | null) => item && items.push(item);
  const count = (...kinds: StepItem['kind'][]) =>
    items.filter((i) => kinds.includes(i.kind)).length;

  // 1. Previous mistakes: missed words take listening slots, missed sentences
  // take sentence slots.
  wrongWords.slice(0, LISTEN_PER_STEP).forEach((id) => push(choice(id, 'choice')));
  wrongSentences.slice(0, sentenceCount).forEach((id) => push(sentence(id)));
  const reviewWords = count('choice');

  // 2. Words: the exam spells some of them with letter tiles.
  let tiles = exam ? EXAM_LETTER_QUESTIONS : 0;
  for (const id of words) {
    const tiled = tiles > 0 ? letters(id) : null;
    if (tiled) {
      tiles--;
      items.push(tiled);
    } else push(choice(id, 'choice'));
  }

  // 3. Typing: words already met, written in English (letter tiles for kids).
  let typedSoFar = 0;
  for (const id of typed) {
    if (typedSoFar >= typingCount) break;
    const item = typing(id) ?? choice(id, 'choice');
    if (item) {
      items.push(item);
      typedSoFar++;
    }
  }

  // 4. Listening: words of the step again, heard only.
  const listenCount = LISTEN_PER_STEP - reviewWords;
  for (const id of shuffle(words, rng)) {
    if (count('listen') >= listenCount) break;
    push(choice(id, 'listen'));
  }

  // 5. Sentences: the step's own, then any other of the theme's tier, then the band.
  const ownStart = (exam ? Math.floor(rng() * 4) : stepIndex) * SENTENCES_PER_STEP;
  const ordered = [
    ...sentencePool.slice(ownStart),
    ...shuffle(sentencePool.slice(0, ownStart), rng),
  ].filter((id) => !wrongSentences.includes(id));
  for (const id of ordered) {
    if (count('sentence') >= sentenceCount) break;
    push(sentence(id));
  }

  return items.slice(0, QUESTIONS_PER_STEP);
}
