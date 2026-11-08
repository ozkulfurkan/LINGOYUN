import { loadProfiles, saveProfiles } from '@/storage/profiles';

import { getActiveProfile } from './profiles';
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
