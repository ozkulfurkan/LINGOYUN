import { DEFAULT_SETTINGS, loadSettings, parseSettings, saveSettings } from './settings';
import { storage } from './storage';

describe('settings', () => {
  beforeEach(() => storage.clearAll());

  it('defaults to sound and haptics on', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('saves, loads and repairs bad data', () => {
    saveSettings({ sound: false, haptics: true });
    expect(loadSettings()).toEqual({ sound: false, haptics: true });
    expect(parseSettings({ sound: 'no' })).toEqual(DEFAULT_SETTINGS);
    storage.set('settings.v1', '{x');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
