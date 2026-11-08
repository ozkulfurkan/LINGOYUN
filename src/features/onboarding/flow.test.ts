import { addProfile, EMPTY_STATE, type ProfilesState, type ProfileType } from '@/features/profiles';

import { defaultCourseId, onboardingStep, startAtLowestLevel, toUiUpper } from './flow';

function withProfile(type: ProfileType): ProfilesState {
  const result = addProfile(
    EMPTY_STATE,
    { nickname: 'Deniz', type, courseId: 'tr-en' },
    { id: 'p1', now: 1 },
  );
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

function levelOf(state: ProfilesState): string | null | undefined {
  return state.profiles[0].courses['tr-en']?.level;
}

describe('onboardingStep', () => {
  it('asks for a profile when there is none', () => {
    expect(onboardingStep(EMPTY_STATE)).toBe('createProfile');
  });

  it('skips self-assessment for mini', () => {
    expect(onboardingStep(withProfile('mini'))).toBe('done');
  });

  it.each(['kid', 'adult'] as const)('asks %s for self-assessment until a level is set', (type) => {
    const state = withProfile(type);
    expect(onboardingStep(state)).toBe('selfAssessment');
    const placed = startAtLowestLevel(state, 'p1');
    if (!placed.ok) throw new Error(placed.error);
    expect(onboardingStep(placed.value)).toBe('done');
  });
});

describe('startAtLowestLevel', () => {
  it.each([
    ['adult', 'A1'],
    ['kid', 'L1'],
  ] as const)('puts %s at %s', (type, level) => {
    const result = startAtLowestLevel(withProfile(type), 'p1');
    if (!result.ok) throw new Error(result.error);
    expect(levelOf(result.value)).toBe(level);
  });

  it('refuses mini profiles and unknown ids', () => {
    expect(startAtLowestLevel(withProfile('mini'), 'p1')).toEqual({
      ok: false,
      error: 'levelNotAllowed',
    });
    expect(startAtLowestLevel(withProfile('kid'), 'nope')).toEqual({
      ok: false,
      error: 'unknownProfile',
    });
  });
});

describe('defaultCourseId', () => {
  it('uses the course for a speaker of the UI language', () => {
    expect(defaultCourseId('tr')).toBe('tr-en');
  });

  it('falls back to the first course when the language has none', () => {
    expect(defaultCourseId('en')).toBe('tr-en');
    expect(defaultCourseId('xx')).toBe('tr-en');
  });
});

describe('toUiUpper', () => {
  it('follows the language rules for i', () => {
    expect(toUiUpper('tr', 'seviye')).toBe('SEVİYE');
    expect(toUiUpper('en', 'level i')).toBe('LEVEL I');
  });

  it('still uppercases for an unknown language', () => {
    expect(toUiUpper('xx', 'level')).toBe('LEVEL');
  });
});
