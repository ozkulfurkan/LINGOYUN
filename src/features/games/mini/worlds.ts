import type { ContentBundle } from '@/content';
import type { CourseId } from '@/features/languages';

/** A theme world of ages 2–7 (`mini.*` unit), e.g. animals. */
export type MiniWorld = {
  /** World key, the part after `mini.` (also the i18n key under `mini.worlds`). */
  id: string;
  /** Concepts of the world, in course order; every one has a picture. */
  concepts: string[];
  /** Image id shown on the world's card: its first word. */
  cover: string;
};

/** The worlds of a course for ages 2–7, in course order. */
export function miniWorlds(bundle: ContentBundle, courseId: CourseId): MiniWorld[] {
  const course = bundle.courses.find((c) => c.id === courseId);
  const images = new Map(bundle.concepts.map((c) => [c.id, c.image]));
  return (course?.units ?? [])
    .filter((u) => u.profileType === 'mini' && !u.theme)
    .map((u) => {
      const concepts = u.concepts.filter((id) => images.get(id));
      return { id: u.id.replace(/^mini\./, ''), concepts, cover: images.get(concepts[0]) ?? '' };
    })
    .filter((w) => w.concepts.length > 0);
}

export function findWorld(
  bundle: ContentBundle,
  courseId: CourseId,
  id: string,
): MiniWorld | undefined {
  return miniWorlds(bundle, courseId).find((w) => w.id === id);
}
