import type { FeedbackEvent } from './feedbackEvents';

const SOURCES: Record<FeedbackEvent, number> = {
  tap: require('../../assets/audio/sfx/tap.wav'),
  correct: require('../../assets/audio/sfx/correct.wav'),
  wrong: require('../../assets/audio/sfx/wrong.wav'),
  combo3: require('../../assets/audio/sfx/combo3.wav'),
  combo5: require('../../assets/audio/sfx/combo5.wav'),
  combo10: require('../../assets/audio/sfx/combo10.wav'),
  complete: require('../../assets/audio/sfx/complete.wav'),
  levelUp: require('../../assets/audio/sfx/levelUp.wav'),
};

type Player = { play(): void; seekTo(seconds: number): unknown };
type AudioModule = {
  createAudioPlayer(source: number): Player;
  setAudioModeAsync(mode: { playsInSilentMode: boolean }): Promise<void>;
};

let audio: AudioModule | null | undefined;
const players = new Map<FeedbackEvent, Player>();

/**
 * expo-audio is loaded lazily and guarded: a development build made before it
 * was added has no native module, and sound must then fail silently instead of
 * crashing the app.
 */
function loadAudio(): AudioModule | null {
  if (audio !== undefined) return audio;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audio = require('expo-audio') as AudioModule;
    // iOS: respect the silent switch (game-feel skill). Android has no switch;
    // the media volume applies there.
    audio.setAudioModeAsync({ playsInSilentMode: false }).catch(() => undefined);
  } catch {
    audio = null;
  }
  return audio;
}

/** Plays a short effect from the start; never throws. */
export function playSound(event: FeedbackEvent): void {
  const module = loadAudio();
  if (!module) return;
  try {
    let player = players.get(event);
    if (!player) {
      player = module.createAudioPlayer(SOURCES[event]);
      players.set(event, player);
    }
    player.seekTo(0);
    player.play();
  } catch {
    // A missing or broken audio route must not break the game.
  }
}
