import { content } from '@/content/bundle';
import { seededRng } from '@/features/quiz/rng';
import { recordAnswer } from '@/features/srs';
import type { Access } from '@/features/subscription';

import { miniCanStart } from './access';
import { closeOpen, flipCard, isFaceUp, isMemoryDone, startMemory } from './memory';
import {
  buildMiniSession,
  choiceGrade,
  OPTION_COUNT,
  pickChoice,
  SESSION_PLAN,
  showHint,
  tapWord,
  START_CHOICE,
} from './session';
import { findWorld, miniWorlds } from './worlds';

const worlds = miniWorlds(content, 'tr-en');
const animals = findWorld(content, 'tr-en', 'animals')!;
const images = new Map(content.concepts.map((c) => [c.id, c.image]));

describe('miniWorlds', () => {
  it('has the six worlds of 50 words in course order, each with a cover picture', () => {
    expect(worlds.map((w) => w.id)).toEqual([
      'animals',
      'food',
      'colors',
      'body',
      'home',
      'nature',
    ]);
    for (const w of worlds) {
      expect(w.concepts).toHaveLength(50);
      expect(w.cover).toBe(images.get(w.concepts[0]));
    }
    expect(findWorld(content, 'tr-en', 'space')).toBeUndefined();
  });
});

describe('buildMiniSession', () => {
  const session = (seed = 1, deck = {}) =>
    buildMiniSession({ world: animals, deck, today: 100, rng: seededRng(seed) });

  it('follows the session plan', () => {
    expect(session().map((a) => a.kind)).toEqual(SESSION_PLAN);
  });

  it('has two find-the-word activities among eight', () => {
    expect(SESSION_PLAN).toHaveLength(8);
    expect(SESSION_PLAN.filter((k) => k === 'read')).toHaveLength(2);
  });

  it('marks only the first activity of each kind for its spoken instruction', () => {
    const firsts = new Set<string>();
    for (const a of session()) {
      expect(a.intro).toBe(!firsts.has(a.kind));
      firsts.add(a.kind);
    }
  });

  it('offers the target among distinct pictures of the same world', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const a of session(seed)) {
        if (a.kind === 'memory') continue;
        expect(a.options).toHaveLength(OPTION_COUNT[a.kind]);
        expect(a.options).toContain(a.target);
        expect(new Set(a.options).size).toBe(a.options.length);
        expect(a.options.every((id) => animals.concepts.includes(id))).toBe(true);
      }
    }
  });

  it('asks new words in course order and different words across the session', () => {
    const targets = session().flatMap((a) => (a.kind === 'memory' ? [] : [a.target]));
    expect(new Set(targets).size).toBe(targets.length);
    expect([...targets].sort()).toEqual(animals.concepts.slice(0, targets.length).sort());
  });

  it('asks due words first', () => {
    const due = animals.concepts[40];
    const targets = session(1, recordAnswer({}, due, 'again', 100)).flatMap((a) =>
      a.kind === 'memory' ? [] : [a.target],
    );
    expect(targets).toContain(due);
  });

  it('builds memory pairs from words already met in the session', () => {
    const s = session(3);
    const memoryIndex = s.findIndex((a) => a.kind === 'memory');
    const before = s.slice(0, memoryIndex).flatMap((a) => (a.kind === 'memory' ? [] : [a.target]));
    const memory = s[memoryIndex];
    if (memory.kind !== 'memory') throw new Error('no memory');
    expect(memory.pairs).toHaveLength(3);
    expect(memory.pairs.every((id) => before.includes(id))).toBe(true);
  });

  it('is empty for a world too small to play', () => {
    const tiny = { ...animals, concepts: animals.concepts.slice(0, 3) };
    expect(buildMiniSession({ world: tiny, deck: {}, today: 1, rng: seededRng(1) })).toEqual([]);
  });
});

describe('choices', () => {
  const target = 'animal.cat';

  it('solves on the right picture, first time = good', () => {
    const { state, right } = pickChoice(START_CHOICE, target, target);
    expect(right).toBe(true);
    expect(choiceGrade(state)).toBe('good');
    expect(pickChoice(state, target, target).right).toBe(false); // already solved
  });

  it('hints after two different misses and grades by misses', () => {
    let s = pickChoice(START_CHOICE, target, 'animal.dog').state;
    expect(showHint(s)).toBe(false);
    s = pickChoice(s, target, 'animal.dog').state; // same miss twice counts once
    expect(showHint(s)).toBe(false);
    expect(choiceGrade(pickChoice(s, target, target).state)).toBe('hard');
    s = pickChoice(s, target, 'animal.bird').state;
    expect(showHint(s)).toBe(true);
    s = pickChoice(s, target, target).state;
    expect(showHint(s)).toBe(false);
    expect(choiceGrade(s)).toBe('again');
  });
});

describe('memory cards', () => {
  const pairs = ['animal.cat', 'animal.dog', 'animal.cow'];
  const start = () => startMemory(pairs, seededRng(5));
  const indexesOf = (state: ReturnType<typeof start>, id: string) =>
    state.cards.flatMap((c, i) => (c.conceptId === id ? [i] : []));

  it('deals two of each card', () => {
    const s = start();
    expect(s.cards).toHaveLength(6);
    for (const id of pairs) expect(indexesOf(s, id)).toHaveLength(2);
  });

  it('keeps a matching pair face up', () => {
    let s = start();
    const [a, b] = indexesOf(s, 'animal.cat');
    s = flipCard(s, a).state;
    const { state, result } = flipCard(s, b);
    expect(result).toBe('match');
    expect(isFaceUp(state, a) && isFaceUp(state, b)).toBe(true);
    expect(flipCard(state, a).result).toBe('ignored');
  });

  it('shows a mismatch until closed, and counts it', () => {
    let s = start();
    const [cat] = indexesOf(s, 'animal.cat');
    const [dog] = indexesOf(s, 'animal.dog');
    s = flipCard(s, cat).state;
    const { state, result } = flipCard(s, dog);
    expect(result).toBe('mismatch');
    expect(state.misses).toBe(1);
    expect(isFaceUp(state, cat)).toBe(true);
    expect(isFaceUp(closeOpen(state), cat)).toBe(false);
    // A third tap closes the mismatch and opens the new card.
    const [cow] = indexesOf(state, 'animal.cow');
    const third = flipCard(state, cow).state;
    expect(third.open).toEqual([cow]);
  });

  it('finishes when every pair is found', () => {
    let s = start();
    for (const id of pairs) {
      const [a, b] = indexesOf(s, id);
      s = flipCard(flipCard(s, a).state, b).state;
    }
    expect(isMemoryDone(s)).toBe(true);
  });
});

describe('miniCanStart', () => {
  const none: Access = { kind: 'notStarted' };
  const ended: Access = { kind: 'trialEnded', endedAt: 1 };
  const trial: Access = { kind: 'trial', endsAt: 2, daysLeft: 3, endingSoon: false };

  it('lets the first session be played for free, then needs access', () => {
    expect(miniCanStart(none, 0)).toBe(true);
    expect(miniCanStart(none, 1)).toBe(false);
    expect(miniCanStart(ended, 4)).toBe(false);
    expect(miniCanStart(trial, 4)).toBe(true);
  });
});

describe('tapWord', () => {
  it('selects on the first tap and answers on a second tap on the same word', () => {
    expect(tapWord(null, 'cat')).toEqual({ kind: 'select', selected: 'cat' });
    expect(tapWord('cat', 'dog')).toEqual({ kind: 'select', selected: 'dog' });
    expect(tapWord('cat', 'cat')).toEqual({ kind: 'answer', picked: 'cat' });
  });
});
