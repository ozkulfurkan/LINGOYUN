import { content } from './bundle';
import { conceptsOf, findConcept, getEntry, unitsFor } from './query';

describe('content queries', () => {
  it('finds concepts and entries in both languages', () => {
    expect(findConcept(content, 'fruit.apple')?.image).toBe('fruit.apple');
    expect(getEntry(content, 'en', 'fruit.apple')?.text).toBe('apple');
    expect(getEntry(content, 'tr', 'fruit.apple')?.text).toBe('elma');
  });

  it('reads sentences from the sentences file', () => {
    expect(getEntry(content, 'en', 'emotion.reluctant_leave')?.text).toMatch(/reluctant to leave/);
  });

  it('returns undefined for unknown ids', () => {
    expect(getEntry(content, 'en', 'fruit.kiwi')).toBeUndefined();
  });

  it('lists units by profile type and level', () => {
    expect(unitsFor(content, 'tr-en', 'mini').map((u) => u.id)).toEqual(['mini.fruits']);
    expect(unitsFor(content, 'tr-en', 'kid', 'L1').map((u) => u.id)).toEqual(['kid.l1.fruits']);
    expect(unitsFor(content, 'tr-en', 'kid', 'L2')).toEqual([]);
    expect(unitsFor(content, 'tr-en', 'adult', 'B1')).toHaveLength(1);
  });

  it('resolves a unit to concepts in order', () => {
    const [unit] = unitsFor(content, 'tr-en', 'mini');
    expect(conceptsOf(content, unit).map((c) => c.id)).toEqual([
      'fruit.apple',
      'fruit.pear',
      'fruit.cherry',
      'fruit.grapes',
    ]);
  });
});
