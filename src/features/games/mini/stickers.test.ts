import { content } from '@/content/bundle';
import { seededRng } from '@/features/quiz/rng';

import {
  albumPage,
  awardStickers,
  EMPTY_ALBUM,
  isPageFull,
  pageCount,
  parseAlbum,
  PERFECT_BONUS,
  sessionWords,
  STICKERS_PER_SESSION,
} from './stickers';
import { findWorld } from './worlds';

const animals = findWorld(content, 'tr-en', 'animals')!;
const food = findWorld(content, 'tr-en', 'food')!;
const today = 20_404;

const award = (
  album = EMPTY_ALBUM,
  sessionWords: string[] = animals.concepts.slice(0, 6),
  perfect = false,
) => awardStickers({ album, world: animals, sessionWords, perfect, today, rng: seededRng(1) });

describe('awardStickers', () => {
  it('gives two stickers for the words just played, in the order asked', () => {
    const { album, added } = award();
    expect(added).toEqual(animals.concepts.slice(0, STICKERS_PER_SESSION));
    expect(album.owned[added[0]]).toBe(today);
  });

  it('gives one more for a session without a miss', () => {
    expect(award(EMPTY_ALBUM, undefined, true).added).toHaveLength(
      STICKERS_PER_SESSION + PERFECT_BONUS,
    );
  });

  it('never repeats a sticker; takes other words of the world when the played ones are owned', () => {
    let album = EMPTY_ALBUM;
    const played = animals.concepts.slice(0, 2);
    const first = award(album, played);
    album = first.album;
    const second = award(album, played);
    expect(second.added).toHaveLength(2);
    for (const id of second.added) {
      expect(first.added).not.toContain(id);
      expect(animals.concepts).toContain(id);
    }
  });

  it('ignores words from other worlds', () => {
    const { added } = award(EMPTY_ALBUM, food.concepts.slice(0, 3));
    for (const id of added) expect(animals.concepts).toContain(id);
  });

  it('fills a page in the end and then gives nothing', () => {
    let album = EMPTY_ALBUM;
    for (let i = 0; i < 30; i++) album = award(album, [], true).album;
    expect(isPageFull(album, animals)).toBe(true);
    const last = award(album, [], true);
    expect(last.added).toEqual([]);
    expect(last.album).toBe(album);
  });
});

describe('album pages', () => {
  it('lists every word of the world with its owned state', () => {
    const { album, added } = award();
    const page = albumPage(album, animals);
    expect(page).toHaveLength(50);
    expect(page.filter((s) => s.owned).map((s) => s.conceptId)).toEqual(added);
    expect(pageCount(album, animals)).toBe(2);
    expect(pageCount(album, food)).toBe(0);
  });
});

describe('parseAlbum', () => {
  it('keeps valid entries and drops broken data', () => {
    expect(parseAlbum({ owned: { a: today, b: '3' } })).toEqual({ owned: { a: today } });
    expect(parseAlbum(null)).toEqual(EMPTY_ALBUM);
    expect(parseAlbum({ owned: [] })).toEqual(EMPTY_ALBUM);
  });
});

describe('sessionWords', () => {
  it('lists the asked words first, then the memory pairs, once each', () => {
    expect(
      sessionWords([
        { kind: 'listen', intro: true, target: 'a', options: ['a', 'b'] },
        { kind: 'memory', intro: true, pairs: ['c', 'a'] },
        { kind: 'basket', intro: true, target: 'b', options: ['b', 'd'] },
      ]),
    ).toEqual(['a', 'b', 'c']);
  });
});
