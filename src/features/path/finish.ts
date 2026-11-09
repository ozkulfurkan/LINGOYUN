import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import type { CourseId } from '@/features/languages';
import { profilesStore, setCourseLevel } from '@/features/profiles';
import { completeSession, type SessionReward } from '@/features/progress';
import { learnedCount, type Grade } from '@/features/srs';
import { savePath } from '@/storage/path';
import { loadProgress, saveProgress } from '@/storage/progress';
import { loadDeck } from '@/storage/srs';

import { failStep, passStep, type PathProgress } from './progress';

type Input = {
  profileId: string;
  courseId: CourseId;
  profileType: 'kid' | 'adult';
  /** Progress when the step started. */
  progress: PathProgress;
  /** Whether the step played is the learner's current one (not a replay). */
  current: boolean;
  grades: readonly Grade[];
  mistakes: readonly string[];
  perfect: boolean;
  today: number;
};

/**
 * Ends a passed step: XP, gems, streak and badges for every step; moving along
 * the path only when it was the current step. The profile's level follows the
 * band of its theme, so the placement scale stays meaningful.
 */
export function finishPassedStep(input: Input): { reward: SessionReward; progress: PathProgress } {
  const { profileId, courseId, profileType, current, today } = input;
  const result = completeSession(loadProgress(profileId), {
    grades: input.grades,
    today,
    wordsLearned: learnedCount(loadDeck(profileId, courseId)),
  });
  saveProgress(profileId, result.progress);
  if (!current) return { reward: result.reward, progress: input.progress };

  const next = passStep(input.progress, { mistakes: input.mistakes, perfect: input.perfect });
  savePath(profileId, courseId, next);
  const band = pathOf(content, courseId, profileType)[next.themeIndex]?.band;
  if (band) profilesStore.update((s) => setCourseLevel(s, profileId, band));
  return { reward: result.reward, progress: next };
}

/** Lost every heart in the current step: the step stays, a little easier. */
export function recordFailedStep(
  input: Pick<Input, 'profileId' | 'courseId' | 'progress' | 'current'>,
) {
  if (input.current) savePath(input.profileId, input.courseId, failStep(input.progress));
}
