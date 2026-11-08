import { FREEZE_EVERY_DAYS, MAX_FREEZES } from './economy';

export type Streak = {
  /** Consecutive active days, including the last active day. */
  count: number;
  best: number;
  /** Local day number of the last active day, or null if never active. */
  lastDay: number | null;
  /** Stored freezes; each covers one missed day automatically. */
  freezes: number;
};

export const EMPTY_STREAK: Streak = { count: 0, best: 0, lastDay: null, freezes: 0 };

/**
 * Marks `today` as active (a session was completed). Missed days are covered
 * by freezes when there are enough; otherwise the streak restarts at 1.
 * A day in the past (clock moved back) changes nothing.
 */
export function markActive(streak: Streak, today: number): { streak: Streak; usedFreezes: number } {
  const { lastDay } = streak;
  if (lastDay !== null && today <= lastDay) return { streak, usedFreezes: 0 };

  const missed = lastDay === null ? 0 : today - lastDay - 1;
  const covered = missed > 0 && missed <= streak.freezes;
  const usedFreezes = covered ? missed : 0;
  const count = lastDay === null || (missed > 0 && !covered) ? 1 : streak.count + 1;

  const earned = count % FREEZE_EVERY_DAYS === 0 ? 1 : 0;
  const freezes = Math.min(streak.freezes - usedFreezes + earned, MAX_FREEZES);

  return {
    streak: { count, best: Math.max(streak.best, count), lastDay: today, freezes },
    usedFreezes,
  };
}

/**
 * Streak as shown on `today` before playing: still alive if today or
 * yesterday was active, or the gap can be covered by freezes; else 0.
 */
export function visibleStreak(streak: Streak, today: number): number {
  if (streak.lastDay === null) return 0;
  const missed = today - streak.lastDay - 1;
  return missed <= streak.freezes ? streak.count : 0;
}
