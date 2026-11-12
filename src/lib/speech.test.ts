import * as Speech from 'expo-speech';

import { clipFor, speakSequence, stopSpeaking } from './speech';

jest.mock('expo-speech', () => ({
  speak: jest.fn((_text: string, options?: { onDone?: () => void }) => options?.onDone?.()),
  stop: jest.fn(() => Promise.resolve()),
}));

// One recorded clip; everything else falls back to the phone's speech.
jest.mock('./voiceClips', () => ({ VOICE_CLIPS: { 'en|apple': 7 } }));

type Listener = (status: { didJustFinish: boolean }) => void;
const played: number[] = [];
const players: { listener?: Listener }[] = [];
jest.mock('./sound', () => ({
  loadAudio: () => ({
    createAudioPlayer: (clip: number) => {
      const player: { listener?: Listener } & Record<string, unknown> = {
        play: () => played.push(clip),
        pause: jest.fn(),
        remove: jest.fn(),
        seekTo: jest.fn(),
        addListener: (_event: string, listener: Listener) => {
          player.listener = listener;
          return { remove: jest.fn() };
        },
      };
      players.push(player);
      return player;
    },
    setAudioModeAsync: () => Promise.resolve(),
  }),
}));

const flush = () => new Promise((r) => setImmediate(r));
const spoken = () => jest.mocked(Speech.speak).mock.calls.map((c) => c[0]);

beforeEach(() => {
  jest.mocked(Speech.speak).mockClear();
  played.length = 0;
  players.length = 0;
});

describe('clipFor', () => {
  const clips = { 'tr|Aferin!': 1, 'en|apple': 2 };
  it('finds a clip by language and text', () => {
    expect(clipFor('Aferin!', 'tr', clips)).toBe(1);
    expect(clipFor(' apple ', 'en', clips)).toBe(2);
  });
  it('has none for other texts or languages', () => {
    expect(clipFor('apple', 'tr', clips)).toBeNull();
    expect(clipFor('pear', 'en', clips)).toBeNull();
  });
});

describe('speakSequence', () => {
  it('speaks everything through the phone when nothing is recorded', () => {
    speakSequence([
      { text: 'Hangisi?', language: 'tr' },
      { text: 'pear', language: 'en' },
    ]);
    expect(spoken()).toEqual(['Hangisi?', 'pear']);
    expect(played).toEqual([]);
  });

  it('plays a recording in its turn, then goes on after it ends', async () => {
    speakSequence([
      { text: 'Hangisi?', language: 'tr' },
      { text: 'apple', language: 'en' },
      { text: 'Aferin!', language: 'tr' },
    ]);
    await flush();
    expect(spoken()).toEqual(['Hangisi?']);
    expect(played).toEqual([7]);
    players[0].listener?.({ didJustFinish: true });
    await flush();
    expect(spoken()).toEqual(['Hangisi?', 'Aferin!']);
  });

  it("a screen's cancel stops only its own words, never the next screen's", async () => {
    const cancelHome = speakSequence([{ text: 'Merhaba!', language: 'tr' }]);
    // The game opens and speaks; then the home screen loses focus and cleans up.
    const cancelGame = speakSequence([
      { text: 'apple', language: 'en' },
      { text: 'Aferin!', language: 'tr' },
    ]);
    cancelHome();
    await flush();
    expect(played).toEqual([7]);
    players[0].listener?.({ didJustFinish: true });
    await flush();
    expect(spoken()).toEqual(['Merhaba!', 'Aferin!']);

    jest.mocked(Speech.speak).mockClear();
    speakSequence([
      { text: 'apple', language: 'en' },
      { text: 'Aferin!', language: 'tr' },
    ]);
    cancelGame(); // an old cancel: the new words keep going
    await flush();
    players[1].listener?.({ didJustFinish: true });
    await flush();
    expect(spoken()).toEqual(['Aferin!']);
  });

  it('drops the rest when stopped', async () => {
    speakSequence([
      { text: 'apple', language: 'en' },
      { text: 'Aferin!', language: 'tr' },
    ]);
    await flush();
    stopSpeaking();
    players[0].listener?.({ didJustFinish: true });
    await flush();
    expect(spoken()).toEqual([]);
  });
});
