import { findConcept, getEntry, type ContentBundle } from '@/content';
import { findCourse, getLanguage, type CourseId, type LanguageCode } from '@/features/languages';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Grade } from '@/features/srs';

/** Words with fewer letters are too easy, more do not fit a phone row twice. */
export const MIN_LETTERS = 2;
export const MAX_LETTERS = 10;
/** Failed attempts after which the next right letter is hinted (kids-ux). */
export const HINT_AFTER_ATTEMPTS = 2;

export type Tile = { id: number; letter: string };

/** A letter slot takes a tile; a fixed slot shows a space, hyphen or apostrophe. */
export type Slot =
  { kind: 'letter'; letter: string; tileId: number | null } | { kind: 'fixed'; char: string };

export type Puzzle = {
  conceptId: string;
  /** Shown in the native language, e.g. "elma". */
  prompt: string;
  promptLang: LanguageCode;
  answerLang: LanguageCode;
  /** The word to build, lower-cased in its language, e.g. "apple". */
  answer: string;
  image?: string;
  slots: Slot[];
  /** All tiles in display order (placed ones included). */
  tiles: Tile[];
  /** Times the slots were filled with a wrong word. */
  attempts: number;
  solved: boolean;
  /** The learner asked to see the answer. */
  revealed: boolean;
};

const isLetter = (ch: string) => /\p{L}/u.test(ch);

/** True when a target word can be a letter puzzle. */
export function fitsPuzzle(answer: string): boolean {
  const letters = [...answer].filter(isLetter).length;
  return letters >= MIN_LETTERS && letters <= MAX_LETTERS && /^[\p{L} '’-]+$/u.test(answer);
}

type BuildInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  conceptId: string;
  rng: Rng;
};

/**
 * A puzzle for a word or short phrase of the course's target language, or null
 * when the concept has no fitting text. Tiles never start in the right order.
 */
export function buildPuzzle({ bundle, courseId, conceptId, rng }: BuildInput): Puzzle | null {
  const course = findCourse(courseId);
  const concept = findConcept(bundle, conceptId);
  if (!course || !concept || concept.kind === 'sentence' || concept.kind === 'idiom') return null;
  const promptEntry = getEntry(bundle, course.nativeLang, conceptId);
  const answerEntry = getEntry(bundle, course.targetLang, conceptId);
  if (!promptEntry || !answerEntry) return null;

  const answer = getLanguage(course.targetLang).toLower(answerEntry.text.normalize('NFC'));
  if (!fitsPuzzle(answer)) return null;

  const slots: Slot[] = [...answer].map((ch) =>
    isLetter(ch) ? { kind: 'letter', letter: ch, tileId: null } : { kind: 'fixed', char: ch },
  );
  const letters = [...answer].filter(isLetter);
  let tiles = letters.map((letter, id) => ({ id, letter }));
  if (new Set(letters).size > 1) {
    // Reshuffle until the tiles do not already spell the answer.
    do tiles = shuffle(tiles, rng);
    while (tiles.map((t) => t.letter).join('') === letters.join(''));
  }

  return {
    conceptId,
    prompt: promptEntry.text,
    promptLang: course.nativeLang,
    answerLang: course.targetLang,
    answer,
    image: concept.image,
    slots,
    tiles,
    attempts: 0,
    solved: false,
    revealed: false,
  };
}

export function isDone(p: Puzzle): boolean {
  return p.solved || p.revealed;
}

export function placedTileIds(p: Puzzle): Set<number> {
  return new Set(
    p.slots.flatMap((s) => (s.kind === 'letter' && s.tileId !== null ? [s.tileId] : [])),
  );
}

export function isFull(p: Puzzle): boolean {
  return p.slots.every((s) => s.kind === 'fixed' || s.tileId !== null);
}

/** The letters currently in the slots, with fixed characters; empty slots as "_". */
export function spelled(p: Puzzle): string {
  const byId = new Map(p.tiles.map((t) => [t.id, t.letter]));
  return p.slots
    .map((s) => (s.kind === 'fixed' ? s.char : s.tileId === null ? '_' : byId.get(s.tileId)))
    .join('');
}

function withSlots(p: Puzzle, slots: Slot[]): Puzzle {
  return { ...p, slots };
}

/** Puts a free tile into the first empty slot. */
export function placeTile(p: Puzzle, tileId: number): Puzzle {
  if (isDone(p) || placedTileIds(p).has(tileId) || !p.tiles.some((t) => t.id === tileId)) return p;
  const index = p.slots.findIndex((s) => s.kind === 'letter' && s.tileId === null);
  if (index < 0) return p;
  return withSlots(
    p,
    p.slots.map((s, i) => (i === index && s.kind === 'letter' ? { ...s, tileId } : s)),
  );
}

/** Takes the tile out of a slot again. */
export function clearSlot(p: Puzzle, slotIndex: number): Puzzle {
  const slot = p.slots[slotIndex];
  if (isDone(p) || !slot || slot.kind !== 'letter' || slot.tileId === null) return p;
  return withSlots(
    p,
    p.slots.map((s, i) => (i === slotIndex && s.kind === 'letter' ? { ...s, tileId: null } : s)),
  );
}

/**
 * Checks a full puzzle. Right: solved. Wrong: counts an attempt and sends back
 * only the tiles in the wrong place, so progress is kept.
 */
export function checkPuzzle(p: Puzzle): {
  puzzle: Puzzle;
  result: 'right' | 'wrong' | 'incomplete';
} {
  if (isDone(p) || !isFull(p)) return { puzzle: p, result: 'incomplete' };
  const byId = new Map(p.tiles.map((t) => [t.id, t.letter]));
  const wrong = (s: Slot) => s.kind === 'letter' && byId.get(s.tileId!) !== s.letter;
  if (!p.slots.some(wrong)) return { puzzle: { ...p, solved: true }, result: 'right' };
  return {
    puzzle: {
      ...p,
      attempts: p.attempts + 1,
      slots: p.slots.map((s) => (wrong(s) && s.kind === 'letter' ? { ...s, tileId: null } : s)),
    },
    result: 'wrong',
  };
}

/**
 * After repeated misses: a free tile carrying the letter the first empty slot
 * needs, or null while no hint is due.
 */
export function hintTileId(p: Puzzle): number | null {
  if (isDone(p) || p.attempts < HINT_AFTER_ATTEMPTS) return null;
  const slot = p.slots.find((s) => s.kind === 'letter' && s.tileId === null);
  if (!slot || slot.kind !== 'letter') return null;
  const placed = placedTileIds(p);
  return p.tiles.find((t) => !placed.has(t.id) && t.letter === slot.letter)?.id ?? null;
}

/** Shows the answer: every slot gets its right tile. */
export function revealPuzzle(p: Puzzle): Puzzle {
  if (isDone(p)) return p;
  const free = [...p.tiles];
  const slots = p.slots.map((s) => {
    if (s.kind === 'fixed') return s;
    const i = free.findIndex((t) => t.letter === s.letter);
    const [tile] = free.splice(i, 1);
    return { ...s, tileId: tile.id };
  });
  return { ...p, slots, revealed: true };
}

/** First try: good. Got there after misses: hard. Asked for the answer: again. */
export function puzzleGrade(p: Puzzle): Grade {
  if (p.revealed) return 'again';
  return p.attempts === 0 ? 'good' : 'hard';
}
