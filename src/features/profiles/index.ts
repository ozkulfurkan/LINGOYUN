import { loadProfiles, saveProfiles } from '@/storage/profiles';
import { removePaths } from '@/storage/path';
import { removeProgress } from '@/storage/progress';
import { removeDecks } from '@/storage/srs';

import { getActiveProfile, removeProfile } from './profiles';
import { createProfilesStore, useProfilesState } from './store';
import type { Profile, ProfilesState } from './types';

export * from './types';
export * from './profiles';
export { createProfilesStore, type ProfilesStore } from './store';

/** The app's profile store, persisted in MMKV. */
export const profilesStore = createProfilesStore({ load: loadProfiles, save: saveProfiles });

export function useProfiles(): ProfilesState {
  return useProfilesState(profilesStore);
}

export function useActiveProfile(): Profile | null {
  return getActiveProfile(useProfiles());
}

/** Deletes a profile and everything stored for it on the device. */
export function deleteProfile(id: string): void {
  profilesStore.update((state) => ({ ok: true, value: removeProfile(state, id) }));
  removeDecks(id);
  removeProgress(id);
  removePaths(id);
}
