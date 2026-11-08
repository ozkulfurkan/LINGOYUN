import { content } from '@/content/bundle';
import type { CourseId } from '@/features/languages';
import { levelUpTarget } from '@/features/map';
import { profilesStore, setCourseLevel } from '@/features/profiles';
import { completeSession, type SessionReward } from '@/features/progress';
import { learnedCount, type Grade } from '@/features/srs';
import { loadProgress, saveProgress } from '@/storage/progress';
import { loadDeck } from '@/storage/srs';

type Input = {
  profileId: string;
  courseId: CourseId;
  profileType: 'kid' | 'adult';
  level: string;
  grades: readonly Grade[];
  today: number;
};

/**
 * Ends a finished round for every game: moves the profile up a level when the
 * current one is mastered (map, LNG-21), then grants XP, gems, streak and
 * badges and saves them. Returns what the summary screen shows.
 */
export function finishRound({ profileId, courseId, profileType, level, grades, today }: Input): {
  reward: SessionReward;
  newLevel: string | null;
} {
  const deck = loadDeck(profileId, courseId);
  const target = levelUpTarget(content, courseId, profileType, deck, level);
  const newLevel =
    target && profilesStore.update((s) => setCourseLevel(s, profileId, target)).ok ? target : null;

  const result = completeSession(loadProgress(profileId), {
    grades,
    today,
    levelUp: newLevel !== null,
    wordsLearned: learnedCount(deck),
  });
  saveProgress(profileId, result.progress);
  return { reward: result.reward, newLevel };
}
