import { findConcept, getEntry, unitsFor, type ContentBundle } from '@/content';
import {
  findCourse,
  getLanguage,
  normalizeAnswer,
  type CourseId,
  type LanguageCode,
} from '@/features/languages';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Grade } from '@/features/srs';

/** Failed checks after which the next right word is hinted (kids-ux). */
export const HINT_AFTER_ATTEMPTS = 2;
/** Sentences longer than this do not fit as blocks on a phone. */
export const MAX_WORDS = 9;

export type Block = { id: number; word: string };

export type SentencePuzzle = {
  conceptId: string;
  /** The sentence in the native language. */
  prompt: string;
  promptLang: LanguageCode;
  answerLang: LanguageCode;
  /** Words of the main answer, in order (final .!? kept apart in `ending`). */
  words: string[];
  /** Final punctuation shown after the last block, e.g. ".". */
  ending: string;
  /** Every accepted answer, normalized, for checking other valid orders. */
  accepted: string[];
  /** All blocks, in the order they are offered (decoys included). */
  blocks: Block[];
  /** Ids of the blocks placed in the answer, in order. */
  placed: number[];
  attempts: number;
  solved: boolean;
  revealed: boolean;
};

const ENDING = /[.!?…]+$/u;

/** Splits a sentence into words and its final punctuation. */
export function splitSentence(text: string): { words: string[]; ending: string } {
  const trimmed = text.trim();
  const ending = trimmed.match(ENDING)?.[0] ?? '';
  const body = trimmed.slice(0, trimmed.length - ending.length).trim();
  return { words: body ? body.split(/\s+/) : [], ending };
}

type BuildInput = {
  bundle: ContentBundle;
  courseId: CourseId;
  conceptId: string;
  /** Extra words that do not belong in the sentence. */
  decoys?: number;
  /** Concepts decoy words may be taken from (other sentences of the level). */
  decoyPool?: readonly string[];
  rng: Rng;
};

/**
 * A sentence to rebuild in the course's target language from shuffled word
 * blocks, or null when the concept is not a fitting sentence. The blocks never
 * start in the right order.
 */
export function buildSentencePuzzle({
  bundle,
  courseId,
  conceptId,
  decoys = 0,
  decoyPool = [],
  rng,
}: BuildInput): SentencePuzzle | null {
  const course = findCourse(courseId);
  const concept = findConcept(bundle, conceptId);
  if (!course || concept?.kind !== 'sentence') return null;
  const promptEntry = getEntry(bundle, course.nativeLang, conceptId);
  const answerEntry = getEntry(bundle, course.targetLang, conceptId);
  if (!promptEntry || !answerEntry) return null;

  const { words, ending } = splitSentence(answerEntry.text);
  if (words.length < 2 || words.length > MAX_WORDS) return null;

  const lang = getLanguage(course.targetLang);
  const accepted = [answerEntry.text, ...(answerEntry.alt ?? [])].map((t) =>
    normalizeAnswer(lang, t),
  );

  // Decoys: words from other sentences that are not in this one (in any case).
  const inSentence = new Set(words.map((w) => normalizeAnswer(lang, w)));
  const candidates = [
    ...new Set(
      decoyPool
        .filter((id) => id !== conceptId)
        .flatMap((id) => {
          const entry = getEntry(bundle, course.targetLang, id);
          return entry ? splitSentence(entry.text).words : [];
        })
        .filter((w) => !inSentence.has(normalizeAnswer(lang, w))),
    ),
  ];
  const extra = shuffle(candidates, rng).slice(0, decoys);

  let blocks = [...words, ...extra].map((word, id) => ({ id, word }));
  const right = words.join(' ');
  if (new Set(words).size > 1 || extra.length > 0) {
    do blocks = shuffle(blocks, rng);
    while (
      blocks
        .slice(0, words.length)
        .map((b) => b.word)
        .join(' ') === right &&
      extra.length === 0
    );
  }

  return {
    conceptId,
    prompt: promptEntry.text,
    promptLang: course.nativeLang,
    answerLang: course.targetLang,
    words,
    ending,
    accepted,
    blocks,
    placed: [],
    attempts: 0,
    solved: false,
    revealed: false,
  };
}

