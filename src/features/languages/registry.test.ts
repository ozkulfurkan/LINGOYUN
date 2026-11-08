import { LANGUAGE_CODES } from './types';
import { allCharsets, getLanguage, isLanguageCode, LANGUAGES } from './registry';

describe('language registry', () => {
  it('has a definition for every language code', () => {
    for (const code of LANGUAGE_CODES) {
      expect(LANGUAGES[code].code).toBe(code);
    }
  });

  it('recognises only supported codes', () => {
    expect(isLanguageCode('tr')).toBe(true);
    expect(isLanguageCode('en')).toBe(true);
    expect(isLanguageCode('de')).toBe(false);
    expect(isLanguageCode('TR')).toBe(false);
  });

  describe('Turkish case mapping', () => {
    const tr = getLanguage('tr');

    it('lowercases dotted and dotless I correctly', () => {
      expect(tr.toLower('IĞDIR')).toBe('ığdır');
      expect(tr.toLower('İSTANBUL')).toBe('istanbul');
      expect(tr.toLower('ÇÖŞÜ')).toBe('çöşü');
    });

    it('uppercases i and ı correctly', () => {
      expect(tr.toUpper('istanbul')).toBe('İSTANBUL');
      expect(tr.toUpper('ılık')).toBe('ILIK');
      expect(tr.toUpper('kişi')).toBe('KİŞİ');
    });
  });

  it('uses plain case mapping for English', () => {
    const en = getLanguage('en');
    expect(en.toUpper('i like it')).toBe('I LIKE IT');
    expect(en.toLower('ISTANBUL')).toBe('istanbul');
  });

  it('collects the special letters fonts must cover', () => {
    const chars = allCharsets();
    for (const ch of 'çğıİöşüÇĞÖŞÜ') expect(chars).toContain(ch);
    expect(new Set(chars).size).toBe([...chars].length);
  });
});
