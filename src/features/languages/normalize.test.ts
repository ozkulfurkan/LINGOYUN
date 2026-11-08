import { foldAnswer, isNearMiss, normalizeAnswer } from './normalize';
import { getLanguage } from './registry';

const tr = getLanguage('tr');
const en = getLanguage('en');

describe('normalizeAnswer', () => {
  it('ignores case, punctuation and extra spaces', () => {
    expect(normalizeAnswer(en, '  Hello,   World! ')).toBe('hello world');
    expect(normalizeAnswer(en, "Don't")).toBe('dont');
    expect(normalizeAnswer(tr, 'Günaydın!')).toBe('günaydın');
  });

  it('applies Turkish case rules', () => {
    expect(normalizeAnswer(tr, 'İSTANBUL')).toBe('istanbul');
    // Uppercase dotless I is ı in Turkish, so this is a different word…
    expect(normalizeAnswer(tr, 'ISTANBUL')).toBe('ıstanbul');
  });

  it('treats composed and decomposed letters the same', () => {
    expect(normalizeAnswer(tr, 'gül')).toBe(normalizeAnswer(tr, 'gül'));
  });
});

describe('foldAnswer', () => {
  it('folds Turkish special letters', () => {
    expect(foldAnswer(tr, 'Çiçek ağacı üşüdü')).toBe('cicek agaci usudu');
  });

  it('leaves English untouched apart from normalizing', () => {
    expect(foldAnswer(en, 'Café')).toBe('café');
  });
});

describe('isNearMiss', () => {
  it('flags answers typed without Turkish letters', () => {
    expect(isNearMiss(tr, 'kisi', 'kişi')).toBe(true);
    expect(isNearMiss(tr, 'cicek', 'çiçek')).toBe(true);
    // …but still a near miss of "istanbul", so the learner gets a hint.
    expect(isNearMiss(tr, 'ISTANBUL', 'İstanbul')).toBe(true);
  });

  it('does not flag exact or unrelated answers', () => {
    expect(isNearMiss(tr, 'Kişi', 'kişi')).toBe(false);
    expect(isNearMiss(tr, 'elma', 'armut')).toBe(false);
    expect(isNearMiss(en, 'apple', 'aple')).toBe(false);
  });
});
