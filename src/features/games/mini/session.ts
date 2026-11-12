import { planConcepts } from '@/features/games/multiple-choice/round';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Deck, Grade } from '@/features/srs';

import type { MiniWorld } from './worlds';

/**
 * listen: hear a word, tap its picture among 4.
 * read: see a picture, find its written word among 4; a tap reads a word out,
 *   a second tap on the same word answers.
 * basket: hear a word, drag (or tap) its picture into the basket among 3.
 * memory: turn cards to find 3 pairs; each card says its word.
 *
 * `intro` marks the first activity of its kind in a session: only then is
 * the instruction ("Which one?") spoken; later ones say just the word.
 */
export type MiniActivity =
  | { kind: 'listen' | 'read' | 'basket'; target: string; options: string[]; intro: boolean }
  | { kind: 'memory'; pairs: string[]; intro: boolean };

/** kids-ux: about 8–10 activities, five minutes. */
export const SESSION_PLAN: readonly MiniActivity['kind'][] = [
  'listen',
  'read',
  'basket',
  'listen',
  'memory',
  'read',
  'basket',
  'listen',
];
export const OPTION_COUNT = { listen: 4, read: 4, basket: 3 } as const;
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
  const seen = new Set<MiniActivity['kind']>();
  let next = 0;
  return SESSION_PLAN.map((kind): MiniActivity => {
    const intro = !seen.has(kind);
    seen.add(kind);
    if (kind === 'memory') {
      const known = [...new Set(asked)];
      const extra = shuffle(
        concepts.filter((id) => !known.includes(id)),
        rng,
      );
      return { kind, intro, pairs: [...shuffle(known, rng), ...extra].slice(0, MEMORY_PAIRS) };
    }
    const target = queue[next % queue.length];
    next += 1;
    asked.push(target);
    const others = shuffle(
      concepts.filter((id) => id !== target),
      rng,
    ).slice(0, OPTION_COUNT[kind] - 1);
    return { kind, intro, target, options: shuffle([target, ...others], rng) };
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

/**
 * "read": the first tap on a word selects it (and the screen reads it out);
 * a tap on the word already selected is the answer.
 */
export function tapWord(
  selected: string | null,
  picked: string,
): { kind: 'select'; selected: string } | { kind: 'answer'; picked: string } {
  return selected === picked ? { kind: 'answer', picked } : { kind: 'select', selected: picked };
}
