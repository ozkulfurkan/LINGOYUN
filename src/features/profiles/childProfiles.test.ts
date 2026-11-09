import { addProfile, canAddProfile, EMPTY_STATE, MAX_PROFILES } from './profiles';
import type { ProfilesState } from './types';
import { markProfileChosen, needsProfilePicker, resetProfileChoice } from './session';

function add(state: ProfilesState, nickname: string, id: string, activate?: boolean) {
  const result = addProfile(
    state,
    { nickname, type: 'kid', courseId: 'tr-en' },
    { id, now: 1 },
    activate === undefined ? undefined : { activate },
  );
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('adding a child profile', () => {
  it('keeps the current profile active when asked to', () => {
    const parent = add(EMPTY_STATE, 'Furkan', 'p');
    const withChild = add(parent, 'Deniz', 'c', false);
    expect(withChild.profiles.map((p) => p.id)).toEqual(['p', 'c']);
    expect(withChild.activeId).toBe('p');
  });

  it('still activates the first profile there is', () => {
    expect(add(EMPTY_STATE, 'Deniz', 'c', false).activeId).toBe('c');
  });

  it('activates new profiles by default, as onboarding does', () => {
    expect(add(add(EMPTY_STATE, 'Furkan', 'p'), 'Deniz', 'c').activeId).toBe('c');
  });

  it('stops at the family limit', () => {
    let state = EMPTY_STATE;
    for (let i = 0; i < MAX_PROFILES; i++) {
      expect(canAddProfile(state)).toBe(true);
      state = add(state, `Ad ${i}`, `id${i}`);
    }
    expect(canAddProfile(state)).toBe(false);
  });
});

describe('who is playing', () => {
  beforeEach(resetProfileChoice);

  it('asks only when there are several profiles', () => {
    const one = add(EMPTY_STATE, 'Furkan', 'p');
    expect(needsProfilePicker(one)).toBe(false);
    expect(needsProfilePicker(add(one, 'Deniz', 'c', false))).toBe(true);
  });

  it('asks once per launch', () => {
    const two = add(add(EMPTY_STATE, 'Furkan', 'p'), 'Deniz', 'c', false);
    markProfileChosen();
    expect(needsProfilePicker(two)).toBe(false);
  });
});
