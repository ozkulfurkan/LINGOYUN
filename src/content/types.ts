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
  /**
   * A look-alike word that is NOT the meaning (false friend), e.g. "mağaza"
   * for "magazine". Always offered as a wrong option.
   */
  trap?: string;
  /** Short explanation shown after answering, in this language. */
  note?: string;
  /**
   * Items of a list whose order is free, as written in `text`: "eggs, milk,
   * bread and cheese" → ["eggs", "milk", "bread", "cheese"]. Every order of
   * them is accepted (sentences only).
   */
  anyOrder?: string[];
};

export type LanguageContent = {
  words: Record<string, Entry>;
  sentences: Record<string, Entry>;
};

/**
 * Ordered group of concepts in a course. `mini` units are theme worlds and
 * have no level; `kid` and `adult` units belong to a level of the course.
 * A unit with a `theme` teaches a real-life situation at one difficulty; it is
 * played from its theme and stays outside the level ladder.
 */
export type Unit = {
  id: string;
  profileType: ProfileType;
  level?: string;
  /** Situation this unit teaches, e.g. "restaurant". */
  theme?: string;
  concepts: string[];
};

/** Difficulty of a theme's sentences: 1 easy (~5 words), 2 medium (~10), 3 hard (15+). */
export type ThemeTier = '1' | '2' | '3';

/**
 * One stop on the learning path, shown to learners only as a number and a
 * name ("7. Restoranda"). `band` ties it to a level of the course for the
 * placement test and is never shown.
 */
export type Theme = {
  /** Unique within the course, e.g. "adult.greetings". Never renamed once shipped. */
  id: string;
  /** Key under `themes.names` in src/i18n. */
  title: string;
  band: string;
  /** Vocabulary in teaching order; each of the first four steps takes ten. */
  words: string[];
  /** Sentence concepts per difficulty; a missing tier falls back to an easier one. */
  sentences: Partial<Record<ThemeTier, string[]>>;
};

export type CourseContent = {
  id: CourseId;
  units: Unit[];
  /** Learning path per leveled profile type, in teaching order. */
  paths?: Partial<Record<'kid' | 'adult', Theme[]>>;
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
