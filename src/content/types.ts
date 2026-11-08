import type { CourseId, LanguageCode } from '@/features/languages';
import type { ProfileType } from '@/features/profiles/types';

export type ConceptKind = 'word' | 'phrase' | 'idiom' | 'sentence';

/** Language-independent meaning. Image, topic and audio key hang off the id. */
export type Concept = {
  /** Dotted id: "<topic>.<name>", e.g. "fruit.apple". Never renamed once shipped. */
  id: string;
  topic: string;
  kind: ConceptKind;
  /** Profile types that may see this concept. */
  ageGroups: ProfileType[];
  /** Illustration key; required for concepts shown to `mini` profiles. */
  image?: string;
  /** Part of speech or other hints, e.g. ["noun", "concrete"]. */
  tags?: string[];
};

/** How one language says a concept. */
export type Entry = {
  text: string;
  /** Other answers accepted as correct (synonyms, alternative phrasings). */
  alt?: string[];
  /** Article/particle shown with the word, e.g. English "an" for "apple". */
  article?: string;
  /** Translation still needs a human check (content is not invented). */
  review?: boolean;
};

export type LanguageContent = {
  words: Record<string, Entry>;
  sentences: Record<string, Entry>;
};

/**
 * Ordered group of concepts in a course. `mini` units are theme worlds and
 * have no level; `kid` and `adult` units belong to a level of the course.
 */
export type Unit = {
  id: string;
  profileType: ProfileType;
  level?: string;
  concepts: string[];
};

export type CourseContent = {
  id: CourseId;
  units: Unit[];
};

export type ContentBundle = {
  concepts: Concept[];
  languages: Record<LanguageCode, LanguageContent>;
  courses: CourseContent[];
};

export type ContentIssue = {
  severity: 'error' | 'warning';
  /** Where the problem is, e.g. "languages/en/words.json › fruit.apple". */
  where: string;
  message: string;
};
