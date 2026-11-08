import type { ContentBundle } from '@/content';

import { placementPool } from './pool';

const scale = ['A1', 'A2', 'B1', 'B2', 'C1'];

function bundleWith(levels: Record<string, string[]>): ContentBundle {
  return {
    concepts: [],
    languages: { tr: { words: {}, sentences: {} }, en: { words: {}, sentences: {} } },
    courses: [
      {
        id: 'tr-en',
        units: Object.entries(levels).map(([level, concepts]) => ({
          id: level,
          profileType: 'adult',
          level,
          concepts,
        })),
      },
    ],
  };
}

describe('placementPool', () => {
  it('uses the concepts of the requested level', () => {
    expect(placementPool(bundleWith({ B1: ['x', 'y'] }), 'tr-en', 'adult', scale, 'B1')).toEqual([
      'x',
      'y',
    ]);
  });

  it('falls back to the nearest lower level, then higher', () => {
    const bundle = bundleWith({ A1: ['a'], C1: ['c'] });
    expect(placementPool(bundle, 'tr-en', 'adult', scale, 'B2')).toEqual(['a']);
    expect(placementPool(bundleWith({ C1: ['c'] }), 'tr-en', 'adult', scale, 'A2')).toEqual(['c']);
  });

  it('is empty without content or for unknown levels', () => {
    expect(placementPool(bundleWith({}), 'tr-en', 'adult', scale, 'B1')).toEqual([]);
    expect(placementPool(bundleWith({ B1: ['x'] }), 'tr-en', 'adult', scale, 'Z9')).toEqual([]);
  });
});
