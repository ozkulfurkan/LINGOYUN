import type { Grade } from '@/features/srs';

/** Moments that get sound and haptics (game-feel skill table). */
export const FEEDBACK_EVENTS = [
  'tap',
  'correct',
  'wrong',
  'combo3',
  'combo5',
  'combo10',
  'complete',
  'levelUp',
] as const;
export type FeedbackEvent = (typeof FEEDBACK_EVENTS)[number];

export type HapticKind = 'selection' | 'success' | 'light' | 'medium' | 'none';

/** Haptic per moment. Tap haptics come from PressScale itself. */
export const HAPTIC_FOR: Record<FeedbackEvent, HapticKind> = {
  tap: 'none',
  correct: 'success',
  wrong: 'light',
  combo3: 'medium',
  combo5: 'medium',
  combo10: 'medium',
  complete: 'success',
  levelUp: 'success',
};

/** Correct answers in a row at the end of the list of grades. */
export function trailingRun(grades: readonly Grade[]): number {
  let run = 0;
  for (let i = grades.length - 1; i >= 0 && grades[i] === 'good'; i--) run += 1;
  return run;
}

/** Combo moment reached exactly at this run length, if any (3, 5, 10). */
export function comboEvent(run: number): FeedbackEvent | null {
  if (run === 10) return 'combo10';
  if (run === 5) return 'combo5';
  if (run === 3) return 'combo3';
  return null;
}
