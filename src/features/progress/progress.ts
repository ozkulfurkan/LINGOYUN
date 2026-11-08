import type { Grade } from '@/features/srs';

import { EMPTY_STATS, newBadges, type Stats } from './badges';
import {
  COMBO_BONUS_XP,
  GEMS_PER_GOOD_ANSWER,
  LEVEL_UP_GEMS,
  PERFECT_SESSION_XP,
  SESSION_COMPLETE_GEMS,
  SESSION_COMPLETE_XP,
  XP_PER_GRADE,
} from './economy';
import { EMPTY_STREAK, markActive, type Streak } from './streak';

/** Everything a profile has earned. One per profile (not per course). */
export type Progress = {
  xp: number;
  gems: number;
  streak: Streak;
  stats: Stats;
  badges: string[];
};

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  gems: 0,
  streak: EMPTY_STREAK,
  stats: EMPTY_STATS,
  badges: [],
};

export type SessionInput = {
  /** Grades of the session's answers, in order. */
  grades: readonly Grade[];
  today: number;
  /** The course level went up in this session. */
  levelUp?: boolean;
  /** Current number of learned words (deck cards in box 3+). */
  wordsLearned: number;
};

/** What the session summary screen shows. */
export type SessionReward = {
  xp: number;
  gems: number;
  comboBonusXp: number;
  perfect: boolean;
  streak: number;
  usedFreezes: number;
  newBadges: string[];
};

/** XP for answers including combo bonuses (a run resets on a non-good answer). */
export function answerXp(grades: readonly Grade[]): { xp: number; comboBonusXp: number } {
  let xp = 0;
  let comboBonusXp = 0;
  let run = 0;
  for (const grade of grades) {
    xp += XP_PER_GRADE[grade];
    run = grade === 'good' ? run + 1 : 0;
    comboBonusXp += COMBO_BONUS_XP[run] ?? 0;
  }
  return { xp: xp + comboBonusXp, comboBonusXp };
}

/**
 * Applies a completed session: XP, gems, daily streak, stats and badges.
 * An empty session (no answers) changes nothing.
 */
export function completeSession(
  progress: Progress,
  session: SessionInput,
): { progress: Progress; reward: SessionReward } {
  const { grades, today, levelUp = false, wordsLearned } = session;
  if (grades.length === 0) {
    return {
      progress,
      reward: {
        xp: 0,
        gems: 0,
        comboBonusXp: 0,
        perfect: false,
        streak: progress.streak.count,
        usedFreezes: 0,
        newBadges: [],
      },
    };
  }

  const good = grades.filter((g) => g === 'good').length;
  const perfect = good === grades.length;
  const { xp: answersXp, comboBonusXp } = answerXp(grades);
  const xp = answersXp + SESSION_COMPLETE_XP + (perfect ? PERFECT_SESSION_XP : 0);
  const gems = good * GEMS_PER_GOOD_ANSWER + SESSION_COMPLETE_GEMS + (levelUp ? LEVEL_UP_GEMS : 0);

  const { streak, usedFreezes } = markActive(progress.streak, today);
  const stats: Stats = {
    sessions: progress.stats.sessions + 1,
    perfectSessions: progress.stats.perfectSessions + (perfect ? 1 : 0),
    goodAnswers: progress.stats.goodAnswers + good,
    bestStreak: Math.max(progress.stats.bestStreak, streak.best),
    wordsLearned: Math.max(progress.stats.wordsLearned, wordsLearned),
    levelUps: progress.stats.levelUps + (levelUp ? 1 : 0),
  };
  const earned = newBadges(stats, progress.badges);

  return {
    progress: {
      xp: progress.xp + xp,
      gems: progress.gems + gems,
      streak,
      stats,
      badges: [...progress.badges, ...earned],
    },
    reward: {
      xp,
      gems,
      comboBonusXp,
      perfect,
      streak: streak.count,
      usedFreezes,
      newBadges: earned,
    },
  };
}

/** Spends gems (sticker album, cosmetics). Null when there are not enough. */
export function spendGems(progress: Progress, amount: number): Progress | null {
  if (amount < 0 || progress.gems < amount) return null;
  return { ...progress, gems: progress.gems - amount };
}

/** Rebuilds progress from stored JSON; missing or invalid fields get defaults. */
export function parseProgress(data: unknown): Progress {
  if (typeof data !== 'object' || data === null) return EMPTY_PROGRESS;
  const d = data as Record<string, unknown>;
  const num = (v: unknown, fallback = 0) =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;
  const obj = (v: unknown) =>
    typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};
  const s = obj(d.streak);
  const st = obj(d.stats);
  return {
    xp: num(d.xp),
    gems: num(d.gems),
    streak: {
      count: num(s.count),
      best: num(s.best),
      lastDay: typeof s.lastDay === 'number' ? s.lastDay : null,
      freezes: num(s.freezes),
    },
    stats: {
      sessions: num(st.sessions),
      perfectSessions: num(st.perfectSessions),
      goodAnswers: num(st.goodAnswers),
      bestStreak: num(st.bestStreak),
      wordsLearned: num(st.wordsLearned),
      levelUps: num(st.levelUps),
    },
    badges: Array.isArray(d.badges) ? d.badges.filter((b) => typeof b === 'string') : [],
  };
}
