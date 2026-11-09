import { getLanguage } from '@/features/languages';
import { buildQuestion } from '@/features/quiz/generate';
import { seededRng } from '@/features/quiz/rng';

import { content } from './bundle';
import { conceptsOf, getEntry, unitsFor } from './query';

const LEVELS = ['A1', 'A2'];
const lower = (s: string) => getLanguage('en').toLower(s);
const conceptsAt = (level: string) =>
  unitsFor(content, 'tr-en', 'adult', level).flatMap((u) => conceptsOf(content, u));
const isVocabulary = (kind: string) => kind === 'word' || kind === 'phrase';

// Grammar glue that is not taught as a vocabulary card.
const GLUE = new Set(
  `a an the am is are was were be do does did not can cannot could will would should must to of in
  on at by for from with about than more most too many me o'clock going`.split(/\s+/),
);

// Inflected forms the suffix rule below cannot reduce to the taught word.
const IRREGULAR: Record<string, string> = {
  has: 'have',
  went: 'go',
  ate: 'eat',
  bought: 'buy',
  forgot: 'forget',
  took: 'take',
  sold: 'sell',
  children: 'child',
  best: 'good',
  bigger: 'big',
};

const tokens = (text: string) =>
  lower(text)
    .split(/[^\p{L}'-]+/u)
    .filter(Boolean);

/** Plural, third person, past, -ing and comparative: "works" → "work", "nearest" → "near". */
function isTaught(token: string, taught: Set<string>): boolean {
  if (taught.has(token) || taught.has(IRREGULAR[token] ?? '')) return true;
  const stems = [/s$/, /es$/, /ed$/, /d$/, /ing$/, /er$/, /est$/].map((suffix) =>
    token.replace(suffix, ''),
  );
  return stems.some((stem) => stem !== token && (taught.has(stem) || taught.has(`${stem}e`)));
}

describe('adult levels A1-A2', () => {
  it('has about 600 words, 150 sentences and 30 idioms', () => {
    const all = LEVELS.flatMap(conceptsAt);
    const words = all.filter((c) => isVocabulary(c.kind));
    expect(words.length).toBeGreaterThanOrEqual(600);
    expect(words.length).toBeLessThanOrEqual(700);
    expect(all.filter((c) => c.kind === 'sentence')).toHaveLength(150);
    // Four of the original thirty idioms moved up to B1.
    expect(all.filter((c) => c.kind === 'idiom')).toHaveLength(26);
  });

  it.each(LEVELS)('%s has words, sentences and idioms', (level) => {
    const concepts = conceptsAt(level);
    expect(concepts.filter((c) => isVocabulary(c.kind)).length).toBeGreaterThanOrEqual(250);
    expect(concepts.filter((c) => c.kind === 'sentence').length).toBeGreaterThanOrEqual(70);
    expect(concepts.filter((c) => c.kind === 'idiom').length).toBeGreaterThanOrEqual(10);
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
      for (const c of concepts.filter((x) => isVocabulary(x.kind))) {
        const entry = getEntry(content, 'en', c.id)!;
        for (const text of [entry.text, ...(entry.alt ?? [])]) {
          for (const t of tokens(text)) taught.add(t);
        }
      }
      for (const c of concepts.filter((x) => x.kind === 'sentence')) {
        for (const t of tokens(getEntry(content, 'en', c.id)!.text)) {
          if (!isTaught(t, taught)) unknown.push(`${c.id}: ${t}`);
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
