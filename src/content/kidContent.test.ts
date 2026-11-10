import { getLanguage } from '@/features/languages';
import { buildQuestion } from '@/features/quiz/generate';
import { seededRng } from '@/features/quiz/rng';

import { content } from './bundle';
import { conceptsOf, getEntry, unitsFor } from './query';

const LEVELS = ['L1', 'L2', 'L3'];
const lower = (s: string) => getLanguage('en').toLower(s);
const conceptsAt = (level: string) =>
  unitsFor(content, 'tr-en', 'kid', level).flatMap((u) => conceptsOf(content, u));

// Grammar glue that is not taught as a vocabulary card.
// "ms" is a title that goes with a name ("Ms. Brown"), like the name itself.
const GLUE = new Set([
  'a',
  'an',
  'the',
  'am',
  'is',
  'are',
  'in',
  'on',
  'to',
  'with',
  'not',
  'it',
  'ms',
]);

const tokens = (text: string) =>
  lower(text)
    .split(/[^\p{L}'-]+/u)
    .filter(Boolean);

describe('kid levels 1-3', () => {
  it.each(LEVELS)('%s has 20 sentences and at least 75 words', (level) => {
    const concepts = conceptsAt(level);
    expect(concepts.filter((c) => c.kind === 'sentence')).toHaveLength(20);
    expect(concepts.filter((c) => c.kind !== 'sentence').length).toBeGreaterThanOrEqual(75);
  });

  it('has about 250 words in total', () => {
    const words = LEVELS.flatMap(conceptsAt).filter((c) => c.kind !== 'sentence');
    expect(words.length).toBeGreaterThanOrEqual(240);
    expect(words.length).toBeLessThanOrEqual(270);
  });

  it('teaches each concept only once', () => {
    const ids = LEVELS.flatMap(conceptsAt).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses only words taught so far in its sentences', () => {
    const taught = new Set(GLUE);
    const unknown: string[] = [];
    for (const level of LEVELS) {
      const concepts = conceptsAt(level);
      for (const c of concepts.filter((x) => x.kind !== 'sentence')) {
        for (const t of tokens(getEntry(content, 'en', c.id)!.text)) taught.add(t);
      }
      for (const c of concepts.filter((x) => x.kind === 'sentence')) {
        for (const t of tokens(getEntry(content, 'en', c.id)!.text)) {
          // Third person and plural: "reads" → "read", "hands" → "hand".
          if (!taught.has(t) && !taught.has(t.replace(/s$/, ''))) unknown.push(`${c.id}: ${t}`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  it.each(LEVELS)('%s can ask a four-option question about every concept', (level) => {
    const concepts = conceptsAt(level);
    const distractorIds = concepts.map((c) => c.id);
    for (const c of concepts) {
      for (const direction of ['targetToNative', 'nativeToTarget'] as const) {
        const question = buildQuestion({
          bundle: content,
          courseId: 'tr-en',
          conceptId: c.id,
          direction,
          distractorIds,
          rng: seededRng(1),
        });
        expect(question?.options).toHaveLength(4);
      }
    }
  });

  it('ends every sentence with punctuation in both languages', () => {
    for (const c of LEVELS.flatMap(conceptsAt).filter((x) => x.kind === 'sentence')) {
      for (const code of ['en', 'tr'] as const) {
        const entry = getEntry(content, code, c.id)!;
        for (const text of [entry.text, ...(entry.alt ?? [])]) expect(text).toMatch(/[.?!]$/);
      }
    }
  });
});
