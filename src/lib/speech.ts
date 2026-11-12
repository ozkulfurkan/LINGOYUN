import * as Speech from 'expo-speech';

import { getLanguage, type LanguageCode } from '@/features/languages';

/** Speech rate of the "listen slowly" button: half the normal speed. */
export const SLOW_RATE = 0.5;

/** Reads text aloud in the given language, cutting off anything still playing. */
export function speak(text: string, language: LanguageCode, { slow = false } = {}): void {
  stopSpeaking();
  Speech.speak(text, {
    language: getLanguage(language).ttsVoice,
    ...(slow ? { rate: SLOW_RATE } : {}),
  });
}

export function stopSpeaking(): void {
  // Stopping when nothing is playing, or on a device without speech, is harmless.
  Speech.stop().catch(() => undefined);
}

/**
 * Reads several parts one after another, each in its own language, e.g. a
 * Turkish instruction followed by the English word. The platform speech
 * engines queue utterances, so later parts wait for earlier ones.
 */
export function speakSequence(parts: readonly { text: string; language: LanguageCode }[]): void {
  stopSpeaking();
  for (const { text, language } of parts) {
    if (text.trim()) Speech.speak(text, { language: getLanguage(language).ttsVoice });
  }
}
