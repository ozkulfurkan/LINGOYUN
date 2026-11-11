import {
  EMPTY_SUBSCRIPTION,
  parseSubscriptionCache,
  type SubscriptionCache,
} from '@/features/subscription';

import { storage } from './storage';

// Device-wide, like the trial: one family subscription covers every profile.
const KEY = 'subscription.v1';

export function loadSubscription(): SubscriptionCache {
  const raw = storage.getString(KEY);
  if (raw === undefined) return EMPTY_SUBSCRIPTION;
  try {
    return parseSubscriptionCache(JSON.parse(raw));
  } catch {
    return EMPTY_SUBSCRIPTION;
  }
}

export function saveSubscription(cache: SubscriptionCache): void {
  storage.set(KEY, JSON.stringify(cache));
}
