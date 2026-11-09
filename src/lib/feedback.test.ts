import * as Haptics from 'expo-haptics';
import { createAudioPlayer } from 'expo-audio';

import { saveSettings } from '@/storage/settings';
import { storage } from '@/storage/storage';

import { playFeedback } from './feedback';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

describe('playFeedback', () => {
  beforeEach(() => {
    storage.clearAll();
    jest.clearAllMocks();
  });

  it('plays sound and haptics for a right answer', () => {
    playFeedback('correct');
    expect(createAudioPlayer).toHaveBeenCalled();
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('uses a light haptic for a wrong answer and a medium one for combos', () => {
    playFeedback('wrong');
    playFeedback('combo5');
    expect(Haptics.impactAsync).toHaveBeenNthCalledWith(1, 'light');
    expect(Haptics.impactAsync).toHaveBeenNthCalledWith(2, 'medium');
  });

  it('stays quiet when switched off', () => {
    saveSettings({ sound: false, haptics: false });
    playFeedback('levelUp');
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('never throws when haptics fail', () => {
    (Haptics.impactAsync as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('no motor')));
    expect(() => playFeedback('wrong')).not.toThrow();
  });
});
