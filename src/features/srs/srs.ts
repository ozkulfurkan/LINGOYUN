import type { Verdict } from '@/features/answer-check';

/** Days until the next review for each Leitner box (box 0 = again today). */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14] as const;
export const LAST_BOX = BOX_INTERVAL_DAYS.length - 1;

export type Card = {
  conceptId: string;
  /** Leitner box, 0 … LAST_BOX. */
  box: number;
  /** Local day number (see localDay) when the card is due. */
  dueDay: number;
  /** Local day of the last review, or null if never reviewed. */
  lastDay: number | null;
  reviews: number;
  /** Times the card fell back to box 0 after a wrong answer. */
  lapses: number;
};

/** Cards of one profile in one course, by concept id. */
export type Deck = Record<string, Card>;

/**
 * good  – promote one box.
 * hard  – keep the box (right idea, imperfect spelling).
 * again – back to box 0, due again today.
 */
export type Grade = 'good' | 'hard' | 'again';

export function gradeFromVerdict(verdict: Verdict): Grade {
  switch (verdict) {
    case 'correct':
      return 'good';
    case 'nearMiss':
    case 'typo':
    case 'otherWord':
      return 'hard';
    case 'wrong':
      return 'again';
  }
}

export function newCard(conceptId: string, today: number): Card {
  return { conceptId, box: 0, dueDay: today, lastDay: null, reviews: 0, lapses: 0 };
}

/** The card after one answer given on `today`. */
export function reviewCard(card: Card, grade: Grade, today: number): Card {
  const box =
    grade === 'good' ? Math.min(card.box + 1, LAST_BOX) : grade === 'again' ? 0 : card.box;
  return {
    ...card,
    box,
    dueDay: today + BOX_INTERVAL_DAYS[box],
    lastDay: today,
    reviews: card.reviews + 1,
    lapses: card.lapses + (grade === 'again' && card.box > 0 ? 1 : 0),
  };
}

/** Records an answer, creating the card on first sight. Returns a new deck. */
export function recordAnswer(deck: Deck, conceptId: string, grade: Grade, today: number): Deck {
  const card = deck[conceptId] ?? newCard(conceptId, today);
  return { ...deck, [conceptId]: reviewCard(card, grade, today) };
}

/** Cards due on or before `today`: most overdue first, then lower boxes first. */
export function dueCards(deck: Deck, today: number): Card[] {
  return Object.values(deck)
    .filter((c) => c.dueDay <= today)
    .sort((a, b) => a.dueDay - b.dueDay || a.box - b.box || a.conceptId.localeCompare(b.conceptId));
}

type QueueOptions = {
  /** Concepts of the current unit/level, in course order; unseen ones become new cards. */
  candidates: readonly string[];
  /** At most this many due reviews. */
  maxReviews: number;
  /** At most this many never-seen concepts. */
  maxNew: number;
};

/** Today's practice list: due reviews first, then new concepts in course order. */
export function practiceQueue(deck: Deck, today: number, opts: QueueOptions): string[] {
  const reviews = dueCards(deck, today)
    .slice(0, opts.maxReviews)
    .map((c) => c.conceptId);
  const fresh = opts.candidates.filter((id) => !(id in deck)).slice(0, opts.maxNew);
  return [...reviews, ...fresh];
}

/** Share of a set of concepts that reached at least `minBox` (0–1). */
export function masteryOf(deck: Deck, conceptIds: readonly string[], minBox = 3): number {
  if (conceptIds.length === 0) return 0;
  const learned = conceptIds.filter((id) => (deck[id]?.box ?? -1) >= minBox).length;
  return learned / conceptIds.length;
}

/** Number of words learned so far: cards that reached at least `minBox`. */
export function learnedCount(deck: Deck, minBox = 3): number {
  return Object.values(deck).filter((c) => c.box >= minBox).length;
}

/** Rebuilds a deck from stored JSON, dropping malformed cards. */
export function parseDeck(data: unknown): Deck {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return {};
  const deck: Deck = {};
  for (const [id, v] of Object.entries(data as Record<string, unknown>)) {
    if (isCard(v) && v.conceptId === id) deck[id] = v;
  }
  return deck;
}

function isCard(v: unknown): v is Card {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.conceptId === 'string' &&
    Number.isInteger(c.box) &&
    (c.box as number) >= 0 &&
    (c.box as number) <= LAST_BOX &&
    Number.isInteger(c.dueDay) &&
    (c.lastDay === null || Number.isInteger(c.lastDay)) &&
    Number.isInteger(c.reviews) &&
    Number.isInteger(c.lapses)
  );
}
