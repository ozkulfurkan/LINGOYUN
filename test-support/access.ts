import Purchases from 'react-native-purchases';

import { EMPTY_SUBSCRIPTION, EMPTY_TRIAL, PRODUCT_IDS } from '@/features/subscription';
import { saveSubscription } from '@/storage/subscription';
import { saveTrial } from '@/storage/trial';

const infoWithTrial = (at: number) => ({
  entitlements: { active: {} },
  nonSubscriptionTransactions: [
    { productIdentifier: PRODUCT_IDS.trial, purchaseDate: new Date(at).toISOString() },
  ],
});

/**
 * Starts the free trial for screen tests, on both platforms: the iOS store
 * answer (and its cached copy) and the Android local record.
 */
export function startTestTrial(now: number = Date.now()): void {
  saveTrial({ startedAt: now, lastSeenAt: now });
  saveSubscription({ entitlement: null, storeTrialAt: now, checkedAt: now });
  jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(infoWithTrial(now) as never);
}

/** No trial, no subscription: the store knows nothing. */
export function clearTestAccess(): void {
  saveTrial(EMPTY_TRIAL);
  saveSubscription(EMPTY_SUBSCRIPTION);
  jest.mocked(Purchases.getCustomerInfo).mockResolvedValue({
    entitlements: { active: {} },
    nonSubscriptionTransactions: [],
  } as never);
}
