import {
  COURSES,
  coursesFor,
  findCourse,
  getLanguage,
  isLanguageCode,
  type CourseId,
} from '@/features/languages';
import { startingLevelIndex, type SelfAssessment } from '@/features/placement';
import { getActiveProfile, setCourseLevel, type Result } from '@/features/profiles/profiles';
import type { ProfilesState } from '@/features/profiles/types';

export type OnboardingStep = 'createProfile' | 'selfAssessment' | 'done';

/**
 * Where the app should send the user. Derived from stored profiles, so closing
 * the app mid-way resumes at the right screen. mini profiles have no levels.
 */
export function onboardingStep(state: ProfilesState): OnboardingStep {
  const profile = getActiveProfile(state);
  if (!profile) return 'createProfile';
  if (profile.type === 'mini') return 'done';
  return profile.courses[profile.courseId]?.level ? 'done' : 'selfAssessment';
}

/** The course for a speaker of the UI language, else the first course there is. */
export function defaultCourseId(uiLanguage: string): CourseId {
  const own = isLanguageCode(uiLanguage) ? coursesFor(uiLanguage)[0] : undefined;
  return (own ?? COURSES[0]).id;
}

/**
 * Records the level a self-assessment points to. "none" is final: that learner
 * skips the test and starts at the lowest level. Other answers are provisional
 * until the placement test (LNG-17) refines them.
 */
export function applySelfAssessment(
  state: ProfilesState,
  profileId: string,
  self: SelfAssessment,
): Result<ProfilesState> {
  const profile = state.profiles.find((p) => p.id === profileId);
  if (!profile) return { ok: false, error: 'unknownProfile' };
  const course = findCourse(profile.courseId);
  if (!course) return { ok: false, error: 'unknownCourse' };
  if (profile.type === 'mini') return { ok: false, error: 'levelNotAllowed' };
  const scale = course.levels[profile.type];
  return setCourseLevel(state, profileId, scale[startingLevelIndex(scale, self)]);
}

/** Uppercases with the UI language's own rules: "seviye" → "SEVİYE" in Turkish. */
export function toUiUpper(uiLanguage: string, text: string): string {
  return isLanguageCode(uiLanguage) ? getLanguage(uiLanguage).toUpper(text) : text.toUpperCase();
}
