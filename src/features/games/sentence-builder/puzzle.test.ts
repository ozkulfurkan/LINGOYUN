import type { ContentBundle } from '@/content';
import { content } from '@/content/bundle';
import { seededRng } from '@/features/quiz/rng';

import {
  buildSentencePuzzle,
  builtText,
  canCheck,
  checkSentence,
  levelSentences,
  placeBlock,
  removeBlock,
  revealSentence,
  sentenceGrade,
  sentenceHint,
  splitSentence,
  type SentencePuzzle,
} from './puzzle';

const bundle: ContentBundle = {
  concepts: [
    { id: 's.cat', topic: 's', kind: 'sentence', ageGroups: ['kid'] },
    { id: 's.dog', topic: 's', kind: 'sentence', ageGroups: ['kid'] },
    { id: 's.big', topic: 's', kind: 'sentence', ageGroups: ['kid'] },
    { id: 'w.cat', topic: 'w', kind: 'word', ageGroups: ['kid'] },
  ],
  languages: {
    en: {
      words: { 'w.cat': { text: 'cat' } },
      sentences: {
        's.cat': { text: 'This is a cat.', alt: ['It is a cat.'] },
        's.dog': { text: 'The dog runs fast!' },
        's.big': { text: 'The big dog is my big friend.' },
      },
    },
    tr: {
      words: { 'w.cat': { text: 'kedi' } },
      sentences: {
        's.cat': { text: 'Bu bir kedi.' },
        's.dog': { text: 'Köpek hızlı koşar!' },
        's.big': { text: 'Büyük köpek benim büyük arkadaşım.' },
      },
    },
  },
  courses: [],
};

function puzzle(id = 's.cat', seed = 1, decoys = 0): SentencePuzzle {
  const p = buildSentencePuzzle({
    bundle,
    courseId: 'tr-en',
    conceptId: id,
    decoys,
    decoyPool: ['s.cat', 's.dog', 's.big'],
    rng: seededRng(seed),
  });
  if (!p) throw new Error('no puzzle');
  return p;
}

/** Places blocks spelling these words, taking the first free block of each. */
function build(p: SentencePuzzle, words: string[]): SentencePuzzle {
  let out = p;
  for (const w of words) {
    const block = out.blocks.find((b) => b.word === w && !out.placed.includes(b.id));
    if (!block) throw new Error(`no free block ${w}`);
    out = placeBlock(out, block.id);
  }
  return out;
}

describe('splitSentence', () => {
  it('keeps final punctuation apart', () => {
    expect(splitSentence('This is a cat.')).toEqual({
      words: ['This', 'is', 'a', 'cat'],
      ending: '.',
    });
    expect(splitSentence('Are you OK?')).toEqual({ words: ['Are', 'you', 'OK'], ending: '?' });
    expect(splitSentence('Well, hello there')).toEqual({
      words: ['Well,', 'hello', 'there'],
      ending: '',
    });
    expect(splitSentence('  ')).toEqual({ words: [], ending: '' });
  });
});

describe('buildSentencePuzzle', () => {
  it('asks to build the English sentence for a Turkish one', () => {
    const p = puzzle();
    expect(p).toMatchObject({
      prompt: 'Bu bir kedi.',
      words: ['This', 'is', 'a', 'cat'],
      ending: '.',
    });
    expect(p.blocks.map((b) => b.word).sort()).toEqual(['This', 'a', 'cat', 'is']);
  });

  it('never starts in the right order', () => {
    for (let seed = 1; seed <= 100; seed++) {
      expect(
        puzzle('s.cat', seed)
          .blocks.map((b) => b.word)
          .join(' '),
      ).not.toBe('This is a cat');
    }
  });

  it('adds decoy words that are not in the sentence', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const p = puzzle('s.cat', seed, 2);
      expect(p.blocks).toHaveLength(6);
      const extra = p.blocks.map((b) => b.word).filter((w) => !p.words.includes(w));
      expect(extra).toHaveLength(2);
      expect(extra.map((w) => w.toLowerCase())).not.toContain('a');
    }
  });

  it('skips words, unknown concepts and missing courses', () => {
    const args = { bundle, rng: seededRng(1) };
    expect(buildSentencePuzzle({ ...args, courseId: 'tr-en', conceptId: 'w.cat' })).toBeNull();
    expect(buildSentencePuzzle({ ...args, courseId: 'tr-en', conceptId: 'nope' })).toBeNull();
    expect(buildSentencePuzzle({ ...args, courseId: 'en-tr', conceptId: 's.cat' })).toBeNull();
  });
});

describe('building', () => {
  it('appends blocks, removes them and caps at the answer length', () => {
    let p = build(puzzle(), ['This', 'is']);
    expect(builtText(p)).toBe('This is');
    p = removeBlock(p, p.placed[0]);
    expect(builtText(p)).toBe('is');
    p = build(p, ['This', 'a', 'cat']);
    expect(p.placed).toHaveLength(4);
    expect(canCheck(p)).toBe(true);
    // A full answer takes no more blocks (relevant with decoys).
    expect(placeBlock(p, p.blocks.find((b) => !p.placed.includes(b.id))?.id ?? -1)).toBe(p);
  });

  it('solves the main answer first try with a good grade', () => {
    const { puzzle: p, result } = checkSentence(build(puzzle(), ['This', 'is', 'a', 'cat']));
    expect(result).toBe('right');
    expect(sentenceGrade(p)).toBe('good');
  });

  it('accepts an equivalent order of repeated words', () => {
    // "big" appears twice: either block works in either place.
    let p = puzzle('s.big');
    const bigs = p.blocks.filter((b) => b.word === 'big').map((b) => b.id);
    for (const w of ['The', bigs[1], 'dog', 'is', 'my', bigs[0], 'friend']) {
      const id = typeof w === 'number' ? w : p.blocks.find((b) => b.word === w)!.id;
      p = placeBlock(p, id);
    }
    expect(checkSentence(p).result).toBe('right');
  });

  it('keeps the right beginning after a wrong try, then hints', () => {
    let p = checkSentence(build(puzzle(), ['This', 'a', 'is', 'cat'])).puzzle;
    expect(p.attempts).toBe(1);
    expect(builtText(p)).toBe('This');
    expect(sentenceHint(p)).toBeNull();
    p = checkSentence(build(p, ['cat', 'is', 'a'])).puzzle;
    expect(p.attempts).toBe(2);
    expect(p.blocks.find((b) => b.id === sentenceHint(p))?.word).toBe('is');
    const solved = checkSentence(build(p, ['is', 'a', 'cat'])).puzzle;
    expect(solved.solved).toBe(true);
    expect(sentenceGrade(solved)).toBe('hard');
  });

  it('does not check an incomplete answer', () => {
    const p = build(puzzle(), ['This']);
    expect(checkSentence(p)).toEqual({ puzzle: p, result: 'incomplete' });
  });

  it('reveals the answer with an "again" grade', () => {
    const p = revealSentence(build(puzzle('s.cat', 1, 2), ['cat']));
    expect(builtText(p)).toBe('This is a cat');
    expect(sentenceGrade(p)).toBe('again');
    expect(placeBlock(p, p.blocks[0].id)).toBe(p);
    expect(removeBlock(p, p.placed[0])).toBe(p);
  });
});

describe('levelSentences', () => {
  it('lists only sentences of a level', () => {
    const l1 = levelSentences(content, 'tr-en', 'kid', 'L1');
    expect(l1.length).toBeGreaterThan(0);
    expect(l1.every((id) => content.concepts.find((c) => c.id === id)?.kind === 'sentence')).toBe(
      true,
    );
  });
});
