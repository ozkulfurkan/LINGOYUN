import { content } from '@/content/bundle';
import { levelConcepts, LEVEL_DONE_MASTERY } from '@/features/map';
import { addProfile, deleteProfile, profilesStore, setCourseLevel } from '@/features/profiles';
import { recordAnswer, type Deck } from '@/features/srs';
import { loadProgress } from '@/storage/progress';
import { saveDeck } from '@/storage/srs';

import { finishRound } from './finishRound';

function seed(level: string): string {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Ece', type: 'kid', courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  const id = added.value.activeId!;
  profilesStore.update((s) => setCourseLevel(s, id, level));
  return id;
}

const levelOf = (id: string) =>
  profilesStore.getState().profiles.find((p) => p.id === id)?.courses['tr-en']?.level;

afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

describe('finishRound', () => {
  it('rewards a round without moving up when the level is not mastered', () => {
    const id = seed('L1');
    const { reward, newLevel } = finishRound({
      profileId: id,
      courseId: 'tr-en',
      profileType: 'kid',
      level: 'L1',
      grades: ['good', 'good'],
      today: 10,
    });
    expect(newLevel).toBeNull();
    expect(reward.xp).toBeGreaterThan(0);
    expect(loadProgress(id).xp).toBe(reward.xp);
    expect(levelOf(id)).toBe('L1');
  });

  it('moves up a level, with its gems and badge, once the level is mastered', () => {
    const id = seed('L1');
    const l1 = levelConcepts(content, 'tr-en', 'kid', 'L1');
    let deck: Deck = {};
    for (const c of l1.slice(0, Math.ceil(l1.length * LEVEL_DONE_MASTERY))) {
      for (let i = 0; i < 3; i++) deck = recordAnswer(deck, c, 'good', i * 30);
    }
    saveDeck(id, 'tr-en', deck);

    const { reward, newLevel } = finishRound({
      profileId: id,
      courseId: 'tr-en',
      profileType: 'kid',
      level: 'L1',
      grades: ['good'],
      today: 100,
    });

    expect(newLevel).toBe('L2');
    expect(levelOf(id)).toBe('L2');
    expect(reward.newBadges).toContain('level_up');
    expect(reward.gems).toBe(1 + 5 + 10);
  });
});
