/**
 * Font glyph check: every bundled font must contain the special letters of
 * every supported language (e.g. Turkish ğ ş İ ı). Lilita One and Fredoka
 * were rejected because they lack ğ ş İ. Paths are read from fonts.ts so the
 * check can never drift from what the app actually loads.
 */
import { readFileSync } from 'fs';
import path from 'path';

import { openSync, type Font } from 'fontkit';

import { allCharsets } from '@/features/languages';

const source = readFileSync(path.join(__dirname, 'fonts.ts'), 'utf8');
const files = [...source.matchAll(/'([^']+)':\s*require\('([^']+\.ttf)'\)/g)].map(
  ([, name, file]) => ({ name, file }),
);
// Latin letters every font needs besides the language-specific ones.
const required = [...`${allCharsets()}ABCabc0123456789?!.,`];

describe('bundled fonts', () => {
  it('lists every font in FONT_ASSETS', () => {
    const { FONT_ASSETS } = jest.requireActual<typeof import('./fonts')>('./fonts');
    expect(files.map((f) => f.name).sort()).toEqual(Object.keys(FONT_ASSETS).sort());
  });

  it.each(files)('$name has every required letter', ({ file }) => {
    const font = openSync(require.resolve(file)) as Font;
    const missing = required.filter((ch) => !font.hasGlyphForCodePoint(ch.codePointAt(0)!));
    expect(missing).toEqual([]);
  });
});
