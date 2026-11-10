import { content } from '@/content/bundle';
import { buildSentencePuzzle, checkSentence, placeBlock } from '@/features/games/sentence-builder';
import { seededRng } from '@/features/quiz/rng';

import { acceptedAnswers } from './accepted';
import { splitAroundItems, withFreeOrders } from './freeOrder';

const LIST = 'We need eggs, milk and bread.';

describe('splitAroundItems', () => {
  it('cuts the text around the items, in order', () => {
    expect(splitAroundItems(LIST, ['eggs', 'milk', 'bread'])).toEqual([
      'We need ',
      ', ',
      ' and ',
      '.',
    ]);
  });

  it('needs whole words in the given order', () => {
    expect(splitAroundItems(LIST, ['egg', 'milk'])).toBeNull();
    expect(splitAroundItems(LIST, ['milk', 'eggs'])).toBeNull();
  });
});

describe('withFreeOrders', () => {
  it('adds every order of the items, the given texts first', () => {
    const all = withFreeOrders([LIST], ['eggs', 'milk', 'bread']);
    expect(all).toHaveLength(6);
    expect(all[0]).toBe(LIST);
    expect(all).toContain('We need bread, eggs and milk.');
  });

  it('expands each alternative that has the items and keeps the others', () => {
    const other = 'Eggs, milk and bread are needed.';
    const all = withFreeOrders([LIST, other, 'We need food.'], ['eggs', 'milk', 'bread']);
    expect(all).toContain('We need food.');
    // "Eggs" is capitalized here, so the lower-case items do not match it.
    expect(all).not.toContain('Bread, milk and eggs are needed.');
    expect(all.filter((t) => t.startsWith('We need ') && t !== 'We need food.')).toHaveLength(6);
  });

  it('changes nothing without items, with one item or with too many', () => {
    expect(withFreeOrders([LIST], undefined)).toEqual([LIST]);
    expect(withFreeOrders([LIST], ['eggs'])).toEqual([LIST]);
    expect(withFreeOrders([LIST], ['a', 'b', 'c', 'd', 'e', 'f'])).toEqual([LIST]);
  });
});

describe('free order in the content', () => {
  it('accepts the shopping list in any order when typed', () => {
    expect(acceptedAnswers(content, 'en', 'food.s2_shopping_list')).toContain(
      'We need cheese, bread, milk and eggs from the market.',
    );
  });

  it('accepts another order of the list when built from blocks', () => {
    let puzzle = buildSentencePuzzle({
      bundle: content,
      courseId: 'tr-en',
      conceptId: 'food.s2_shopping_list',
      rng: seededRng(3),
    })!;
    const order = 'We need milk, eggs, bread and cheese from the market'.split(' ');
    for (const word of order) {
      const block = puzzle.blocks.find((b) => b.word === word && !puzzle.placed.includes(b.id))!;
      puzzle = placeBlock(puzzle, block.id);
    }
    expect(checkSentence(puzzle).result).toBe('right');
  });
});
