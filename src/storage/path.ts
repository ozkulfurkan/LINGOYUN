import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { findCourse, type CourseId } from '@/features/languages';
import { parsePathProgress, startPath, type PathProgress } from '@/features/path';
import type { Profile } from '@/features/profiles/types';

import { storage } from './storage';

// One path per profile and course.
const key = (profileId: string, courseId: CourseId) => `path.v1.${profileId}.${courseId}`;

/**
 * Where a profile is on its path. Without a stored record (a new profile, or one
 * created before the path existed) it starts at the first theme of the band its
 * level points to.
 */
export function loadPath(profile: Profile): PathProgress {
  const raw = storage.getString(key(profile.id, profile.courseId));
  if (raw !== undefined) {
    try {
      const parsed = parsePathProgress(JSON.parse(raw));
      if (parsed) return parsed;
    } catch {
      // Broken data: fall through to a fresh start.
    }
  }
  const type = profile.type === 'mini' ? 'kid' : profile.type;
  const scale = findCourse(profile.courseId)?.levels[type] ?? [];
  const band = profile.courses[profile.courseId]?.level ?? scale[0] ?? '';
  return startPath(pathOf(content, profile.courseId, type), scale, band);
}

export function savePath(profileId: string, courseId: CourseId, progress: PathProgress): void {
  storage.set(key(profileId, courseId), JSON.stringify(progress));
}

/** Removes every path of a profile (call when the profile is deleted). */
export function removePaths(profileId: string): void {
  const prefix = `path.v1.${profileId}.`;
  for (const k of storage.getAllKeys()) {
    if (k.startsWith(prefix)) storage.remove(k);
  }
}
