// The content shipped in the app. Metro needs static imports, so every file is
// listed here. Adding a language: add its folder and a line to `languages`
// (the Record type makes a missing language a compile error).
import emotions from './concepts/emotions.json';
import fruits from './concepts/fruits.json';
import trEn from './courses/tr-en.json';
import enSentences from './languages/en/sentences.json';
import enWords from './languages/en/words.json';
import trSentences from './languages/tr/sentences.json';
import trWords from './languages/tr/words.json';
import type { Concept, ContentBundle, CourseContent } from './types';

// JSON imports are typed loosely (kind: string); validate.test.ts checks the
// real shape at test time.
export const content: ContentBundle = {
  concepts: [...fruits, ...emotions] as Concept[],
  languages: {
    tr: { words: trWords, sentences: trSentences },
    en: { words: enWords, sentences: enSentences },
  },
  courses: [trEn as CourseContent],
};
