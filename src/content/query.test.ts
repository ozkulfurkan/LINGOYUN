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
    expect(unitsFor(content, 'tr-en', 'mini').map((u) => u.id)).toEqual([
      'mini.animals',
      'mini.food',
      'mini.colors',
      'mini.body',
      'mini.home',
      'mini.nature',
    ]);
    expect(unitsFor(content, 'tr-en', 'kid', 'L1').map((u) => u.id)).toEqual(['kid.l1.fruits']);
    expect(unitsFor(content, 'tr-en', 'kid', 'L2')).toEqual([]);
    expect(unitsFor(content, 'tr-en', 'adult', 'B1')).toHaveLength(1);
  });

  it('resolves a unit to concepts in order', () => {
    const food = unitsFor(content, 'tr-en', 'mini').find((u) => u.id === 'mini.food')!;
    expect(
      conceptsOf(content, food)
        .slice(0, 4)
        .map((c) => c.id),
    ).toEqual(['fruit.apple', 'fruit.pear', 'fruit.cherry', 'fruit.grapes']);
  });

  it('has 300 picture words in six worlds of 50 for mini', () => {
    const worlds = unitsFor(content, 'tr-en', 'mini');
    expect(worlds.map((u) => u.concepts.length)).toEqual([50, 50, 50, 50, 50, 50]);
    const all = worlds.flatMap((u) => conceptsOf(content, u));
    expect(new Set(all.map((c) => c.id)).size).toBe(300);
    expect(all.every((c) => c.image && c.kind === 'word')).toBe(true);
  });
});
