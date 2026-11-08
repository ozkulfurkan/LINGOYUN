import { LANGUAGE_CODES } from '@/features/languages';

import { FALLBACK_UI_LANGUAGE, pickUiLanguage } from './pickUiLanguage';
import { resources } from './resources';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value, path) };
  }, {});
}

const reference = flatten(resources.tr.translation);

describe('UI strings', () => {
  it.each(LANGUAGE_CODES)('%s has exactly the same keys as tr', (code) => {
    const keys = Object.keys(flatten(resources[code].translation)).sort();
    expect(keys).toEqual(Object.keys(reference).sort());
  });

  it.each(LANGUAGE_CODES)('%s has no empty strings', (code) => {
    for (const [key, value] of Object.entries(flatten(resources[code].translation))) {
      expect({ key, empty: value.trim() === '' }).toEqual({ key, empty: false });
    }
  });
});

describe('pickUiLanguage', () => {
  it('uses the phone language when it is supported', () => {
    expect(pickUiLanguage(['tr-TR', 'en-US'])).toBe('tr');
    expect(pickUiLanguage(['en-GB', 'tr-TR'])).toBe('en');
    expect(pickUiLanguage(['TR'])).toBe('tr');
    expect(pickUiLanguage(['tr_TR'])).toBe('tr');
  });

  it('falls back to English otherwise, ignoring secondary languages', () => {
    expect(FALLBACK_UI_LANGUAGE).toBe('en');
    expect(pickUiLanguage(['de-DE', 'tr-TR'])).toBe('en');
    expect(pickUiLanguage(['fr-FR'])).toBe('en');
    expect(pickUiLanguage([])).toBe('en');
    expect(pickUiLanguage([null])).toBe('en');
    expect(pickUiLanguage([''])).toBe('en');
  });
});
