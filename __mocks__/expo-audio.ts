// Used automatically by Jest for 'expo-audio' (no native module under Jest).
export const createAudioPlayer = jest.fn(() => ({ play: jest.fn(), seekTo: jest.fn() }));
export const setAudioModeAsync = jest.fn(() => Promise.resolve());
