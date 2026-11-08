import type { LanguageCode } from '@/features/languages';

/**
 * targetToNative: show the learned language, answer in the native one (EN → TR).
 * nativeToTarget: show the native language, answer in the learned one (TR → EN).
 */
export type Direction = 'targetToNative' | 'nativeToTarget';

export type QuizOption = {
  conceptId: string;
  /** Answer text in the answer language. */
  text: string;
  /** Illustration key, for picture options (mini). */
  image?: string;
};

export type Question = {
  conceptId: string;
  direction: Direction;
  promptLang: LanguageCode;
  answerLang: LanguageCode;
  /** Text shown (or spoken) as the question. */
  prompt: string;
  image?: string;
  options: QuizOption[];
  correctIndex: number;
};
