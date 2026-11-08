import { EMPTY_STREAK, markActive, visibleStreak, type Streak } from './streak';

const D = 1000;

function play(days: number[], start: Streak = EMPTY_STREAK) {
  return days.reduce((s, d) => markActive(s, d).streak, start);
}

describe('markActive', () => {
  it('starts at 1 and grows on consecutive days', () => {
    expect(play([D])).toMatchObject({ count: 1, best: 1, lastDay: D });
    expect(play([D, D + 1, D + 2])).toMatchObject({ count: 3, best: 3 });
  });

  it('counts a day only once', () => {
    expect(play([D, D, D])).toMatchObject({ count: 1 });
  });

  it('ignores days in the past (clock moved back)', () => {
    const s = play([D, D + 1]);
    expect(markActive(s, D - 3)).toEqual({ streak: s, usedFreezes: 0 });
  });

  it('restarts after a missed day without freezes, keeping the best', () => {
    expect(play([D, D + 1, D + 2, D + 4])).toMatchObject({ count: 1, best: 3 });
  });

  it('earns a freeze every 7 days, up to 2', () => {
    const week = Array.from({ length: 7 }, (_, i) => D + i);
    expect(play(week).freezes).toBe(1);
    const threeWeeks = Array.from({ length: 21 }, (_, i) => D + i);
    expect(play(threeWeeks).freezes).toBe(2);
  });

  it('uses freezes to cover missed days', () => {
    const week = play(Array.from({ length: 7 }, (_, i) => D + i)); // count 7, 1 freeze
    const { streak, usedFreezes } = markActive(week, D + 8); // missed D+7
    expect(usedFreezes).toBe(1);
    expect(streak).toMatchObject({ count: 8, freezes: 0 });
  });

  it('does not use freezes when the gap is too long', () => {
    const week = play(Array.from({ length: 7 }, (_, i) => D + i)); // 1 freeze
    const { streak, usedFreezes } = markActive(week, D + 9); // missed 2 days
    expect(usedFreezes).toBe(0);
    expect(streak).toMatchObject({ count: 1, freezes: 1, best: 7 });
  });
});

describe('visibleStreak', () => {
  const s = play([D, D + 1, D + 2]);

  it('stays visible today and tomorrow', () => {
    expect(visibleStreak(s, D + 2)).toBe(3);
    expect(visibleStreak(s, D + 3)).toBe(3);
  });

  it('drops to 0 once it is lost', () => {
    expect(visibleStreak(s, D + 4)).toBe(0);
    expect(visibleStreak(EMPTY_STREAK, D)).toBe(0);
  });

  it('survives a gap covered by freezes', () => {
    expect(visibleStreak({ ...s, freezes: 1 }, D + 4)).toBe(3);
  });
});
