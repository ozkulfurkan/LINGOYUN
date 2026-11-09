import { content } from '@/content/bundle';
import { seededRng } from '@/features/quiz/rng';

import {
  buildPuzzle,
  checkPuzzle,
  clearSlot,
  fitsPuzzle,
  hintTileId,
  isFull,
  placeTile,
  puzzleGrade,
  revealPuzzle,
  spelled,
  type Puzzle,
} from './puzzle';

function puzzle(conceptId: string, seed = 1): Puzzle {
  const p = buildPuzzle({ bundle: content, courseId: 'tr-en', conceptId, rng: seededRng(seed) });
  if (!p) throw new Error(`no puzzle for ${conceptId}`);
  return p;
}

/** Places tiles so that they spell `word` (letters only). */
function spell(p: Puzzle, word: string): Puzzle {
  let out = p;
  const used = new Set<number>();
  for (const ch of word) {
    const tile = out.tiles.find((t) => t.letter === ch && !used.has(t.id));
    if (!tile) throw new Error(`no free tile ${ch}`);
    used.add(tile.id);
    out = placeTile(out, tile.id);
  }
  return out;
}

describe('fitsPuzzle', () => {
  it('accepts short words and phrases with spaces or hyphens', () => {
    expect(fitsPuzzle('apple')).toBe(true);
    expect(fitsPuzzle('ice cream')).toBe(true);
    expect(fitsPuzzle('t-shirt')).toBe(true);
  });

  it('rejects one letter, too many letters and digits', () => {
    expect(fitsPuzzle('a')).toBe(false);
    expect(fitsPuzzle('hot air balloon')).toBe(false);
    expect(fitsPuzzle('20')).toBe(false);
  });
});

describe('buildPuzzle', () => {
  it('asks for the English word of a Turkish prompt', () => {
    const p = puzzle('fruit.apple');
    expect(p).toMatchObject({
      prompt: 'elma',
      answer: 'apple',
      promptLang: 'tr',
      answerLang: 'en',
    });
    expect(
      p.tiles
        .map((t) => t.letter)
        .sort()
        .join(''),
    ).toBe('aelpp');
  });

  it('never starts in the right order', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(
        puzzle('animal.cat', seed)
          .tiles.map((t) => t.letter)
          .join(''),
      ).not.toBe('cat');
    }
  });

  it('keeps spaces and hyphens fixed', () => {
    const ice = puzzle('food.ice_cream');
    expect(ice.slots.filter((s) => s.kind === 'fixed')).toEqual([{ kind: 'fixed', char: ' ' }]);
    expect(ice.tiles).toHaveLength(8);
    expect(spelled(ice)).toBe('___ _____');
    expect(spelled(puzzle('clothes.tshirt'))).toBe('_-_____');
  });

  it('skips sentences, idioms, unknown concepts and unfitting words', () => {
    expect(
      buildPuzzle({
        bundle: content,
        courseId: 'tr-en',
        conceptId: 'emotion.reluctant_leave',
        rng: seededRng(1),
      }),
    ).toBeNull();
    expect(
      buildPuzzle({
        bundle: content,
        courseId: 'tr-en',
        conceptId: 'nope.nope',
        rng: seededRng(1),
      }),
    ).toBeNull();
    expect(
      buildPuzzle({
        bundle: content,
        courseId: 'tr-en',
        conceptId: 'vehicle.hot_air_balloon',
        rng: seededRng(1),
      }),
    ).toBeNull();
    expect(
      buildPuzzle({
        bundle: content,
        courseId: 'tr-en',
        conceptId: 'number.one',
        rng: seededRng(1),
      }),
    ).not.toBeNull();
  });
});

describe('moves', () => {
  it('fills slots left to right and takes tiles back out', () => {
    let p = puzzle('animal.cat');
    const [first, second] = p.tiles;
    p = placeTile(p, first.id);
    p = placeTile(p, second.id);
    expect(spelled(p)).toBe(`${first.letter}${second.letter}_`);
    // The same tile cannot be placed twice.
    expect(placeTile(p, first.id)).toBe(p);
    p = clearSlot(p, 0);
    expect(spelled(p)).toBe(`_${second.letter}_`);
    // The next tile goes into the gap.
    p = placeTile(p, first.id);
    expect(spelled(p)).toBe(`${first.letter}${second.letter}_`);
    expect(clearSlot(p, 2)).toBe(p); // empty slot
  });

  it('only checks a full puzzle', () => {
    const p = placeTile(puzzle('animal.cat'), 0);
    expect(checkPuzzle(p)).toEqual({ puzzle: p, result: 'incomplete' });
  });
});

describe('checking', () => {
  it('solves a right answer on the first try with a good grade', () => {
    const { puzzle: p, result } = checkPuzzle(spell(puzzle('fruit.apple'), 'apple'));
    expect(result).toBe('right');
    expect(p.solved).toBe(true);
    expect(puzzleGrade(p)).toBe('good');
  });

  it('accepts either copy of a repeated letter', () => {
    let p = puzzle('fruit.apple');
    const ps = p.tiles
      .filter((t) => t.letter === 'p')
      .map((t) => t.id)
      .reverse();
    const id = (l: string) => p.tiles.find((t) => t.letter === l)!.id;
    for (const tileId of [id('a'), ps[0], ps[1], id('l'), id('e')]) p = placeTile(p, tileId);
    expect(checkPuzzle(p).result).toBe('right');
  });

  it('keeps right letters and returns wrong ones after a miss', () => {
    // "cat" spelled "cta": c stays, t and a go back.
    const { puzzle: p, result } = checkPuzzle(spell(puzzle('animal.cat'), 'cta'));
    expect(result).toBe('wrong');
    expect(p.attempts).toBe(1);
    expect(spelled(p)).toBe('c__');
    expect(isFull(p)).toBe(false);
    const solved = checkPuzzle(spell(p, 'at')).puzzle;
    expect(solved.solved).toBe(true);
    expect(puzzleGrade(solved)).toBe('hard');
  });

  it('hints the next right letter after two misses', () => {
    // "cat" spelled "tac": only the middle "a" is right.
    let p = checkPuzzle(spell(puzzle('animal.cat'), 'tac')).puzzle;
    expect(spelled(p)).toBe('_a_');
    expect(hintTileId(p)).toBeNull();
    p = checkPuzzle(spell(p, 'tc')).puzzle; // "tac" again
    expect(p.attempts).toBe(2);
    expect(p.tiles.find((t) => t.id === hintTileId(p))?.letter).toBe('c');
    // Following the hint fills the first gap.
    p = placeTile(p, hintTileId(p)!);
    expect(spelled(p)).toBe('ca_');
    expect(p.tiles.find((t) => t.id === hintTileId(p))?.letter).toBe('t');
  });

  it('reveals the answer with an "again" grade and ignores further moves', () => {
    const p = revealPuzzle(placeTile(puzzle('fruit.apple'), 0));
    expect(spelled(p)).toBe('apple');
    expect(puzzleGrade(p)).toBe('again');
    expect(placeTile(p, 1)).toBe(p);
    expect(clearSlot(p, 0)).toBe(p);
    expect(revealPuzzle(p)).toBe(p);
    expect(checkPuzzle(p).result).toBe('incomplete');
  });
});
