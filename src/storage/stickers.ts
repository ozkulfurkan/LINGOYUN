import { EMPTY_ALBUM, parseAlbum, type StickerAlbum } from '@/features/games/mini/stickers';

import { storage } from './storage';

const key = (profileId: string) => `stickers.v1.${profileId}`;

export function loadAlbum(profileId: string): StickerAlbum {
  const raw = storage.getString(key(profileId));
  if (raw === undefined) return EMPTY_ALBUM;
  try {
    return parseAlbum(JSON.parse(raw));
  } catch {
    return EMPTY_ALBUM;
  }
}

export function saveAlbum(profileId: string, album: StickerAlbum): void {
  storage.set(key(profileId), JSON.stringify(album));
}

export function removeAlbum(profileId: string): void {
  storage.remove(key(profileId));
}
