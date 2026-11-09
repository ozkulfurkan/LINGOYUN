import { content } from '@/content/bundle';
import { validateContent } from '@/content';
import { buildQuestion } from '@/features/quiz/generate';
import { seededRng } from '@/features/quiz/rng';

import { expressionConcepts, startRound } from './round';

const pool = expressionConcepts(content, 'tr-en');

describe('expressions mode', () => {
  it('collects every idiom and false friend of the adult course', () => {
    const kinds = pool.map((id) => content.concepts.find((c) => c.id === id)!);
    expect(kinds.filter((c) => c.kind === 'idiom')).toHaveLength(30);
    expect(kinds.filter((c) => c.tags?.includes('false-friend')).length).toBeGreaterThanOrEqual(15);
    expect(kinds.every((c) => c.kind === 'idiom' || c.tags?.includes('false-friend'))).toBe(true);
  });

  it('always offers a false friend’s look-alike, and explains it', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const q = buildQuestion({
        bundle: content,
        courseId: 'tr-en',
        conceptId: 'false_friend.magazine',
        direction: 'targetToNative',
        distractorIds: pool,
        rng: seededRng(seed),
      })!;
      expect(q.prompt).toBe('magazine');
      expect(q.options.map((o) => o.text)).toContain('mağaza');
      expect(q.options[q.correctIndex].text).toBe('dergi');
      expect(q.note).toMatch(/store/);
    }
  });

  it('asks English → Turkish only', () => {
    const round = startRound({
      bundle: content,
      courseId: 'tr-en',
      deck: {},
      today: 1,
      levelConcepts: pool,
      directions: 'targetToNative',
      rng: seededRng(3),
    });
    expect(round.questions.length).toBeGreaterThan(0);
    expect(round.questions.every((q) => q.promptLang === 'en' && q.answerLang === 'tr')).toBe(true);
  });

  it('rejects a trap that is also a right answer', () => {
    const bundle = structuredClone(content);
    bundle.languages.tr.words['false_friend.magazine'].trap = 'dergi';
    const errors = validateContent(bundle).filter((i) => i.severity === 'error');
    expect(errors.map((e) => e.message)).toContain('trap is also an accepted answer');
  });
});
