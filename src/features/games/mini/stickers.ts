import { shuffle, type Rng } from '@/features/quiz/rng';

import type { MiniActivity } from './session';
import type { MiniWorld } from './worlds';

/**
 * The sticker album of ages 2–7 (LNG-34): every word picture is a sticker.
 * A finished session sticks new ones in; nothing is ever taken away.
 */
export type StickerAlbum = {
  /** Concept id → local day (`localDay`) the sticker was earned. */
  owned: Record<string, number>;
};

export const EMPTY_ALBUM: StickerAlbum = { owned: {} };

/** Stickers for a finished session; one more when nothing was missed. */
export const STICKERS_PER_SESSION = 2;
export const PERFECT_BONUS = 1;

export function parseAlbum(raw: unknown): StickerAlbum {
  const owned = (raw as { owned?: unknown } | null)?.owned;
  if (!owned || typeof owned !== 'object' || Array.isArray(owned)) return EMPTY_ALBUM;
  const out: Record<string, number> = {};
  for (const [id, day] of Object.entries(owned)) {
    if (typeof day === 'number' && Number.isFinite(day)) out[id] = day;
  }
  return { owned: out };
}

type AwardInput = {
  album: StickerAlbum;
  world: MiniWorld;
  /** Words of the session, in the order they were asked: these come first. */
  sessionWords: readonly string[];
  perfect: boolean;
  today: number;
  rng: Rng;
};

/**
 * New stickers for a finished session: words just played first, then any
 * other missing word of the same world. A full world page gives nothing new.
 */
export function awardStickers({ album, world, sessionWords, perfect, today, rng }: AwardInput): {
  album: StickerAlbum;
  added: string[];
} {
  const count = STICKERS_PER_SESSION + (perfect ? PERFECT_BONUS : 0);
  const inWorld = new Set(world.concepts);
  const missing = (id: string) => inWorld.has(id) && !(id in album.owned);
  const candidates = [
    ...new Set([...sessionWords.filter(missing), ...shuffle(world.concepts.filter(missing), rng)]),
  ];
  const added = candidates.slice(0, count);
  if (added.length === 0) return { album, added };
  const owned = { ...album.owned };
  for (const id of added) owned[id] = today;
  return { album: { owned }, added };
}

export type StickerSlot = { conceptId: string; owned: boolean };

/** A world's page: one slot per word, in course order. */
export function albumPage(album: StickerAlbum, world: MiniWorld): StickerSlot[] {
  return world.concepts.map((conceptId) => ({ conceptId, owned: conceptId in album.owned }));
}

export function pageCount(album: StickerAlbum, world: MiniWorld): number {
  return world.concepts.filter((id) => id in album.owned).length;
}

export function isPageFull(album: StickerAlbum, world: MiniWorld): boolean {
  return pageCount(album, world) === world.concepts.length;
}

/** The words a session asked, in order, without repeats (memory pairs last). */
export function sessionWords(activities: readonly MiniActivity[]): string[] {
  const asked = activities.flatMap((a) => (a.kind === 'memory' ? [] : [a.target]));
  const shown = activities.flatMap((a) => (a.kind === 'memory' ? a.pairs : []));
  return [...new Set([...asked, ...shown])];
}
