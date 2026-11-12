import { planConcepts } from '@/features/games/multiple-choice/round';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Deck, Grade } from '@/features/srs';

import type { MiniWorld } from './worlds';

/**
 * listen: hear a word, tap its picture among 4.
 * basket: hear a word, drag (or tap) its picture into the basket among 3.
 * memory: turn cards to find 3 pairs; each card says its word.
 */
export type MiniActivity =
  | { kind: 'listen' | 'basket'; target: string; options: string[] }
  | { kind: 'memory'; pairs: string[] };

/** kids-ux: about 8–10 activities, five minutes. */
export const SESSION_PLAN: readonly MiniActivity['kind'][] = [
  'listen',
  'listen',
  'basket',
  'listen',
  'memory',
  'listen',
  'basket',
  'listen',
];
export const OPTION_COUNT = { listen: 4, basket: 3 } as const;
export const MEMORY_PAIRS = 3;

type BuildInput = { world: MiniWorld; deck: Deck; today: number; rng: Rng };

/**
 * A session in one world. Words to ask come in spaced-repetition order (due,
 * then new, then weakest); wrong options are other words of the same world.
 * Memory pairs use words already asked in the session, so children meet them
 * again.
 */
export function buildMiniSession({ world, deck, today, rng }: BuildInput): MiniActivity[] {
  const { concepts } = world;
  const asks = SESSION_PLAN.filter((k) => k !== 'memory').length;
  const queue = planConcepts(deck, today, concepts).slice(0, asks);
  if (concepts.length < OPTION_COUNT.listen || queue.length === 0) return [];

  const asked: string[] = [];
  let next = 0;
  return SESSION_PLAN.map((kind): MiniActivity => {
    if (kind === 'memory') {
      const known = [...new Set(asked)];
      const extra = shuffle(
        concepts.filter((id) => !known.includes(id)),
        rng,
      );
      return { kind, pairs: [...shuffle(known, rng), ...extra].slice(0, MEMORY_PAIRS) };
    }
    const target = queue[next % queue.length];
    next += 1;
    asked.push(target);
    const others = shuffle(
      concepts.filter((id) => id !== target),
      rng,
    ).slice(0, OPTION_COUNT[kind] - 1);
    return { kind, target, options: shuffle([target, ...others], rng) };
  });
}

/** Tries on one listen/basket activity. */
export type ChoiceState = { wrong: string[]; solved: boolean };

export const START_CHOICE: ChoiceState = { wrong: [], solved: false };
/** kids-ux: after two misses the right picture glows. */
export const HINT_AFTER_MISSES = 2;

export function pickChoice(
  state: ChoiceState,
  target: string,
  picked: string,
): { state: ChoiceState; right: boolean } {
  if (state.solved) return { state, right: false };
  if (picked === target) return { state: { ...state, solved: true }, right: true };
  const wrong = state.wrong.includes(picked) ? state.wrong : [...state.wrong, picked];
  return { state: { ...state, wrong }, right: false };
}

export function showHint(state: ChoiceState): boolean {
  return !state.solved && state.wrong.length >= HINT_AFTER_MISSES;
}

/** Right first time: good. One miss: hard. With the hint: again (it comes back soon). */
export function choiceGrade(state: ChoiceState): Grade {
  if (state.wrong.length === 0) return 'good';
  return state.wrong.length < HINT_AFTER_MISSES ? 'hard' : 'again';
}
