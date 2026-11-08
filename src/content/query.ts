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

/** Units of a course for a profile type, optionally of one level, in course order. */
export function unitsFor(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: ProfileType,
  level?: string,
): Unit[] {
  const course = bundle.courses.find((c) => c.id === courseId);
  if (!course) return [];
  return course.units.filter(
    (u) => u.profileType === profileType && (level === undefined || u.level === level),
  );
}

/** Concepts of a unit, in unit order. Unknown ids are skipped. */
export function conceptsOf(bundle: ContentBundle, unit: Unit): Concept[] {
  return unit.concepts
    .map((id) => findConcept(bundle, id))
    .filter((c): c is Concept => c !== undefined);
}
