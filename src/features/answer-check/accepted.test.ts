import { content } from '@/content';
import { getLanguage } from '@/features/languages';

import { acceptedAnswers, knownForms } from './accepted';
import { checkAnswer } from './check';

describe('accepted answers from content', () => {
  it('lists the main text first, then alternatives', () => {
    expect(acceptedAnswers(content, 'tr', 'emotion.reluctant')).toEqual(['isteksiz', 'gönülsüz']);
    expect(acceptedAnswers(content, 'en', 'fruit.kiwi')).toEqual([]);
  });

  it('collects canonical forms without articles', () => {
    const forms = knownForms(content, 'en');
    expect(forms.has('apple')).toBe(true);
    expect(forms.has('she was reluctant to leave the party early')).toBe(true);
  });

  it('works end to end', () => {
    const en = getLanguage('en');
    const known = knownForms(content, 'en');
    // "pear" is a real word in the content, so it is wrong for "apple", not a typo.
    expect(
      checkAnswer(en, 'pear', acceptedAnswers(content, 'en', 'fruit.apple'), known).verdict,
    ).toBe('wrong');
    expect(
      checkAnswer(en, 'unwilling', acceptedAnswers(content, 'en', 'emotion.reluctant'), known)
        .verdict,
    ).toBe('correct');
  });
});
