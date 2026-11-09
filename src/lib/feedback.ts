import * as Haptics from 'expo-haptics';

import { loadSettings } from '@/storage/settings';

import { HAPTIC_FOR, type FeedbackEvent, type HapticKind } from './feedbackEvents';
import { playSound } from './sound';

function haptic(kind: HapticKind): Promise<void> {
  switch (kind) {
    case 'selection':
      return Haptics.selectionAsync();
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'light':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    case 'medium':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'none':
      return Promise.resolve();
  }
}

/** Sound and haptics for a game moment, as switched on in settings. Never throws. */
export function playFeedback(event: FeedbackEvent): void {
  const settings = loadSettings();
  if (settings.sound) playSound(event);
  // Some devices have no haptics; the game must still work.
  if (settings.haptics) haptic(HAPTIC_FOR[event]).catch(() => undefined);
}

/** The selection tick of every press (PressScale), honouring the settings. */
export function tapFeedback(): void {
  if (loadSettings().haptics) Haptics.selectionAsync().catch(() => undefined);
}
