/** Lives per step. The step stops at the mistake that takes the last one. */
export const HEARTS = 3;

export type StepSession = {
  /** Number of questions in the step. */
  total: number;
  index: number;
  hearts: number;
  /** Concepts answered wrong (once each), in order. */
  mistakes: string[];
  /** Indexes of questions that already cost a heart. */
  missedAt: number[];
};

export function startStepSession(total: number): StepSession {
  return { total, index: 0, hearts: HEARTS, mistakes: [], missedAt: [] };
}

export function isOutOfHearts(s: StepSession): boolean {
  return s.hearts <= 0;
}

/** Every question answered with a heart left. */
export function isStepPassed(s: StepSession): boolean {
  return !isOutOfHearts(s) && s.index >= s.total;
}

/**
 * A wrong answer on the current question. Costs one heart the first time; a
 * second wrong try at the same question (letter tiles, sentence blocks) is free.
 */
export function missCurrent(s: StepSession, conceptId: string): StepSession {
  if (isOutOfHearts(s) || s.missedAt.includes(s.index)) return s;
  return {
    ...s,
    hearts: s.hearts - 1,
    mistakes: s.mistakes.includes(conceptId) ? s.mistakes : [...s.mistakes, conceptId],
    missedAt: [...s.missedAt, s.index],
  };
}

export function nextQuestion(s: StepSession): StepSession {
  if (isOutOfHearts(s) || s.index >= s.total) return s;
  return { ...s, index: s.index + 1 };
}

/** No heart lost in the whole step. */
export function isPerfect(s: StepSession): boolean {
  return isStepPassed(s) && s.missedAt.length === 0;
}

/**
 * "Earn them back": after losing every heart, the learner answers the missed
 * words again. Each right answer gives one heart; with all hearts back the
 * step starts over.
 */
export type RefillSession = { queue: string[]; hearts: number };

export function startRefill(mistakes: readonly string[]): RefillSession {
  return { queue: [...mistakes], hearts: 0 };
}

export function refillAnswer(r: RefillSession, correct: boolean): RefillSession {
  const [current, ...rest] = r.queue;
  if (current === undefined) return r;
  // A missed word goes to the back and comes again.
  return correct
    ? { queue: [...rest, current], hearts: Math.min(HEARTS, r.hearts + 1) }
    : { queue: [...rest, current], hearts: r.hearts };
}

export function isRefilled(r: RefillSession): boolean {
  return r.hearts >= HEARTS || r.queue.length === 0;
}
