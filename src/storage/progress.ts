import { EMPTY_PROGRESS, parseProgress, type Progress } from '@/features/progress';

import { storage } from './storage';

const key = (profileId: string) => `progress.v1.${profileId}`;

export function loadProgress(profileId: string): Progress {
  const raw = storage.getString(key(profileId));
  if (raw === undefined) return EMPTY_PROGRESS;
  try {
    return parseProgress(JSON.parse(raw));
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(profileId: string, progress: Progress): void {
  storage.set(key(profileId), JSON.stringify(progress));
}

export function removeProgress(profileId: string): void {
  storage.remove(key(profileId));
}
