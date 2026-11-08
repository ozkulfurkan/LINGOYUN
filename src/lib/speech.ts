import * as Speech from 'expo-speech';

import { getLanguage, type LanguageCode } from '@/features/languages';

/** Reads text aloud in the given language, cutting off anything still playing. */
export function speak(text: string, language: LanguageCode): void {
  stopSpeaking();
  Speech.speak(text, { language: getLanguage(language).ttsVoice });
}

export function stopSpeaking(): void {
  // Stopping when nothing is playing, or on a device without speech, is harmless.
  Speech.stop().catch(() => undefined);
}
