import type { LanguageCode } from './types';

export type CourseId = `${LanguageCode}-${LanguageCode}`;

/** Profile types that take a placement test and have a level scale. */
export type LeveledProfileType = 'kid' | 'adult';

export type CourseDef = {
  id: CourseId;
  /** Language the learner already speaks. */
  nativeLang: LanguageCode;
  /** Language the learner is learning. */
  targetLang: LanguageCode;
  /**
   * Ordered levels per profile type, lowest first. Levels belong to the
   * course, not to a word: the same concept can sit at different levels in
   * different target languages.
   */
  levels: Readonly<Record<LeveledProfileType, readonly string[]>>;
};

export function courseId(nativeLang: LanguageCode, targetLang: LanguageCode): CourseId {
  return `${nativeLang}-${targetLang}`;
}

const TR_EN: CourseDef = {
  id: 'tr-en',
  nativeLang: 'tr',
  targetLang: 'en',
  levels: {
    kid: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10'],
    adult: ['A1', 'A2', 'B1', 'B2', 'C1'],
  },
};

export const COURSES: readonly CourseDef[] = [TR_EN];

export function findCourse(id: string): CourseDef | undefined {
  return COURSES.find((c) => c.id === id);
}

/** Courses a speaker of `nativeLang` can take. */
export function coursesFor(nativeLang: LanguageCode): CourseDef[] {
  return COURSES.filter((c) => c.nativeLang === nativeLang);
}
