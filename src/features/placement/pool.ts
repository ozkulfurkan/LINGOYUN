import { unitsFor, type ContentBundle } from '@/content';
import type { CourseId } from '@/features/languages';
import type { ProfileType } from '@/features/profiles/types';

/**
 * Concepts placement questions at `level` are drawn from: every unit of that
 * level. If the level has no content yet, the nearest level below (then above)
 * that has content is used, so the test never runs out of questions.
 */
export function placementPool(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: Exclude<ProfileType, 'mini'>,
  scale: readonly string[],
  level: string,
): string[] {
  const at = (l: string) => [
    ...new Set(unitsFor(bundle, courseId, profileType, l).flatMap((u) => u.concepts)),
  ];
  const index = scale.indexOf(level);
  if (index < 0) return [];
  const order = [
    index,
    ...Array.from({ length: index }, (_, i) => index - 1 - i),
    ...Array.from({ length: scale.length - index - 1 }, (_, i) => index + 1 + i),
  ];
  for (const i of order) {
    const pool = at(scale[i]);
    if (pool.length > 0) return pool;
  }
  return [];
}
