import { CONFETTI_COUNT, confettiPieces } from './Confetti';

describe('confettiPieces', () => {
  it('is deterministic and within bounds', () => {
    const a = confettiPieces(CONFETTI_COUNT, 3);
    expect(a).toEqual(confettiPieces(CONFETTI_COUNT, 3));
    expect(a).toHaveLength(CONFETTI_COUNT);
    for (const p of a) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(1);
      expect(p.color).toBeLessThan(4);
    }
  });
});
