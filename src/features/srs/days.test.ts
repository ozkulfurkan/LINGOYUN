import { localDay } from './days';

describe('localDay', () => {
  it('is the same all day long and changes at local midnight', () => {
    const morning = localDay(new Date(2026, 10, 8, 0, 0, 1));
    expect(localDay(new Date(2026, 10, 8, 23, 59, 59))).toBe(morning);
    expect(localDay(new Date(2026, 10, 9, 0, 0, 0))).toBe(morning + 1);
    expect(localDay(new Date(2026, 10, 15, 12, 0))).toBe(morning + 7);
  });

  it('crosses month and year boundaries', () => {
    expect(localDay(new Date(2027, 0, 1, 9))).toBe(localDay(new Date(2026, 11, 31, 9)) + 1);
  });
});
