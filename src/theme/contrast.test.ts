import { contrastRatio, isLargeText, luminance } from './contrast';

describe('contrast helpers', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#C2401A', '#F4EFE4')).toBe(contrastRatio('#F4EFE4', '#C2401A'));
  });

  it('rejects colours that are not #RRGGBB', () => {
    expect(() => luminance('rgba(0,0,0,0.5)')).toThrow();
    expect(() => luminance('#FFF')).toThrow();
  });

  it('classifies large text', () => {
    expect(isLargeText(24, false)).toBe(true);
    expect(isLargeText(19, true)).toBe(true);
    expect(isLargeText(18, true)).toBe(false);
    expect(isLargeText(16, false)).toBe(false);
  });
});
