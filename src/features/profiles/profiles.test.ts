import {
  addProfile,
  EMPTY_STATE,
  getActiveProfile,
  MAX_PROFILES,
  parseProfilesState,
  removeProfile,
  renameProfile,
  setActiveProfile,
  setCourseLevel,
  validateNickname,
  type Result,
} from './profiles';
import type { ProfilesState, ProfileType } from './types';

function unwrap<T>(r: Result<T>): T {
  if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
  return r.value;
}

let seq = 0;
function add(state: ProfilesState, nickname: string, type: ProfileType = 'kid') {
  seq += 1;
  return addProfile(state, { nickname, type, courseId: 'tr-en' }, { id: `p${seq}`, now: seq });
}

describe('validateNickname', () => {
  it('trims and collapses spaces', () => {
    expect(validateNickname('  Zeynep   Su ', EMPTY_STATE, 'tr-en')).toEqual({
      ok: true,
      value: 'Zeynep Su',
    });
  });

  it('rejects empty and too long names', () => {
    expect(validateNickname('   ', EMPTY_STATE, 'tr-en')).toEqual({
      ok: false,
      error: 'nicknameEmpty',
    });
    expect(validateNickname('a'.repeat(21), EMPTY_STATE, 'tr-en')).toEqual({
      ok: false,
      error: 'nicknameTooLong',
    });
    // 20 Turkish letters are fine: length counts characters, not code units.
    expect(validateNickname('İ'.repeat(20), EMPTY_STATE, 'tr-en').ok).toBe(true);
  });

  it('rejects names already used in the family, with Turkish case rules', () => {
    const state = unwrap(add(EMPTY_STATE, 'IŞIL'));
    expect(validateNickname('ışıl', state, 'tr-en')).toEqual({ ok: false, error: 'nicknameTaken' });
    // "isil" is a different name in Turkish (dotted i), so it is allowed.
    expect(validateNickname('isil', state, 'tr-en').ok).toBe(true);
  });
});

describe('addProfile', () => {
  it('adds a profile, makes it active and starts its course unplaced', () => {
    const state = unwrap(
      addProfile(
        EMPTY_STATE,
        { nickname: 'Nehir', type: 'mini', courseId: 'tr-en' },
        { id: 'a', now: 42 },
      ),
    );
    expect(state.activeId).toBe('a');
    expect(state.profiles).toEqual([
      {
        id: 'a',
        nickname: 'Nehir',
        type: 'mini',
        courseId: 'tr-en',
        courses: { 'tr-en': { level: null } },
        createdAt: 42,
      },
    ]);
  });

  it(`stops at ${MAX_PROFILES} profiles`, () => {
    let state = EMPTY_STATE;
    for (let i = 0; i < MAX_PROFILES; i++) state = unwrap(add(state, `Kişi ${i}`));
    expect(add(state, 'Bir fazla')).toEqual({ ok: false, error: 'limitReached' });
  });

  it('rejects unknown courses', () => {
    expect(
      addProfile(
        EMPTY_STATE,
        { nickname: 'X', type: 'kid', courseId: 'tr-tr' },
        { id: 'x', now: 0 },
      ),
    ).toEqual({ ok: false, error: 'unknownCourse' });
  });
});

describe('profile changes', () => {
  const base = unwrap(add(unwrap(add(EMPTY_STATE, 'Zeynep', 'mini')), 'Kerem', 'kid'));
  const [zeynep, kerem] = base.profiles;

  it('switches the active profile', () => {
    expect(getActiveProfile(base)?.nickname).toBe('Kerem');
    const state = unwrap(setActiveProfile(base, zeynep.id));
    expect(getActiveProfile(state)?.nickname).toBe('Zeynep');
    expect(setActiveProfile(base, 'nope')).toEqual({ ok: false, error: 'unknownProfile' });
  });

  it('renames, keeping uniqueness', () => {
    expect(unwrap(renameProfile(base, kerem.id, ' Kerem Can ')).profiles[1].nickname).toBe(
      'Kerem Can',
    );
    expect(renameProfile(base, kerem.id, 'zeynep')).toEqual({ ok: false, error: 'nicknameTaken' });
    // Renaming to its own name (other case) is allowed.
    expect(renameProfile(base, kerem.id, 'KEREM').ok).toBe(true);
  });

  it('removes a profile and moves the active one to the first remaining', () => {
    const state = removeProfile(base, kerem.id);
    expect(state.profiles.map((p) => p.nickname)).toEqual(['Zeynep']);
    expect(state.activeId).toBe(zeynep.id);
    expect(removeProfile(state, zeynep.id)).toEqual(EMPTY_STATE);
  });

  it('keeps the active profile when another one is removed', () => {
    expect(removeProfile(base, zeynep.id).activeId).toBe(kerem.id);
  });

  it('sets a level from the course scale, per course', () => {
    const state = unwrap(setCourseLevel(base, kerem.id, 'L3'));
    expect(state.profiles[1].courses['tr-en']).toEqual({ level: 'L3' });
    expect(setCourseLevel(base, kerem.id, 'B1')).toEqual({ ok: false, error: 'levelNotAllowed' });
    expect(setCourseLevel(base, zeynep.id, 'L1')).toEqual({ ok: false, error: 'levelNotAllowed' });
  });
});

describe('parseProfilesState', () => {
  const valid = {
    id: 'a',
    nickname: 'Nehir',
    type: 'kid',
    courseId: 'tr-en',
    courses: { 'tr-en': { level: 'L2' } },
    createdAt: 1,
  };

  it('round-trips valid state', () => {
    const state = { profiles: [valid], activeId: 'a' };
    expect(parseProfilesState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });

  it('drops malformed profiles and fixes a dangling active id', () => {
    const data = {
      profiles: [
        valid,
        { ...valid, id: 'b', type: 'teen' },
        { ...valid, id: 'c', courseId: 'xx-yy' },
        null,
      ],
      activeId: 'b',
    };
    expect(parseProfilesState(data)).toEqual({ profiles: [valid], activeId: 'a' });
  });

  it('returns empty state for garbage', () => {
    for (const data of [null, 42, 'x', [], { profiles: 'no' }]) {
      expect(parseProfilesState(data)).toEqual(EMPTY_STATE);
    }
  });
});
