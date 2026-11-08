/** Stats badges are judged on. */
export type Stats = {
  sessions: number;
  perfectSessions: number;
  goodAnswers: number;
  bestStreak: number;
  /** Words that reached box 3+ in the review deck. */
  wordsLearned: number;
  levelUps: number;
};

export const EMPTY_STATS: Stats = {
  sessions: 0,
  perfectSessions: 0,
  goodAnswers: 0,
  bestStreak: 0,
  wordsLearned: 0,
  levelUps: 0,
};

export type BadgeDef = { id: string; earned: (s: Stats) => boolean };

/** Order is the display order. Ids are stored: never rename one. */
export const BADGES: readonly BadgeDef[] = [
  { id: 'first_session', earned: (s) => s.sessions >= 1 },
  { id: 'perfect_session', earned: (s) => s.perfectSessions >= 1 },
  { id: 'streak_3', earned: (s) => s.bestStreak >= 3 },
  { id: 'streak_7', earned: (s) => s.bestStreak >= 7 },
  { id: 'streak_30', earned: (s) => s.bestStreak >= 30 },
  { id: 'words_10', earned: (s) => s.wordsLearned >= 10 },
  { id: 'words_50', earned: (s) => s.wordsLearned >= 50 },
  { id: 'words_100', earned: (s) => s.wordsLearned >= 100 },
  { id: 'words_300', earned: (s) => s.wordsLearned >= 300 },
  { id: 'answers_100', earned: (s) => s.goodAnswers >= 100 },
  { id: 'answers_1000', earned: (s) => s.goodAnswers >= 1000 },
  { id: 'level_up', earned: (s) => s.levelUps >= 1 },
];

/** Badges earned now that were not earned before, in display order. */
export function newBadges(stats: Stats, alreadyEarned: readonly string[]): string[] {
  return BADGES.filter((b) => !alreadyEarned.includes(b.id) && b.earned(stats)).map((b) => b.id);
}
