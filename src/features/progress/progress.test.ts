import type { Grade } from '@/features/srs';

import { BADGES, newBadges, EMPTY_STATS } from './badges';
import { answerXp, completeSession, EMPTY_PROGRESS, parseProgress, spendGems } from './progress';

const g = (s: string): Grade[] =>
  [...s].map((c) => (c === 'g' ? 'good' : c === 'h' ? 'hard' : 'again'));

describe('answerXp', () => {
  it('gives 10 / 5 / 1 per answer', () => {
    expect(answerXp(g('gha'))).toEqual({ xp: 16, comboBonusXp: 0 });
  });

  it('adds combo bonuses at 3, 5 and 10 in a row', () => {
    expect(answerXp(g('ggg')).comboBonusXp).toBe(5);
    expect(answerXp(g('ggggg')).comboBonusXp).toBe(15);
    expect(answerXp(g('gggggggggg')).comboBonusXp).toBe(35);
  });

  it('restarts the combo after a non-good answer', () => {
    expect(answerXp(g('gghggg')).comboBonusXp).toBe(5);
  });
});

describe('completeSession', () => {
  it('rewards a perfect first session', () => {
    const { progress, reward } = completeSession(EMPTY_PROGRESS, {
      grades: g('gggg'),
      today: 50,
      wordsLearned: 0,
    });
    // 4×10 + combo 5 + complete 20 + perfect 10
    expect(reward).toEqual({
      xp: 75,
      gems: 4 + 5,
      comboBonusXp: 5,
      perfect: true,
      streak: 1,
      usedFreezes: 0,
      newBadges: ['first_session', 'perfect_session'],
    });
    expect(progress).toMatchObject({
      xp: 75,
      gems: 9,
      badges: ['first_session', 'perfect_session'],
    });
    expect(progress.stats).toMatchObject({ sessions: 1, perfectSessions: 1, goodAnswers: 4 });
  });

  it('never takes anything away for wrong answers', () => {
    const { reward } = completeSession(EMPTY_PROGRESS, {
      grades: g('aaaa'),
      today: 50,
      wordsLearned: 0,
    });
    expect(reward.xp).toBe(4 + 20);
    expect(reward.gems).toBe(5);
    expect(reward.perfect).toBe(false);
  });

  it('adds level-up gems and badge', () => {
    const { reward } = completeSession(EMPTY_PROGRESS, {
      grades: g('g'),
      today: 1,
      levelUp: true,
      wordsLearned: 0,
    });
    expect(reward.gems).toBe(1 + 5 + 10);
    expect(reward.newBadges).toContain('level_up');
  });

  it('awards each badge only once and tracks streak badges', () => {
    let progress = EMPTY_PROGRESS;
    const earned: string[] = [];
    for (let day = 1; day <= 7; day++) {
      const r = completeSession(progress, { grades: g('gh'), today: day, wordsLearned: day * 2 });
      progress = r.progress;
      earned.push(...r.reward.newBadges);
    }
    expect(earned).toEqual(['first_session', 'streak_3', 'words_10', 'streak_7']);
    expect(new Set(progress.badges).size).toBe(progress.badges.length);
    expect(progress.streak).toMatchObject({ count: 7, freezes: 1 });
  });

  it('ignores an empty session', () => {
    const { progress, reward } = completeSession(EMPTY_PROGRESS, {
      grades: [],
      today: 1,
      wordsLearned: 0,
    });
    expect(progress).toBe(EMPTY_PROGRESS);
    expect(reward.xp).toBe(0);
  });
});

describe('badges', () => {
  it('have unique ids', () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('are not earned with empty stats', () => {
    expect(newBadges(EMPTY_STATS, [])).toEqual([]);
  });
});

describe('gems', () => {
  it('can be spent only when there are enough', () => {
    const p = { ...EMPTY_PROGRESS, gems: 10 };
    expect(spendGems(p, 4)?.gems).toBe(6);
    expect(spendGems(p, 11)).toBeNull();
    expect(spendGems(p, -1)).toBeNull();
  });
});

describe('parseProgress', () => {
  it('round-trips', () => {
    const { progress } = completeSession(EMPTY_PROGRESS, {
      grades: g('ggg'),
      today: 9,
      wordsLearned: 3,
    });
    expect(parseProgress(JSON.parse(JSON.stringify(progress)))).toEqual(progress);
  });

  it('fills defaults for missing or invalid fields', () => {
    expect(parseProgress(null)).toEqual(EMPTY_PROGRESS);
    expect(parseProgress({ xp: -5, gems: 'x', badges: ['a', 3] })).toEqual({
      ...EMPTY_PROGRESS,
      badges: ['a'],
    });
  });
});
