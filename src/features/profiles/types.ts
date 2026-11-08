import type { CourseId } from '@/features/languages';

/** mini = 2–7, kid = 7–12, adult = adults. */
export const PROFILE_TYPES = ['mini', 'kid', 'adult'] as const;

export type ProfileType = (typeof PROFILE_TYPES)[number];

/** Per-course state. Detailed progress (XP, streak…) arrives in LNG-11. */
export type CourseProgress = {
  /** Level from the placement test or self-assessment; null until placed. Always null for mini. */
  level: string | null;
};

/**
 * A family member. Privacy: only a nickname is stored (no real name, age or
 * birth date), and it never leaves the device.
 */
export type Profile = {
  id: string;
  nickname: string;
  type: ProfileType;
  /** Course the profile is currently studying. */
  courseId: CourseId;
  courses: Partial<Record<CourseId, CourseProgress>>;
  /** Epoch ms. */
  createdAt: number;
};

export type ProfilesState = {
  profiles: Profile[];
  activeId: string | null;
};
