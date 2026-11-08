import { content } from './bundle';
import type { ContentBundle } from './types';
import { validateContent } from './validate';

/** A small valid bundle; each test breaks one rule. */
function makeBundle(): ContentBundle {
  return {
    concepts: [
      {
        id: 'fruit.apple',
        topic: 'fruits',
        kind: 'word',
        ageGroups: ['mini', 'kid'],
        image: 'fruit.apple',
      },
      { id: 'fruit.pear', topic: 'fruits', kind: 'word', ageGroups: ['kid'] },
      { id: 'fruit.apple_red', topic: 'fruits', kind: 'sentence', ageGroups: ['kid'] },
    ],
    languages: {
      tr: {
        words: { 'fruit.apple': { text: 'elma' }, 'fruit.pear': { text: 'armut' } },
        sentences: { 'fruit.apple_red': { text: 'Elma kırmızı.' } },
      },
      en: {
        words: { 'fruit.apple': { text: 'apple' }, 'fruit.pear': { text: 'pear' } },
        sentences: { 'fruit.apple_red': { text: 'The apple is red.' } },
      },
    },
    courses: [
      {
        id: 'tr-en',
        units: [
          { id: 'mini.fruits', profileType: 'mini', concepts: ['fruit.apple'] },
          {
            id: 'kid.l1',
            profileType: 'kid',
            level: 'L1',
            concepts: ['fruit.apple', 'fruit.pear', 'fruit.apple_red'],
          },
        ],
      },
    ],
  };
}

const errorsOf = (b: ContentBundle) =>
  validateContent(b)
    .filter((i) => i.severity === 'error')
    .map((i) => `${i.where}: ${i.message}`);

describe('shipped content', () => {
  it('has no errors', () => {
    expect(errorsOf(content)).toEqual([]);
  });
});

describe('validateContent', () => {
  it('accepts a valid bundle', () => {
    expect(validateContent(makeBundle())).toEqual([]);
  });

  it.each<[string, (b: ContentBundle) => void, RegExp]>([
    ['duplicate concept', (b) => b.concepts.push({ ...b.concepts[1] }), /duplicate concept id/],
    ['bad id', (b) => (b.concepts[1].id = 'Pear'), /topic\.name/],
    ['empty age groups', (b) => (b.concepts[1].ageGroups = []), /ageGroups is empty/],
    ['mini without image', (b) => delete b.concepts[0].image, /need an image/],
    [
      'entry for unknown concept',
      (b) => (b.languages.en.words['fruit.kiwi'] = { text: 'kiwi' }),
      /unknown concept/,
    ],
    [
      'sentence in words file',
      (b) => (b.languages.en.words['fruit.apple_red'] = { text: 'The apple is red.' }),
      /belongs in sentences\.json/,
    ],
    ['empty text', (b) => (b.languages.tr.words['fruit.pear'] = { text: ' ' }), /empty text/],
    [
      'extra spaces',
      (b) => (b.languages.tr.words['fruit.pear'] = { text: 'armut ' }),
      /extra spaces/,
    ],
    [
      'alt repeats text',
      (b) => (b.languages.tr.words['fruit.pear'] = { text: 'armut', alt: ['armut'] }),
      /alt repeats/,
    ],
    ['missing translation', (b) => delete b.languages.tr.words['fruit.pear'], /has no tr text/],
    [
      'unknown concept in unit',
      (b) => b.courses[0].units[1].concepts.push('fruit.kiwi'),
      /unknown concept fruit\.kiwi/,
    ],
    [
      'concept listed twice',
      (b) => b.courses[0].units[1].concepts.push('fruit.pear'),
      /listed twice/,
    ],
    [
      'wrong age group',
      (b) => b.courses[0].units[0].concepts.push('fruit.pear'),
      /not meant for mini/,
    ],
    ['bad level', (b) => (b.courses[0].units[1].level = 'L99'), /level must be one of/],
    ['mini with level', (b) => (b.courses[0].units[0].level = 'L1'), /have no level/],
    ['empty unit', (b) => (b.courses[0].units[1].concepts = []), /no concepts/],
    [
      'duplicate unit',
      (b) => b.courses[0].units.push({ ...b.courses[0].units[1] }),
      /duplicate unit id/,
    ],
    ['unknown course', (b) => (b.courses[0].id = 'tr-tr'), /no CourseDef/],
  ])('reports %s', (_name, breakIt, pattern) => {
    const bundle = makeBundle();
    breakIt(bundle);
    const errors = errorsOf(bundle);
    expect(errors.some((e) => pattern.test(e))).toBe(true);
  });

  it('warns, but does not fail, on translations marked for review', () => {
    const bundle = makeBundle();
    bundle.languages.tr.words['fruit.pear'] = { text: 'armut', review: true };
    const issues = validateContent(bundle);
    expect(issues).toEqual([
      expect.objectContaining({ severity: 'warning', message: 'translation marked for review' }),
    ]);
  });
});
