import { buildSentencePuzzle } from '@/features/games/sentence-builder';
import { placeableLevels } from '@/features/placement';
import { buildQuestion } from '@/features/quiz/generate';
import { seededRng } from '@/features/quiz/rng';

import { content } from './bundle';
import { getEntry, themeConcepts, themeUnits, unitsFor } from './query';

// Average sentence length per difficulty: the shortest current sentences × 1, 2, 3, 4.
const TIERS = [
  { level: 'A2', min: 7, max: 9 },
  { level: 'B1', min: 10, max: 13 },
  { level: 'B2', min: 15, max: 19 },
  { level: 'C1', min: 21, max: 25 },
];
const concepts = (level: string, kind: 'vocabulary' | 'sentence') =>
  themeConcepts(content, 'tr-en', 'adult', 'restaurant', level, kind);
const wordCount = (id: string) => getEntry(content, 'en', id)!.text.split(/\s+/).length;

describe('restaurant theme', () => {
  it('has all four difficulties, easiest first', () => {
    expect(themeUnits(content, 'tr-en', 'adult', 'restaurant').map((u) => u.level)).toEqual(
      TIERS.map((t) => t.level),
    );
  });

  it.each(TIERS)('$level has enough words and sentences for a round', ({ level }) => {
    expect(concepts(level, 'vocabulary').length).toBeGreaterThanOrEqual(10);
    expect(concepts(level, 'sentence').length).toBeGreaterThanOrEqual(6);
  });

  it.each(TIERS)('$level sentences average $min to $max words', ({ level, min, max }) => {
    const lengths = concepts(level, 'sentence').map(wordCount);
    const average = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    expect(average).toBeGreaterThanOrEqual(min);
    expect(average).toBeLessThanOrEqual(max);
  });

  it('gets harder at every step', () => {
    const averages = TIERS.map(({ level }) => {
      const lengths = concepts(level, 'sentence').map(wordCount);
      return lengths.reduce((a, b) => a + b, 0) / lengths.length;
    });
    expect(averages).toEqual([...averages].sort((a, b) => a - b));
    expect(new Set(averages).size).toBe(TIERS.length);
  });

  it.each(TIERS)('$level can ask a four-option question about every word', ({ level }) => {
    const words = concepts(level, 'vocabulary');
    for (const id of words) {
      for (const direction of ['targetToNative', 'nativeToTarget'] as const) {
        const question = buildQuestion({
          bundle: content,
          courseId: 'tr-en',
          conceptId: id,
          direction,
          distractorIds: words,
          rng: seededRng(1),
        });
        expect({ id, options: question?.options.length }).toEqual({ id, options: 4 });
      }
    }
  });

  it.each(TIERS)('$level builds a block puzzle from every sentence', ({ level }) => {
    const sentences = concepts(level, 'sentence');
    for (const id of sentences) {
      const puzzle = buildSentencePuzzle({
        bundle: content,
        courseId: 'tr-en',
        conceptId: id,
        decoys: 2,
        decoyPool: sentences,
        rng: seededRng(1),
      });
      expect({ id, built: puzzle !== null }).toEqual({ id, built: true });
    }
  });

  it('ends every sentence with punctuation in both languages', () => {
    for (const { level } of TIERS) {
      for (const id of concepts(level, 'sentence')) {
        for (const code of ['en', 'tr'] as const) {
          const entry = getEntry(content, code, id)!;
          for (const text of [entry.text, ...(entry.alt ?? [])]) expect(text).toMatch(/[.?!]$/);
        }
      }
    }
  });

  it('stays outside the level ladder until the themed structure replaces it', () => {
    for (const { level } of TIERS) {
      expect(unitsFor(content, 'tr-en', 'adult', level).some((u) => u.theme)).toBe(false);
    }
    expect(placeableLevels(content, 'tr-en', 'adult')).toEqual(['A1', 'A2']);
  });
});
