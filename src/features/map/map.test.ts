import { content } from '@/content/bundle';
import type { ContentBundle } from '@/content/types';
import { recordAnswer, type Deck } from '@/features/srs';

import { MIN_LEVEL_CONCEPTS } from '@/features/placement/session';

import { LEVEL_DONE_MASTERY, levelConcepts, levelNodes, levelUpTarget, riverLayout } from './map';

/** A deck where the given concepts sit in box `box`. */
function deckWith(ids: string[], box: number): Deck {
  let deck: Deck = {};
  for (const id of ids) for (let i = 0; i < box; i++) deck = recordAnswer(deck, id, 'good', i * 30);
  return deck;
}

const L1 = levelConcepts(content, 'tr-en', 'kid', 'L1');

describe('levelNodes', () => {
  it('lists every level with done, current and locked states', () => {
    const nodes = levelNodes(content, 'tr-en', 'kid', {}, 'L3');
    expect(nodes.map((n) => n.level)).toEqual([
      'L1',
      'L2',
      'L3',
      'L4',
      'L5',
      'L6',
      'L7',
      'L8',
      'L9',
      'L10',
    ]);
    expect(nodes.map((n) => n.state).slice(0, 4)).toEqual(['done', 'done', 'current', 'locked']);
    expect(nodes[0].conceptCount).toBe(L1.length);
    expect(nodes[9].conceptCount).toBe(0); // no content written yet
  });

  it('reports mastery per level', () => {
    const half = L1.slice(0, Math.ceil(L1.length / 2));
    const [l1] = levelNodes(content, 'tr-en', 'kid', deckWith(half, 3), 'L1');
    expect(l1.mastery).toBeCloseTo(half.length / L1.length);
  });
});

describe('levelUpTarget', () => {
  it('moves up once the level is mastered', () => {
    const enough = L1.slice(0, Math.ceil(L1.length * LEVEL_DONE_MASTERY));
    expect(levelUpTarget(content, 'tr-en', 'kid', deckWith(enough, 3), 'L1')).toBe('L2');
  });

  it('waits while the level is not mastered', () => {
    const notEnough = L1.slice(0, Math.ceil(L1.length * LEVEL_DONE_MASTERY) - 1);
    expect(levelUpTarget(content, 'tr-en', 'kid', deckWith(notEnough, 3), 'L1')).toBeNull();
    // Box 2 is not "learned" yet.
    expect(levelUpTarget(content, 'tr-en', 'kid', deckWith(L1, 2), 'L1')).toBeNull();
  });

  it('does not move up to a level with only a few sample concepts', () => {
    // B1 holds two early sample concepts: far below what a level needs.
    const b1 = levelConcepts(content, 'tr-en', 'adult', 'B1');
    expect(b1.length).toBeGreaterThan(0);
    expect(b1.length).toBeLessThan(MIN_LEVEL_CONCEPTS);
    const a2 = levelConcepts(content, 'tr-en', 'adult', 'A2');
    expect(levelUpTarget(content, 'tr-en', 'adult', deckWith(a2, 3), 'A2')).toBeNull();
    const nodes = levelNodes(content, 'tr-en', 'adult', {}, 'A2');
    expect(nodes.find((n) => n.level === 'B1')?.playable).toBe(false);
    expect(nodes.find((n) => n.level === 'A2')?.playable).toBe(true);
  });

  it('moves up as soon as the next level has enough content', () => {
    const a2 = levelConcepts(content, 'tr-en', 'adult', 'A2');
    const filler = Array.from({ length: MIN_LEVEL_CONCEPTS }, (_, i) => `x.c${i}`);
    const bundle: ContentBundle = {
      ...content,
      courses: [
        {
          id: 'tr-en',
          units: [
            ...content.courses[0].units,
            { id: 'adult.b1.more', profileType: 'adult', level: 'B1', concepts: filler },
          ],
        },
      ],
    };
    expect(levelUpTarget(bundle, 'tr-en', 'adult', deckWith(a2, 3), 'A2')).toBe('B1');
  });

  it('does not move to a level without content or past the top', () => {
    const L3 = levelConcepts(content, 'tr-en', 'kid', 'L3');
    expect(levelConcepts(content, 'tr-en', 'kid', 'L4')).toEqual([]);
    expect(levelUpTarget(content, 'tr-en', 'kid', deckWith(L3, 3), 'L3')).toBeNull();
    expect(levelUpTarget(content, 'tr-en', 'adult', {}, 'C1')).toBeNull();
    expect(levelUpTarget(content, 'tr-en', 'adult', {}, 'Z9')).toBeNull();
  });
});

describe('riverLayout', () => {
  it('places stops top to bottom, swinging left and right', () => {
    const { points, height, path } = riverLayout(3, { width: 300, step: 100, padding: 60 });
    expect(points).toEqual([
      { x: 84, y: 60 },
      { x: 216, y: 160 },
      { x: 84, y: 260 },
    ]);
    expect(height).toBe(320);
    expect(path.startsWith('M 84 0 C')).toBe(true);
    expect(path.endsWith('84 320')).toBe(true);
    // One curve per gap: top → stop 1 → stop 2 → stop 3 → bottom.
    expect(path.match(/C/g)).toHaveLength(4);
  });

  it('handles an empty map', () => {
    expect(riverLayout(0, { width: 300, step: 100, padding: 60 })).toEqual({
      points: [],
      path: '',
      height: 0,
    });
  });
});
