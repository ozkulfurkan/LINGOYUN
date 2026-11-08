import { contrastRatio, isLargeText } from './contrast';
import { FONT_ASSETS } from './fonts';
import { THEMES } from './themes';
import type { ColorTokens, Theme } from './types';

const AA = 4.5;
const AA_LARGE = 3;

// [foreground, background, minimum ratio or 'button' for size-dependent].
const TEXT_PAIRS: [keyof ColorTokens, keyof ColorTokens, number | 'button'][] = [
  ['text', 'background', AA],
  ['text', 'surface', AA],
  ['text', 'highlight', AA],
  ['textMuted', 'background', AA],
  ['textMuted', 'surface', AA],
  ['onSurfaceInverse', 'surfaceInverse', AA],
  ['onCorrect', 'correct', AA],
  ['onIncorrect', 'incorrect', AA],
  ['onAccent', 'accent', 'button'],
  // The big word is display-size text in every theme.
  ['accentText', 'surface', AA_LARGE],
  ['accentText', 'background', AA_LARGE],
];

// Button text may use the large-text threshold only if it really is large.
function buttonMinimum(theme: Theme): number {
  return isLargeText(theme.text.button.fontSize, true) ? AA_LARGE : AA;
}

describe.each(THEMES)('$name theme', (theme) => {
  it.each(TEXT_PAIRS)('%s on %s is readable', (fg, bg, min) => {
    const required = min === 'button' ? buttonMinimum(theme) : min;
    expect(contrastRatio(theme.colors[fg], theme.colors[bg])).toBeGreaterThanOrEqual(required);
  });

  it('uses only #RRGGBB colours', () => {
    for (const value of Object.values(theme.colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('uses only bundled fonts', () => {
    const used = [
      ...Object.values(theme.fonts),
      ...Object.values(theme.text).map((t) => t.fontFamily),
    ];
    for (const font of used) expect(Object.keys(FONT_ASSETS)).toContain(font);
  });

  it('keeps body text at least 16 px', () => {
    expect(theme.text.body.fontSize).toBeGreaterThanOrEqual(16);
  });
});

it('kids body text is at least 18 px (kids-ux)', () => {
  expect(THEMES.find((t) => t.name === 'kids')?.text.body.fontSize).toBeGreaterThanOrEqual(18);
});

it('adult light and dark share layout tokens', () => {
  const light = THEMES.find((t) => t.name === 'adultLight')!;
  const dark = THEMES.find((t) => t.name === 'adultDark')!;
  expect(dark.text).toEqual(light.text);
  expect(dark.radii).toEqual(light.radii);
  expect(dark.fonts).toEqual(light.fonts);
});
