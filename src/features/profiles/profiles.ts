import { findCourse, getLanguage, type CourseId } from '@/features/languages';

import {
  PROFILE_TYPES,
  type CourseProgress,
  type Profile,
  type ProfilesState,
  type ProfileType,
} from './types';

/** One family subscription covers up to this many profiles. */
export const MAX_PROFILES = 3;
export const NICKNAME_MAX_LENGTH = 20;

export const EMPTY_STATE: ProfilesState = { profiles: [], activeId: null };

export type ProfileError =
  | 'nicknameEmpty'
  | 'nicknameTooLong'
  | 'nicknameTaken'
  | 'limitReached'
  | 'unknownCourse'
  | 'unknownProfile'
  | 'levelNotAllowed';

export type Result<T> = { ok: true; value: T } | { ok: false; error: ProfileError };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = <T>(error: ProfileError): Result<T> => ({ ok: false, error });

/** Compares nicknames case-insensitively with the course's native-language rules. */
function sameNickname(a: string, b: string, courseId: CourseId): boolean {
  const course = findCourse(courseId);
  const lower = course ? getLanguage(course.nativeLang).toLower : (s: string) => s.toLowerCase();
  return lower(a) === lower(b);
}

/** Trims and collapses spaces; checks length and uniqueness within the family. */
export function validateNickname(
  raw: string,
  state: ProfilesState,
  courseId: CourseId,
  exceptId?: string,
): Result<string> {
  const nickname = raw.trim().replace(/\s+/g, ' ');
  if (!nickname) return fail('nicknameEmpty');
  // Count user-perceived characters, so "İ" or an emoji is one character.
  if ([...nickname].length > NICKNAME_MAX_LENGTH) return fail('nicknameTooLong');
  const taken = state.profiles.some(
    (p) => p.id !== exceptId && sameNickname(p.nickname, nickname, courseId),
  );
  return taken ? fail('nicknameTaken') : ok(nickname);
}

type NewProfile = { nickname: string; type: ProfileType; courseId: CourseId };

/**
 * Adds a profile and makes it active. `id` and `now` are injected so the
 * function stays pure and testable.
 */
export function addProfile(
  state: ProfilesState,
  input: NewProfile,
  { id, now }: { id: string; now: number },
): Result<ProfilesState> {
  if (state.profiles.length >= MAX_PROFILES) return fail('limitReached');
  if (!findCourse(input.courseId)) return fail('unknownCourse');
  const nickname = validateNickname(input.nickname, state, input.courseId);
  if (!nickname.ok) return nickname;

  const profile: Profile = {
    id,
    nickname: nickname.value,
    type: input.type,
    courseId: input.courseId,
    courses: { [input.courseId]: { level: null } },
    createdAt: now,
  };
  return ok({ profiles: [...state.profiles, profile], activeId: id });
}

export function renameProfile(
  state: ProfilesState,
  id: string,
  nickname: string,
): Result<ProfilesState> {
  const profile = state.profiles.find((p) => p.id === id);
  if (!profile) return fail('unknownProfile');
  const checked = validateNickname(nickname, state, profile.courseId, id);
  if (!checked.ok) return checked;
  return ok(replaceProfile(state, { ...profile, nickname: checked.value }));
}

/** Removes a profile; if it was active, the first remaining profile becomes active. */
export function removeProfile(state: ProfilesState, id: string): ProfilesState {
  const profiles = state.profiles.filter((p) => p.id !== id);
  const activeId = state.activeId === id ? (profiles[0]?.id ?? null) : state.activeId;
  return { profiles, activeId };
}

export function setActiveProfile(state: ProfilesState, id: string): Result<ProfilesState> {
  if (!state.profiles.some((p) => p.id === id)) return fail('unknownProfile');
  return ok({ ...state, activeId: id });
}

export function getActiveProfile(state: ProfilesState): Profile | null {
  return state.profiles.find((p) => p.id === state.activeId) ?? null;
}

/**
 * Records the profile's level in its current course (after placement or
 * self-assessment). mini profiles have no levels.
 */
export function setCourseLevel(
  state: ProfilesState,
  id: string,
  level: string,
): Result<ProfilesState> {
  const profile = state.profiles.find((p) => p.id === id);
  if (!profile) return fail('unknownProfile');
  const course = findCourse(profile.courseId);
  if (!course) return fail('unknownCourse');
  if (profile.type === 'mini' || !course.levels[profile.type].includes(level)) {
    return fail('levelNotAllowed');
  }
  const progress: CourseProgress = { ...profile.courses[profile.courseId], level };
  return ok(
    replaceProfile(state, {
      ...profile,
      courses: { ...profile.courses, [profile.courseId]: progress },
    }),
  );
}

function replaceProfile(state: ProfilesState, profile: Profile): ProfilesState {
  return { ...state, profiles: state.profiles.map((p) => (p.id === profile.id ? profile : p)) };
}

/**
 * Rebuilds state from stored JSON. Anything malformed is dropped rather than
 * crashing the app; an active id pointing nowhere falls back to the first profile.
 */
export function parseProfilesState(data: unknown): ProfilesState {
  if (!isRecord(data) || !Array.isArray(data.profiles)) return EMPTY_STATE;
  const profiles = data.profiles.filter(isProfile);
  const activeId =
    typeof data.activeId === 'string' && profiles.some((p) => p.id === data.activeId)
      ? data.activeId
      : (profiles[0]?.id ?? null);
  return { profiles, activeId };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isProfile(v: unknown): v is Profile {
  return (
    isRecord(v) &&
    typeof v.id === 'string' &&
    typeof v.nickname === 'string' &&
    (PROFILE_TYPES as readonly unknown[]).includes(v.type) &&
    typeof v.courseId === 'string' &&
    findCourse(v.courseId) !== undefined &&
    isRecord(v.courses) &&
    typeof v.createdAt === 'number'
  );
}
