import { shuffle, type Rng } from '@/features/quiz/rng';

export type MemoryCard = { conceptId: string };

export type MemoryState = {
  cards: MemoryCard[];
  /** Face-up cards that are not matched yet (at most two). */
  open: number[];
  matched: number[];
  /** Times two different cards were turned. */
  misses: number;
};

/** Two cards per concept, shuffled, all face down. */
export function startMemory(pairs: readonly string[], rng: Rng): MemoryState {
  const cards = shuffle(
    pairs.flatMap((conceptId) => [{ conceptId }, { conceptId }]),
    rng,
  );
  return { cards, open: [], matched: [], misses: 0 };
}

export type FlipResult = 'ignored' | 'open' | 'match' | 'mismatch';

/**
 * Turns a card. A second card either matches (both stay up) or not (both stay
 * up until `closeOpen`, so the child sees them). A third tap while a mismatch
 * shows closes it first.
 */
export function flipCard(
  state: MemoryState,
  index: number,
): { state: MemoryState; result: FlipResult } {
  const card = state.cards[index];
  if (!card || state.matched.includes(index) || state.open.includes(index)) {
    return { state, result: 'ignored' };
  }
  const base = state.open.length >= 2 ? closeOpen(state) : state;
  const open = [...base.open, index];
  if (open.length < 2) return { state: { ...base, open }, result: 'open' };
  const [a, b] = open;
  if (base.cards[a].conceptId === base.cards[b].conceptId) {
    return { state: { ...base, open: [], matched: [...base.matched, a, b] }, result: 'match' };
  }
  return { state: { ...base, open, misses: base.misses + 1 }, result: 'mismatch' };
}

/** Turns unmatched open cards face down again. */
export function closeOpen(state: MemoryState): MemoryState {
  return state.open.length === 0 ? state : { ...state, open: [] };
}

export function isMemoryDone(state: MemoryState): boolean {
  return state.matched.length === state.cards.length;
}

export function isFaceUp(state: MemoryState, index: number): boolean {
  return state.matched.includes(index) || state.open.includes(index);
}
