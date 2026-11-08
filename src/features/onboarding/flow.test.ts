import { addProfile, EMPTY_STATE, type ProfilesState, type ProfileType } from '@/features/profiles';

import { applySelfAssessment, defaultCourseId, onboardingStep, toUiUpper } from './flow';

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
    const placed = applySelfAssessment(state, 'p1', 'none');
    if (!placed.ok) throw new Error(placed.error);
    expect(onboardingStep(placed.value)).toBe('done');
  });
});

describe('applySelfAssessment', () => {
  it.each([
    ['adult', 'none', 'A1'],
    ['adult', 'some', 'A2'],
    ['adult', 'mid', 'B1'],
    ['adult', 'good', 'B2'],
    ['kid', 'none', 'L1'],
    ['kid', 'some', 'L3'],
    ['kid', 'mid', 'L6'],
    ['kid', 'good', 'L8'],
  ] as const)('%s + %s starts at %s', (type, self, level) => {
    const result = applySelfAssessment(withProfile(type), 'p1', self);
    if (!result.ok) throw new Error(result.error);
    expect(levelOf(result.value)).toBe(level);
  });

  it('refuses mini profiles and unknown ids', () => {
    expect(applySelfAssessment(withProfile('mini'), 'p1', 'mid')).toEqual({
      ok: false,
      error: 'levelNotAllowed',
    });
    expect(applySelfAssessment(withProfile('kid'), 'nope', 'mid')).toEqual({
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
