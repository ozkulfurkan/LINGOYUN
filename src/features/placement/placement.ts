/** Self-assessment answered before the test. */
export const SELF_ASSESSMENTS = ['none', 'some', 'mid', 'good'] as const;
export type SelfAssessment = (typeof SELF_ASSESSMENTS)[number];

export const BLOCK_COUNT = 5;
export const QUESTIONS_PER_BLOCK = 4;
export const TOTAL_QUESTIONS = BLOCK_COUNT * QUESTIONS_PER_BLOCK;
/** Correct answers in a block to pass it (and move up). */
export const PASS_SCORE = 3;
/** Correct answers in a block at or below which the test moves down. */
export const FAIL_SCORE = 1;

// Where each self-assessment starts, as a share of the course's level scale.
const START_SHARE: Record<SelfAssessment, number> = { none: 0, some: 0.25, mid: 0.5, good: 0.75 };

export type Block = { levelIndex: number; correct: number };

export type PlacementState = {
  /** The course's levels for this profile type, lowest first. */
  scale: readonly string[];
  /** Level the current block is asked at. */
  levelIndex: number;
  finished: Block[];
  /** Answers given in the current block (true = correct). */
  current: boolean[];
};

export function startingLevelIndex(scale: readonly string[], self: SelfAssessment): number {
  return Math.round(START_SHARE[self] * (scale.length - 1));
}

export function startPlacement(scale: readonly string[], self: SelfAssessment): PlacementState {
  if (scale.length === 0) throw new Error('empty level scale');
  return { scale, levelIndex: startingLevelIndex(scale, self), finished: [], current: [] };
}

export function isFinished(state: PlacementState): boolean {
  return state.finished.length >= BLOCK_COUNT;
}

/** Level the next question should come from. */
export function currentLevel(state: PlacementState): string {
  return state.scale[state.levelIndex];
}

/** 0-based number of the next question, for a progress bar (0 … TOTAL_QUESTIONS). */
export function answeredCount(state: PlacementState): number {
  return state.finished.length * QUESTIONS_PER_BLOCK + state.current.length;
}

/**
 * Records one answer. "I don't know" is passed as `false`. After the fourth
 * answer of a block the next level is chosen: up on 3–4, same on 2, down on 0–1.
 */
export function answerPlacement(state: PlacementState, correct: boolean): PlacementState {
  if (isFinished(state)) return state;
  const current = [...state.current, correct];
  if (current.length < QUESTIONS_PER_BLOCK) return { ...state, current };

  const score = current.filter(Boolean).length;
  const finished = [...state.finished, { levelIndex: state.levelIndex, correct: score }];
  const step = score >= PASS_SCORE ? 1 : score <= FAIL_SCORE ? -1 : 0;
  const levelIndex = Math.min(Math.max(state.levelIndex + step, 0), state.scale.length - 1);
  return { ...state, levelIndex, finished, current: [] };
}

/** Highest level passed with 3/4 or better; the lowest level if none was passed. */
export function placementResult(state: PlacementState): string {
  const passed = state.finished.filter((b) => b.correct >= PASS_SCORE).map((b) => b.levelIndex);
  return state.scale[passed.length > 0 ? Math.max(...passed) : 0];
}
