import { EMPTY_STATE, parseProfilesState } from '@/features/profiles/profiles';
import type { ProfilesState } from '@/features/profiles/types';

import { storage } from './storage';

// Versioned key: a future incompatible format gets a new key and a migration.
const KEY = 'profiles.v1';

export function loadProfiles(): ProfilesState {
  const raw = storage.getString(KEY);
  if (raw === undefined) return EMPTY_STATE;
  try {
    return parseProfilesState(JSON.parse(raw));
  } catch {
    return EMPTY_STATE;
  }
}

export function saveProfiles(state: ProfilesState): void {
  storage.set(KEY, JSON.stringify(state));
}
