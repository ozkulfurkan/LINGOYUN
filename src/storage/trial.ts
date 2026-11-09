import { EMPTY_TRIAL, parseTrialRecord, type TrialRecord } from '@/features/subscription';

import { storage } from './storage';

// Device-wide: one family subscription covers every profile.
const KEY = 'trial.v1';

export function loadTrial(): TrialRecord {
  const raw = storage.getString(KEY);
  if (raw === undefined) return EMPTY_TRIAL;
  try {
    return parseTrialRecord(JSON.parse(raw));
  } catch {
    return EMPTY_TRIAL;
  }
}

export function saveTrial(record: TrialRecord): void {
  storage.set(KEY, JSON.stringify(record));
}
