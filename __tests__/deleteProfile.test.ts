import { addProfile, deleteProfile, profilesStore } from '@/features/profiles';
import { completeSession, EMPTY_PROGRESS } from '@/features/progress';
import { recordAnswer } from '@/features/srs';
import { loadProgress, saveProgress } from '@/storage/progress';
import { loadDeck, saveDeck } from '@/storage/srs';

describe('deleteProfile', () => {
  it('removes the profile, its review decks and its progress', () => {
    const result = profilesStore.update((s, d) =>
      addProfile(s, { nickname: 'Kerem', type: 'kid', courseId: 'tr-en' }, d),
    );
    if (!result.ok) throw new Error(result.error);
    const id = result.value.activeId!;
    saveDeck(id, 'tr-en', recordAnswer({}, 'fruit.apple', 'good', 1));
    saveProgress(
      id,
      completeSession(EMPTY_PROGRESS, { grades: ['good'], today: 1, wordsLearned: 0 }).progress,
    );

    deleteProfile(id);

    expect(profilesStore.getState().profiles.some((p) => p.id === id)).toBe(false);
    expect(loadDeck(id, 'tr-en')).toEqual({});
    expect(loadProgress(id)).toEqual(EMPTY_PROGRESS);
  });
});
