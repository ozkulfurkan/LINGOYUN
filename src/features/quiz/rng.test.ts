import { seededRng, shuffle } from './rng';

describe('seededRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const seqA = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(seqA);
    expect(Array.from({ length: 5 }, seededRng(43))).not.toEqual(seqA);
  });

  it('stays within [0, 1)', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 10_000; i++) {
      const v = rng();
      expect(v >= 0 && v < 1).toBe(true);
    }
  });
});

describe('shuffle', () => {
  it('keeps every item and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, seededRng(7));
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
