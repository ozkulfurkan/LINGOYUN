import type { Grade } from '@/features/srs';

/**
 * Reward economy — every number in one place. Documented in
 * docs/game-design.md; change both together.
 */
export const XP_PER_GRADE: Record<Grade, number> = {
  good: 10,
  hard: 5,
  // No punishment: trying still earns a little.
  again: 1,
};

/** Bonus XP when a run of correct answers reaches these lengths. */
export const COMBO_BONUS_XP: Readonly<Record<number, number>> = { 3: 5, 5: 10, 10: 20 };

export const SESSION_COMPLETE_XP = 20;
export const PERFECT_SESSION_XP = 10;

export const GEMS_PER_GOOD_ANSWER = 1;
export const SESSION_COMPLETE_GEMS = 5;
export const LEVEL_UP_GEMS = 10;

/** A streak freeze is earned every this many streak days… */
export const FREEZE_EVERY_DAYS = 7;
/** …and at most this many can be stored. */
export const MAX_FREEZES = 2;
