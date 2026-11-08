import type { ContentBundle } from '@/content';
import { planConcepts } from '@/features/games/multiple-choice/round';
import type { CourseId } from '@/features/languages';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Deck, Grade } from '@/features/srs';

import { buildPuzzle, isDone, puzzleGrade, type Puzzle } from './puzzle';

/** Spelling takes longer than choosing, so a round has fewer words. */
export const LETTER_ROUND_LENGTH = 8;

export type LetterRound = {
  puzzles: Puzzle[];
  /** Current puzzle; equal to puzzles.length when finished. */
  index: number;
};

type StartInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  deck: Deck;
  today: number;
  levelConcepts: readonly string[];
  rng: Rng;
};

/** Same order of priority as multiple choice: due reviews, new words, weakest words. */
export function startLetterRound({
  bundle,
  courseId,
  deck,
  today,
  levelConcepts,
  rng,
}: StartInput): LetterRound {
  const puzzles: Puzzle[] = [];
  for (const conceptId of planConcepts(deck, today, levelConcepts)) {
    if (puzzles.length >= LETTER_ROUND_LENGTH) break;
    const puzzle = buildPuzzle({ bundle, courseId, conceptId, rng });
    if (puzzle) puzzles.push(puzzle);
  }
  return { puzzles: shuffle(puzzles, rng), index: 0 };
}

export function currentPuzzle(round: LetterRound): Puzzle | null {
  return round.puzzles[round.index] ?? null;
}

export function isRoundFinished(round: LetterRound): boolean {
  return round.index >= round.puzzles.length;
}

/** Replaces the current puzzle after a move. */
export function updateCurrent(round: LetterRound, puzzle: Puzzle): LetterRound {
  if (isRoundFinished(round)) return round;
  return { ...round, puzzles: round.puzzles.map((p, i) => (i === round.index ? puzzle : p)) };
}

/** Moves on once the current puzzle is solved or revealed. */
export function nextPuzzle(round: LetterRound): LetterRound {
  const current = currentPuzzle(round);
  if (!current || !isDone(current)) return round;
  return { ...round, index: round.index + 1 };
}

/** Grades of the finished puzzles, in order. */
export function letterRoundGrades(round: LetterRound): Grade[] {
  return round.puzzles.slice(0, round.index).map(puzzleGrade);
}
