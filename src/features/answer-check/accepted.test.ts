import { content } from '@/content';
import { getLanguage } from '@/features/languages';

import { acceptedAnswers, knownForms, twinAnswers } from './accepted';
import { checkAnswer, checkAnswerWithTwins } from './check';

describe('answers of concepts with the same prompt', () => {
  it('finds the other concept that accepts the prompt', () => {
    // "hiç" is time_links.ever; time.never also accepts "hiç".
    expect(twinAnswers(content, 'tr', 'en', 'time_links.ever')).toContain('never');
    expect(twinAnswers(content, 'tr', 'en', 'time_links.ever')).not.toContain('ever');
  });

  it('only looks the prompt text up, not the alternatives of this concept', () => {
    // time.never is shown as "asla"; nothing else is "asla", so no twins.
    expect(twinAnswers(content, 'tr', 'en', 'time.never')).not.toContain('ever');
  });

  it('turns a twin answer into otherWord, a real wrong answer stays wrong', () => {
    const en = getLanguage('en');
    const accepted = acceptedAnswers(content, 'en', 'time_links.ever');
    const twins = twinAnswers(content, 'tr', 'en', 'time_links.ever');
    expect(checkAnswerWithTwins(en, 'Never', accepted, twins)).toEqual({
      verdict: 'otherWord',
      expected: 'ever',
    });
    expect(checkAnswerWithTwins(en, 'ever', accepted, twins).verdict).toBe('correct');
    expect(checkAnswerWithTwins(en, 'always', accepted, twins).verdict).toBe('wrong');
  });
});

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
