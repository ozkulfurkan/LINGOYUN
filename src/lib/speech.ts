import * as Speech from 'expo-speech';

import { getLanguage, type LanguageCode } from '@/features/languages';

import { loadAudio, type AudioPlayerLike } from './sound';
import { VOICE_CLIPS } from './voiceClips';

/** Speech rate of the "listen slowly" button: half the normal speed. */
export const SLOW_RATE = 0.5;
/** A clip that never reports its end must not block what comes after it. */
const CLIP_TIMEOUT_MS = 8_000;

export type SpokenPart = { text: string; language: LanguageCode };

/** The recorded clip for a text (scripts/voices.mjs), or null to use the phone's speech. */
export function clipFor(
  text: string,
  language: LanguageCode,
  clips: Readonly<Record<string, number>> = VOICE_CLIPS,
): number | null {
  return clips[`${language}|${text.trim()}`] ?? null;
}

// Every new utterance gets a number; parts of an older one stop when it changes.
let generation = 0;
let current: AudioPlayerLike | null = null;

/** Reads text aloud in the given language, cutting off anything still playing. */
export function speak(text: string, language: LanguageCode, { slow = false } = {}): void {
  // The slow button is for the phone's speech: recordings have one speed.
  if (!slow && clipFor(text, language) !== null) return speakSequence([{ text, language }]);
  stopSpeaking();
  Speech.speak(text, {
    language: getLanguage(language).ttsVoice,
    ...(slow ? { rate: SLOW_RATE } : {}),
  });
}

export function stopSpeaking(): void {
  generation++;
  if (current) {
    try {
      current.pause();
      current.remove();
    } catch {
      // Already released.
    }
    current = null;
  }
  // Stopping when nothing is playing, or on a device without speech, is harmless.
  Speech.stop().catch(() => undefined);
}

/**
 * Reads several parts one after another, each in its own language, e.g. a
 * Turkish instruction followed by the English word. Recorded clips play where
 * they exist; the rest is read by the phone's speech engine.
 */
export function speakSequence(parts: readonly SpokenPart[]): void {
  stopSpeaking();
  const said = parts.filter((p) => p.text.trim());
  if (!said.some((p) => clipFor(p.text, p.language) !== null)) {
    // No recordings: the platform engines queue utterances themselves.
    for (const { text, language } of said) {
      Speech.speak(text, { language: getLanguage(language).ttsVoice });
    }
    return;
  }
  void playParts(said, generation);
}

async function playParts(parts: readonly SpokenPart[], run: number): Promise<void> {
  for (const part of parts) {
    if (run !== generation) return;
    const clip = clipFor(part.text, part.language);
    if (clip !== null && (await playClip(clip, run))) continue;
    if (run !== generation) return;
    await say(part);
  }
}

/** Plays a clip to its end; false when audio is unavailable, so speech takes over. */
function playClip(clip: number, run: number): Promise<boolean> {
  const audio = loadAudio();
  if (!audio) return Promise.resolve(false);
  return new Promise((resolve) => {
    let player: AudioPlayerLike;
    try {
      player = audio.createAudioPlayer(clip);
    } catch {
      return resolve(false);
    }
    current = player;
    const finish = (played: boolean) => {
      clearTimeout(timer);
      subscription?.remove();
      if (current === player) {
        current = null;
        try {
          player.remove();
        } catch {
          // Already released.
        }
      }
      resolve(played || run !== generation);
    };
    const timer = setTimeout(() => finish(true), CLIP_TIMEOUT_MS);
    const subscription = player.addListener?.('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) finish(true);
    });
    try {
      player.play();
    } catch {
      finish(false);
    }
  });
}

function say({ text, language }: SpokenPart): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(text, {
      language: getLanguage(language).ttsVoice,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}
