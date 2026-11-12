import { EMPTY_ALBUM } from '@/features/games/mini/stickers';

import { storage } from './storage';
import { loadAlbum, removeAlbum, saveAlbum } from './stickers';

describe('sticker album storage', () => {
  beforeEach(() => storage.clearAll());

  it('saves, loads and removes per profile', () => {
    saveAlbum('p1', { owned: { 'animal.cat': 3 } });
    expect(loadAlbum('p1')).toEqual({ owned: { 'animal.cat': 3 } });
    expect(loadAlbum('p2')).toEqual(EMPTY_ALBUM);
    removeAlbum('p1');
    expect(loadAlbum('p1')).toEqual(EMPTY_ALBUM);
  });

  it('recovers from corrupt data', () => {
    storage.set('stickers.v1.p1', 'nope{');
    expect(loadAlbum('p1')).toEqual(EMPTY_ALBUM);
  });
});
