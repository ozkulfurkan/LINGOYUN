import { addProfile, deleteProfile, profilesStore } from '@/features/profiles';
import { recordAnswer } from '@/features/srs';
import { loadDeck, saveDeck } from '@/storage/srs';

describe('deleteProfile', () => {
  it('removes the profile and its review decks', () => {
    const result = profilesStore.update((s, d) =>
      addProfile(s, { nickname: 'Kerem', type: 'kid', courseId: 'tr-en' }, d),
    );
    if (!result.ok) throw new Error(result.error);
    const id = result.value.activeId!;
    saveDeck(id, 'tr-en', recordAnswer({}, 'fruit.apple', 'good', 1));

    deleteProfile(id);

    expect(profilesStore.getState().profiles.some((p) => p.id === id)).toBe(false);
    expect(loadDeck(id, 'tr-en')).toEqual({});
  });
});
