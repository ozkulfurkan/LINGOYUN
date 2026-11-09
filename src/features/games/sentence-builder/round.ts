import type { ContentBundle } from '@/content';
import { planConcepts } from '@/features/games/multiple-choice/round';
import type { CourseId } from '@/features/languages';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Deck, Grade } from '@/features/srs';

import { buildSentencePuzzle, isSentenceDone, sentenceGrade, type SentencePuzzle } from './puzzle';

/** Sentences take longest; a short round keeps the session around 5 minutes. */
export const SENTENCE_ROUND_LENGTH = 6;

/** Adults get decoy words; kids build from exactly the right words (kids-ux). */
export const DECOYS = { kid: 0, adult: 2 } as const;

export type SentenceRound = { puzzles: SentencePuzzle[]; index: number };

type StartInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  deck: Deck;
  today: number;
  /** Sentence concepts of the learner's level, in course order. */
  sentences: readonly string[];
  profileType: keyof typeof DECOYS;
  rng: Rng;
};

export function startSentenceRound({
  bundle,
  courseId,
  deck,
  today,
  sentences,
  profileType,
  rng,
}: StartInput): SentenceRound {
  const puzzles: SentencePuzzle[] = [];
  for (const conceptId of planConcepts(deck, today, sentences)) {
    if (puzzles.length >= SENTENCE_ROUND_LENGTH) break;
    const puzzle = buildSentencePuzzle({
      bundle,
      courseId,
      conceptId,
      decoys: DECOYS[profileType],
      decoyPool: sentences,
      rng,
    });
    if (puzzle) puzzles.push(puzzle);
  }
  return { puzzles: shuffle(puzzles, rng), index: 0 };
}

export function currentSentence(round: SentenceRound): SentencePuzzle | null {
  return round.puzzles[round.index] ?? null;
}

export function isSentenceRoundFinished(round: SentenceRound): boolean {
  return round.index >= round.puzzles.length;
}

export function updateSentence(round: SentenceRound, puzzle: SentencePuzzle): SentenceRound {
  if (isSentenceRoundFinished(round)) return round;
  return { ...round, puzzles: round.puzzles.map((p, i) => (i === round.index ? puzzle : p)) };
}

export function nextSentence(round: SentenceRound): SentenceRound {
  const current = currentSentence(round);
  if (!current || !isSentenceDone(current)) return round;
  return { ...round, index: round.index + 1 };
}

export function sentenceRoundGrades(round: SentenceRound): Grade[] {
  return round.puzzles.slice(0, round.index).map(sentenceGrade);
}
