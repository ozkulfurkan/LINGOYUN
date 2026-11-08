import { seededRng } from '@/features/quiz/rng';

import {
  answerOf,
  appendDigit,
  closeGate,
  createChallenge,
  GATE_OPEN_MS,
  isGateAnswer,
  isGateOpen,
  markGatePassed,
  MAX_FACTOR,
  MIN_FACTOR,
} from './gate';

describe('parental gate', () => {
  it('asks multiplications of 3–9 that vary', () => {
    const rng = seededRng(7);
    const products = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const c = createChallenge(rng);
      expect(c.a).toBeGreaterThanOrEqual(MIN_FACTOR);
      expect(c.b).toBeLessThanOrEqual(MAX_FACTOR);
      products.add(answerOf(c));
    }
    expect(products.size).toBeGreaterThan(15);
  });

  it('gives a different product after a wrong answer', () => {
    const rng = seededRng(1);
    for (let i = 0; i < 100; i++) {
      const first = createChallenge(rng);
      expect(answerOf(createChallenge(rng, first))).not.toBe(answerOf(first));
    }
  });

  it('checks the typed digits', () => {
    const c = { a: 7, b: 8 };
    expect(isGateAnswer(c, '56')).toBe(true);
    expect(isGateAnswer(c, '65')).toBe(false);
    expect(isGateAnswer(c, '')).toBe(false);
  });

  it('accepts only digits, up to the answer length', () => {
    const c = { a: 3, b: 3 }; // 9: one digit
    expect(appendDigit(c, '', '9')).toBe('9');
    expect(appendDigit(c, '9', '1')).toBe('9');
    expect(appendDigit(c, '', 'x')).toBe('');
    expect(appendDigit({ a: 9, b: 9 }, '8', '1')).toBe('81');
  });

  it('stays open for a minute after passing, then closes', () => {
    closeGate();
    expect(isGateOpen(1000)).toBe(false);
    markGatePassed(1000);
    expect(isGateOpen(1000 + GATE_OPEN_MS - 1)).toBe(true);
    expect(isGateOpen(1000 + GATE_OPEN_MS)).toBe(false);
    expect(isGateOpen(500)).toBe(false); // clock moved back
    closeGate();
    expect(isGateOpen(1001)).toBe(false);
  });
});
