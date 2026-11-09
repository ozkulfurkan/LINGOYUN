import type { ContentBundle, Theme, ThemeTier } from '@/content';
import type { CourseId } from '@/features/languages';
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
export const LISTEN_PER_STEP = 3;
export const SENTENCES_PER_STEP = 2;
/** Word questions of the exam that are spelled with letter tiles. */
export const EXAM_LETTER_QUESTIONS = 3;
/** 10 + 3 + 2. */
export const QUESTIONS_PER_STEP = WORDS_PER_STEP + LISTEN_PER_STEP + SENTENCES_PER_STEP;

export type Difficulty = 1 | 2 | 3;
export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3];

/**
 * choice: multiple choice in either direction. listen: the English word is only
 * heard (text hidden), options in Turkish. letters: spell the word with tiles.
 * sentence: rebuild the English sentence from word blocks.
 */
export type StepItem =
  | { kind: 'choice'; conceptId: string; question: Question }
  | { kind: 'listen'; conceptId: string; question: Question }
  | { kind: 'letters'; conceptId: string; puzzle: Puzzle }
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

/** Sentences for a difficulty: that tier, else the nearest easier one that has any. */
export function themeSentences(theme: Theme, difficulty: Difficulty): string[] {
  for (let tier = difficulty; tier >= 1; tier--) {
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
 * The fifteen questions of a step. Previous mistakes come first and take the
 * place of listening questions, so a step never grows longer. Missing words are
 * filled from earlier steps of the theme.
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
  if (exam) {
    const box = (id: string) => input.deck?.[id]?.box ?? -1;
    words = shuffle(taught, rng)
      .sort((a, b) => box(a) - box(b))
      .slice(0, WORDS_PER_STEP);
  } else {
    words = stepWords(theme, stepIndex);
    const filler = shuffle(
      taught.filter((id) => !words.includes(id)),
      rng,
    );
    words = [...words, ...filler].slice(0, WORDS_PER_STEP);
  }
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

  // 1. Previous mistakes: missed words take listening slots, missed sentences
  // take sentence slots.
  wrongWords.slice(0, LISTEN_PER_STEP).forEach((id) => push(choice(id, 'choice')));
  wrongSentences.slice(0, SENTENCES_PER_STEP).forEach((id) => push(sentence(id)));
  const reviewWords = items.filter((i) => i.kind === 'choice').length;

  // 2. Words: exam spells some of them with letter tiles.
  let letters = exam ? EXAM_LETTER_QUESTIONS : 0;
  for (const id of words) {
    if (letters > 0) {
      const puzzle = buildPuzzle({ bundle, courseId, conceptId: id, rng });
      if (puzzle) {
        letters--;
        items.push({ kind: 'letters', conceptId: id, puzzle });
        continue;
      }
    }
    push(choice(id, 'choice'));
  }

  // 3. Listening: the same words again, heard only.
  const listenCount = LISTEN_PER_STEP - reviewWords;
  for (const id of shuffle(words, rng)) {
    if (items.filter((i) => i.kind === 'listen').length >= listenCount) break;
    push(choice(id, 'listen'));
  }

  // 4. Sentences: the step's own, then any other of the theme's tier, then the band.
  const ownStart = (exam ? Math.floor(rng() * 4) : stepIndex) * SENTENCES_PER_STEP;
  const ordered = [
    ...sentencePool.slice(ownStart),
    ...shuffle(sentencePool.slice(0, ownStart), rng),
  ].filter((id) => !wrongSentences.includes(id));
  for (const id of ordered) {
    if (items.filter((i) => i.kind === 'sentence').length >= SENTENCES_PER_STEP) break;
    push(sentence(id));
  }

  return items.slice(0, QUESTIONS_PER_STEP);
}
