import type { CourseId, LanguageCode } from '@/features/languages';
import type { ProfileType } from '@/features/profiles/types';

import type { Concept, ContentBundle, Entry, Unit } from './types';

export function findConcept(bundle: ContentBundle, id: string): Concept | undefined {
  return bundle.concepts.find((c) => c.id === id);
}

/** How `lang` says a concept, or undefined when there is no translation. */
export function getEntry(bundle: ContentBundle, lang: LanguageCode, id: string): Entry | undefined {
  const concept = findConcept(bundle, id);
  if (!concept) return undefined;
  const file = concept.kind === 'sentence' ? 'sentences' : 'words';
  return bundle.languages[lang][file][id];
}

/**
 * Units of the level ladder for a profile type, optionally of one level, in
 * course order. Theme units are left out: see themeUnits.
 */
export function unitsFor(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: ProfileType,
  level?: string,
): Unit[] {
  const course = bundle.courses.find((c) => c.id === courseId);
  if (!course) return [];
  return course.units.filter(
    (u) => !u.theme && u.profileType === profileType && (level === undefined || u.level === level),
  );
}

/** Units of one situation for a profile type, easiest first as in the course. */
export function themeUnits(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: ProfileType,
  theme: string,
): Unit[] {
  const course = bundle.courses.find((c) => c.id === courseId);
  return course?.units.filter((u) => u.theme === theme && u.profileType === profileType) ?? [];
}

/** Concepts of a situation at one difficulty: vocabulary or sentences. */
export function themeConcepts(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: ProfileType,
  theme: string,
  level: string,
  kind: 'vocabulary' | 'sentence',
): string[] {
  return themeUnits(bundle, courseId, profileType, theme)
    .filter((u) => u.level === level)
    .flatMap((u) => u.concepts)
    .filter((id) => (findConcept(bundle, id)?.kind === 'sentence') === (kind === 'sentence'));
}

/** Concepts of a unit, in unit order. Unknown ids are skipped. */
export function conceptsOf(bundle: ContentBundle, unit: Unit): Concept[] {
  return unit.concepts
    .map((id) => findConcept(bundle, id))
    .filter((c): c is Concept => c !== undefined);
}
