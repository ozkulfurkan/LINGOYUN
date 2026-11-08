import { selectTheme } from './selectTheme';

describe('selectTheme', () => {
  it('always uses the kids theme for children and before a profile exists', () => {
    for (const profile of ['mini', 'kid', null] as const) {
      for (const scheme of ['light', 'dark', null] as const) {
        expect(selectTheme(profile, scheme).name).toBe('kids');
        expect(selectTheme(profile, scheme, 'dark').name).toBe('kids');
      }
    }
  });

  it('follows the system scheme for adults by default', () => {
    expect(selectTheme('adult', 'light').name).toBe('adultLight');
    expect(selectTheme('adult', 'dark').name).toBe('adultDark');
    expect(selectTheme('adult', null).name).toBe('adultLight');
    expect(selectTheme('adult', undefined).name).toBe('adultLight');
  });

  it('lets adults override the system scheme', () => {
    expect(selectTheme('adult', 'light', 'dark').name).toBe('adultDark');
    expect(selectTheme('adult', 'dark', 'light').name).toBe('adultLight');
    expect(selectTheme('adult', 'dark', 'system').name).toBe('adultDark');
  });
});