export function isSentenceDone(p: SentencePuzzle): boolean {
  return p.solved || p.revealed;
}

/** The sentence currently built, with the ending once complete. */
export function builtText(p: SentencePuzzle): string {
  const byId = new Map(p.blocks.map((b) => [b.id, b.word]));
  return p.placed.map((id) => byId.get(id)).join(' ');
}

/** Ready to check: as many blocks placed as the answer has words. */
export function canCheck(p: SentencePuzzle): boolean {
  return !isSentenceDone(p) && p.placed.length === p.words.length;
}

/** Appends a free block to the answer. */
export function placeBlock(p: SentencePuzzle, blockId: number): SentencePuzzle {
  if (
    isSentenceDone(p) ||
    p.placed.includes(blockId) ||
    !p.blocks.some((b) => b.id === blockId) ||
    p.placed.length >= p.words.length
  ) {
    return p;
  }
  return { ...p, placed: [...p.placed, blockId] };
}

/** Takes a block out of the answer; the blocks after it close the gap. */
export function removeBlock(p: SentencePuzzle, blockId: number): SentencePuzzle {
  if (isSentenceDone(p) || !p.placed.includes(blockId)) return p;
  return { ...p, placed: p.placed.filter((id) => id !== blockId) };
}

/**
 * Checks the built sentence against every accepted answer. Wrong: counts an
 * attempt and keeps only the right beginning of the main answer.
 */
export function checkSentence(p: SentencePuzzle): {
  puzzle: SentencePuzzle;
  result: 'right' | 'wrong' | 'incomplete';
} {
  if (!canCheck(p)) return { puzzle: p, result: 'incomplete' };
  const lang = getLanguage(p.answerLang);
  const built = normalizeAnswer(lang, `${builtText(p)}${p.ending}`);
  if (p.accepted.includes(built)) return { puzzle: { ...p, solved: true }, result: 'right' };

  const byId = new Map(p.blocks.map((b) => [b.id, b.word]));
  let keep = 0;
  while (keep < p.placed.length && byId.get(p.placed[keep]) === p.words[keep]) keep += 1;
  return {
    puzzle: { ...p, attempts: p.attempts + 1, placed: p.placed.slice(0, keep) },
    result: 'wrong',
  };
}

/** After repeated misses: a free block with the next right word, or null. */
export function sentenceHint(p: SentencePuzzle): number | null {
  if (isSentenceDone(p) || p.attempts < HINT_AFTER_ATTEMPTS) return null;
  const byId = new Map(p.blocks.map((b) => [b.id, b.word]));
  const prefixOk = p.placed.every((id, i) => byId.get(id) === p.words[i]);
  if (!prefixOk) return null;
  const next = p.words[p.placed.length];
  return p.blocks.find((b) => !p.placed.includes(b.id) && b.word === next)?.id ?? null;
}

/** Shows the answer: the right blocks in the right order. */
export function revealSentence(p: SentencePuzzle): SentencePuzzle {
  if (isSentenceDone(p)) return p;
  const free = [...p.blocks];
  const placed = p.words.map((w) => {
    const i = free.findIndex((b) => b.word === w);
    return free.splice(i, 1)[0].id;
  });
  return { ...p, placed, revealed: true };
}

export function sentenceGrade(p: SentencePuzzle): Grade {
  if (p.revealed) return 'again';
  return p.attempts === 0 ? 'good' : 'hard';
}

/** Sentence concepts of a level, in course order. */
export function levelSentences(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: 'kid' | 'adult',
  level: string,
): string[] {
  return unitsFor(bundle, courseId, profileType, level)
    .flatMap((u) => u.concepts)
    .filter((id) => findConcept(bundle, id)?.kind === 'sentence');
}
