import type { CourseId } from '@/features/languages';
import { parseDeck, type Deck } from '@/features/srs';

import { storage } from './storage';

// One deck per profile and course.
const key = (profileId: string, courseId: CourseId) => `srs.v1.${profileId}.${courseId}`;

export function loadDeck(profileId: string, courseId: CourseId): Deck {
  const raw = storage.getString(key(profileId, courseId));
  if (raw === undefined) return {};
  try {
    return parseDeck(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function saveDeck(profileId: string, courseId: CourseId, deck: Deck): void {
  storage.set(key(profileId, courseId), JSON.stringify(deck));
}

/** Removes every deck of a profile (call when the profile is deleted). */
export function removeDecks(profileId: string): void {
  const prefix = `srs.v1.${profileId}.`;
  for (const k of storage.getAllKeys()) {
    if (k.startsWith(prefix)) storage.remove(k);
  }
}
