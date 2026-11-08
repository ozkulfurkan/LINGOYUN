// The content shipped in the app. Metro needs static imports, so every file is
// listed here. Adding a language: add its folder and a line to `languages`
// (the Record type makes a missing language a compile error).
import actions from './concepts/actions.json';
import animals from './concepts/animals.json';
import body from './concepts/body.json';
import colors from './concepts/colors.json';
import descriptions from './concepts/descriptions.json';
import emotions from './concepts/emotions.json';
import family from './concepts/family.json';
import food from './concepts/food.json';
import greetings from './concepts/greetings.json';
import home from './concepts/home.json';
import nature from './concepts/nature.json';
import places from './concepts/places.json';
import pronouns from './concepts/pronouns.json';
import questions from './concepts/questions.json';
import school from './concepts/school.json';
import sentences from './concepts/sentences.json';
import time from './concepts/time.json';
import trEn from './courses/tr-en.json';
import enSentences from './languages/en/sentences.json';
import enWords from './languages/en/words.json';
import trSentences from './languages/tr/sentences.json';
import trWords from './languages/tr/words.json';
import type { Concept, ContentBundle, CourseContent } from './types';

// JSON imports are typed loosely (kind: string); validate.test.ts checks the
// real shape at test time.
export const content: ContentBundle = {
  concepts: [
    ...animals,
    ...food,
    ...colors,
    ...body,
    ...home,
    ...nature,
    ...emotions,
    ...greetings,
    ...family,
    ...pronouns,
    ...school,
    ...time,
    ...actions,
    ...descriptions,
    ...places,
    ...questions,
    ...sentences,
  ] as Concept[],
  languages: {
    tr: { words: trWords, sentences: trSentences },
    en: { words: enWords, sentences: enSentences },
  },
  courses: [trEn as CourseContent],
};
