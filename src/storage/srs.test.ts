import { newCard, recordAnswer } from '@/features/srs';

import { loadDeck, removeDecks, saveDeck } from './srs';
import { storage } from './storage';

describe('deck storage', () => {
  beforeEach(() => storage.clearAll());

  it('keeps decks per profile and course', () => {
    const deck = recordAnswer({}, 'fruit.apple', 'good', 100);
    saveDeck('p1', 'tr-en', deck);
    expect(loadDeck('p1', 'tr-en')).toEqual(deck);
    expect(loadDeck('p2', 'tr-en')).toEqual({});
  });

  it('recovers from corrupt data', () => {
    storage.set('srs.v1.p1.tr-en', '{oops');
    expect(loadDeck('p1', 'tr-en')).toEqual({});
  });

  it('removes only the given profile’s decks', () => {
    saveDeck('p1', 'tr-en', { a: newCard('a', 1) });
    saveDeck('p2', 'tr-en', { b: newCard('b', 1) });
    storage.set('profiles.v1', '{}');
    removeDecks('p1');
    expect(loadDeck('p1', 'tr-en')).toEqual({});
    expect(loadDeck('p2', 'tr-en')).toEqual({ b: newCard('b', 1) });
    expect(storage.getString('profiles.v1')).toBe('{}');
  });
});
