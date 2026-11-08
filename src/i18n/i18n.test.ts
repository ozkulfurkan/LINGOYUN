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
  it('uses the first supported device language', () => {
    expect(pickUiLanguage(['tr-TR', 'en-US'])).toBe('tr');
    expect(pickUiLanguage(['de-DE', 'en-GB', 'tr-TR'])).toBe('en');
    expect(pickUiLanguage(['TR'])).toBe('tr');
    expect(pickUiLanguage(['tr_TR'])).toBe('tr');
  });

  it('falls back when nothing is supported', () => {
    expect(pickUiLanguage(['de-DE', 'fr-FR'])).toBe(FALLBACK_UI_LANGUAGE);
    expect(pickUiLanguage([])).toBe(FALLBACK_UI_LANGUAGE);
    expect(pickUiLanguage([null, undefined, ''])).toBe(FALLBACK_UI_LANGUAGE);
  });
});
