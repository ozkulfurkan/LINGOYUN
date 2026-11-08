import type { ContentBundle } from '@/content';
import type { CourseId } from '@/features/languages';
import { dueCards, type Deck, type Grade } from '@/features/srs';
import { buildQuestion } from '@/features/quiz/generate';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Question } from '@/features/quiz/types';

/** Questions in one round (the "typical session" in docs/game-design.md). */
export const ROUND_LENGTH = 10;
/** Reviews come first but leave room for new words. */
const MAX_REVIEWS_FIRST = 5;

/**
 * Which concepts to ask, best first: due reviews (up to a limit), then new
 * concepts in course order, then any further due reviews. A learner who has seen
 * the whole level keeps practising its weakest concepts.
 */
export function planConcepts(
  deck: Deck,
  today: number,
  levelConcepts: readonly string[],
): string[] {
  const due = dueCards(deck, today).map((c) => c.conceptId);
  const fresh = levelConcepts.filter((id) => !(id in deck));
  const seen = levelConcepts
    .filter((id) => id in deck)
    .sort((a, b) => deck[a].box - deck[b].box || deck[a].dueDay - deck[b].dueDay);
  return [
    ...new Set([
      ...due.slice(0, MAX_REVIEWS_FIRST),
      ...fresh,
      ...due.slice(MAX_REVIEWS_FIRST),
      ...seen,
    ]),
  ];
}

type StartInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  deck: Deck;
  today: number;
  /** Concepts of the learner's level, in course order; also the wrong options. */
  levelConcepts: readonly string[];
  rng: Rng;
};

export type Round = {
  questions: readonly Question[];
  /** Number of the current question; equal to questions.length when finished. */
  index: number;
  /** Option picked for each question answered so far. */
  picks: readonly number[];
};

/** Builds a round. It has no questions when the level has no usable content. */
export function startRound({
  bundle,
  courseId,
  deck,
  today,
  levelConcepts,
  rng,
}: StartInput): Round {
  const questions: Question[] = [];
  for (const conceptId of planConcepts(deck, today, levelConcepts)) {
    if (questions.length >= ROUND_LENGTH) break;
    const question = buildQuestion({
      bundle,
      courseId,
      conceptId,
      direction: rng() < 0.5 ? 'targetToNative' : 'nativeToTarget',
      distractorIds: levelConcepts,
      rng,
    });
    if (question) questions.push(question);
  }
  return { questions: shuffle(questions, rng), index: 0, picks: [] };
}

export function currentQuestion(round: Round): Question | null {
  return round.questions[round.index] ?? null;
}

export function isFinished(round: Round): boolean {
  return round.index >= round.questions.length;
}

/** The option picked for the current question, or null while it is unanswered. */
export function currentPick(round: Round): number | null {
  return round.picks[round.index] ?? null;
}

/** Answers the current question. A question can only be answered once. */
export function pickOption(round: Round, optionIndex: number): Round {
  if (isFinished(round) || currentPick(round) !== null) return round;
  return { ...round, picks: [...round.picks, optionIndex] };
}

/** Moves on, only after the current question has been answered. */
export function advance(round: Round): Round {
  if (isFinished(round) || currentPick(round) === null) return round;
  return { ...round, index: round.index + 1 };
}

/** One grade per answer, in order. Multiple choice has no "almost right". */
export function roundGrades(round: Round): Grade[] {
  return round.picks.map((pick, i) =>
    pick === round.questions[i].correctIndex ? 'good' : 'again',
  );
}
