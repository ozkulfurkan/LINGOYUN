/** mini = 2–7, kid = 7–12, adult = adults. */
export const PROFILE_TYPES = ['mini', 'kid', 'adult'] as const;

export type ProfileType = (typeof PROFILE_TYPES)[number];
