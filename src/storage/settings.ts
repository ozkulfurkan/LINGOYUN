import { storage } from './storage';

/** Device-wide preferences (kids-ux: sound and vibration can be switched off). */
export type Settings = { sound: boolean; haptics: boolean };

export const DEFAULT_SETTINGS: Settings = { sound: true, haptics: true };

const KEY = 'settings.v1';

export function parseSettings(data: unknown): Settings {
  const d = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  return {
    sound: typeof d.sound === 'boolean' ? d.sound : DEFAULT_SETTINGS.sound,
    haptics: typeof d.haptics === 'boolean' ? d.haptics : DEFAULT_SETTINGS.haptics,
  };
}

export function loadSettings(): Settings {
  const raw = storage.getString(KEY);
  if (raw === undefined) return DEFAULT_SETTINGS;
  try {
    return parseSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  storage.set(KEY, JSON.stringify(settings));
}
