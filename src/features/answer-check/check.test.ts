import { getLanguage } from '@/features/languages';

import { checkAnswer, editDistance, typoAllowance } from './check';

const tr = getLanguage('tr');
const en = getLanguage('en');

describe('editDistance', () => {
  it.each([
    ['', '', 0],
    ['apple', 'apple', 0],
    ['apple', 'aple', 1],
    ['apple', 'appel', 1], // swap
    ['apple', 'apples', 1],
    ['kitten', 'sitting', 3],
    ['üzüm', 'üzum', 1],
  ])('%s → %s = %i', (a, b, d) => {
    expect(editDistance(a, b)).toBe(d);
  });
});

describe('typoAllowance', () => {
  it('is strict for short words and more lenient for long ones', () => {
    expect(typoAllowance(3)).toBe(0);
    expect(typoAllowance(4)).toBe(0);
    expect(typoAllowance(5)).toBe(1);
    expect(typoAllowance(9)).toBe(2);
  });
});

describe('checkAnswer', () => {
  it('accepts the answer regardless of case, punctuation and spacing', () => {
    expect(checkAnswer(tr, '  Elma! ', ['elma'])).toEqual({ verdict: 'correct', expected: 'elma' });
    expect(checkAnswer(en, 'APPLE.', ['apple'])).toEqual({ verdict: 'correct', expected: 'apple' });
  });

  it('accepts alternatives and reports which one matched', () => {
    expect(checkAnswer(tr, 'gönülsüz', ['isteksiz', 'gönülsüz'])).toEqual({
      verdict: 'correct',
      expected: 'gönülsüz',
    });
  });

  it('ignores a leading English article either way', () => {
    expect(checkAnswer(en, 'an apple', ['apple']).verdict).toBe('correct');
    expect(checkAnswer(en, 'apple', ['an apple']).verdict).toBe('correct');
    expect(checkAnswer(en, 'the cat', ['cat']).verdict).toBe('correct');
    // Turkish has no articles: "bir elma" is not "elma".
    expect(checkAnswer(tr, 'bir elma', ['elma']).verdict).not.toBe('correct');
  });

  it('uses Turkish case rules', () => {
    expect(checkAnswer(tr, 'İSTANBUL', ['İstanbul']).verdict).toBe('correct');
    expect(checkAnswer(tr, 'ILIK', ['ılık']).verdict).toBe('correct');
  });

  it('flags answers typed without Turkish letters as near misses', () => {
    expect(checkAnswer(tr, 'kisi', ['kişi'])).toEqual({ verdict: 'nearMiss', expected: 'kişi' });
    expect(checkAnswer(tr, 'uzum', ['üzüm']).verdict).toBe('nearMiss');
    expect(checkAnswer(tr, 'gonulsuz', ['isteksiz', 'gönülsüz'])).toEqual({
      verdict: 'nearMiss',
      expected: 'gönülsüz',
    });
  });

  it('flags small slips in longer answers as typos', () => {
    expect(checkAnswer(en, 'aple', ['apple'])).toEqual({ verdict: 'typo', expected: 'apple' });
    expect(checkAnswer(en, 'relutcant', ['reluctant']).verdict).toBe('typo');
    expect(checkAnswer(en, 'watrmelon', ['watermelon']).verdict).toBe('typo');
    // A missing ş does not use up the allowance: still one slip.
    expect(checkAnswer(tr, 'kelebk', ['kelebek']).verdict).toBe('typo');
    expect(checkAnswer(tr, 'isteksz', ['isteksiz']).verdict).toBe('typo');
  });

  it('is strict for short words', () => {
    expect(checkAnswer(en, 'bat', ['cat']).verdict).toBe('wrong');
    expect(checkAnswer(en, 'pea', ['pear']).verdict).toBe('wrong');
  });

  it('never calls a different real word a typo', () => {
    const known = new Set(['house', 'horse']);
    expect(checkAnswer(en, 'horse', ['house'], known)).toEqual({
      verdict: 'wrong',
      expected: 'house',
    });
    expect(checkAnswer(en, 'housr', ['house'], known).verdict).toBe('typo');
  });

  it('rejects empty and unrelated answers', () => {
    expect(checkAnswer(tr, '   ', ['elma'])).toEqual({ verdict: 'wrong', expected: 'elma' });
    expect(checkAnswer(tr, 'armut', ['elma']).verdict).toBe('wrong');
    expect(checkAnswer(en, 'a', ['apple']).verdict).toBe('wrong');
    expect(checkAnswer(tr, 'elma', []).verdict).toBe('wrong');
  });

  it('checks whole sentences', () => {
    const accepted = [
      'Partiden erken ayrılmaya isteksizdi.',
      'Partiden erken ayrılmak istemiyordu.',
    ];
    expect(checkAnswer(tr, 'partiden erken ayrılmak istemiyordu', accepted).verdict).toBe(
      'correct',
    );
    expect(checkAnswer(tr, 'Partiden erken ayrilmaya isteksizdi', accepted).verdict).toBe(
      'nearMiss',
    );
    expect(checkAnswer(tr, 'Partiden erken ayrılmya isteksizdi', accepted).verdict).toBe('typo');
  });
});
