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
