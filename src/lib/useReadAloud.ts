import { useEffect } from 'react';

import type { ProfileType } from '@/features/profiles/types';
import type { Question } from '@/features/quiz/types';

import { speak, stopSpeaking } from './speech';

/**
 * Younger readers hear each question without asking (kids-ux skill); adults use
 * the speaker button. Leaving a question cuts off its sound.
 */
export function useReadAloud(question: Question | null, profileType: ProfileType): void {
  useEffect(() => {
    if (question && profileType === 'kid') speak(question.prompt, question.promptLang);
    return stopSpeaking;
  }, [question, profileType]);
}
