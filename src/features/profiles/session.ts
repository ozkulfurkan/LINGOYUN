import type { ProfilesState } from './types';

// Whether someone picked a profile since the app started. Kept in memory on
// purpose: every launch asks "Who is playing?" again when there are several.
let profileChosen = false;

export function markProfileChosen(): void {
  profileChosen = true;
}

/** For tests: forget the choice, as a fresh launch would. */
export function resetProfileChoice(): void {
  profileChosen = false;
}

/** Several profiles and nobody has picked one since the app started. */
export function needsProfilePicker(state: ProfilesState): boolean {
  return !profileChosen && state.profiles.length > 1;
}
