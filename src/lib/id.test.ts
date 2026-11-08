import { createId } from './id';

describe('createId', () => {
  it('is deterministic for injected time and randomness', () => {
    expect(createId(0, () => 0)).toBe('000000000');
    expect(createId(1_700_000_000_000, () => 0.5)).toBe(createId(1_700_000_000_000, () => 0.5));
  });

  it('produces distinct ids', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => createId()));
    expect(ids.size).toBe(1000);
  });
});
