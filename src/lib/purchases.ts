import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

import {
  accessState,
  cachedEntitlement,
  entitlementFrom,
  PRODUCT_IDS,
  resolveTrialStart,
  startTrial,
  touchTrial,
  trialPurchaseAt,
  type Access,
  type CustomerInfoLike,
  type Plan,
} from '@/features/subscription';
import { loadSubscription, saveSubscription } from '@/storage/subscription';
import { loadTrial, saveTrial } from '@/storage/trial';

/**
 * RevenueCat public SDK keys. They are meant to ship inside the app (never the
 * secret `sk_` key). Android has no key until the Play products exist.
 */
const API_KEYS: Partial<Record<typeof Platform.OS, string>> = {
  ios: 'appl_WmexDXLaoAjrsKcTgcsyOytCscD',
};

let configured = false;

/** Connects to RevenueCat once; false where the platform has no store yet. */
export function initPurchases(): boolean {
  if (configured) return true;
  const apiKey = API_KEYS[Platform.OS];
  if (!apiKey) return false;
  Purchases.configure({ apiKey });
  configured = true;
  return true;
}

/** What the family may use, from what is stored on the device (works offline). */
export function currentAccess(now: number = Date.now()): Access {
  const record = touchTrial(loadTrial(), now);
  saveTrial(record);
  const cache = loadSubscription();
  // iOS: the trial is the App Store purchase of the free product (cached from
  // the store). Android: the app keeps the start date itself.
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return accessState({
    now,
    trialStartedAt: resolveTrialStart(platform, cache.storeTrialAt, record.startedAt),
    record,
    entitlement: cachedEntitlement(cache, now),
  });
}

function remember(info: CustomerInfoLike): void {
  saveSubscription({
    entitlement: entitlementFrom(info),
    storeTrialAt: trialPurchaseAt(info),
    checkedAt: Date.now(),
  });
}

/** Asks the store for the latest state; keeps the stored one when offline. */
export async function refreshSubscription(): Promise<void> {
  if (!initPurchases()) return;
  try {
    remember(await Purchases.getCustomerInfo());
  } catch {
    // Offline or the store is busy: the stored state stays in use.
  }
}

export type PlanOffer = { plan: Plan; price: number; priceString: string; pkg: PurchasesPackage };

/** Monthly and yearly packages of the current RevenueCat offering. */
export async function loadOffers(): Promise<PlanOffer[]> {
  if (!initPurchases()) return [];
  const current = (await Purchases.getOfferings()).current;
  const offers: PlanOffer[] = [];
  for (const [plan, pkg] of [
    ['yearly', current?.annual],
    ['monthly', current?.monthly],
  ] as const) {
    if (pkg) {
      offers.push({ plan, price: pkg.product.price, priceString: pkg.product.priceString, pkg });
    }
  }
  return offers;
}

export type PurchaseOutcome = 'done' | 'cancelled' | 'failed';

async function run(purchase: () => Promise<{ customerInfo: CustomerInfoLike }>) {
  try {
    remember((await purchase()).customerInfo);
    return 'done' as const;
  } catch (e) {
    const cancelled =
      (e as { code?: string }).code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
      (e as { userCancelled?: boolean }).userCancelled === true;
    return cancelled ? ('cancelled' as const) : ('failed' as const);
  }
}

export function buyPlan(offer: PlanOffer): Promise<PurchaseOutcome> {
  return run(() => Purchases.purchasePackage(offer.pkg));
}

/**
 * Starts the 7-day free trial.
 * - iOS: "buys" the free non-consumable, so the date belongs to the Apple ID
 *   and survives reinstalling.
 * - Android: Play has no free products; the date is kept on the device.
 */
export async function startFreeTrial(): Promise<PurchaseOutcome> {
  if (Platform.OS !== 'ios') {
    saveTrial(startTrial(loadTrial(), Date.now()));
    return 'done';
  }
  if (!initPurchases()) return 'failed';
  try {
    const [product] = await Purchases.getProducts(
      [PRODUCT_IDS.trial],
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    );
    if (!product) return 'failed';
    return run(() => Purchases.purchaseStoreProduct(product));
  } catch {
    return 'failed';
  }
}

/** Brings back purchases made on this Apple ID / Google account. */
export async function restorePurchases(): Promise<PurchaseOutcome> {
  if (!initPurchases()) return 'failed';
  try {
    remember(await Purchases.restorePurchases());
    return 'done';
  } catch {
    return 'failed';
  }
}

/** Opens the store's own subscription page (change plan, cancel). */
export async function manageSubscription(): Promise<void> {
  if (!initPurchases()) return;
  try {
    await Purchases.showManageSubscriptions();
  } catch {
    // Nothing to do: the store page could not open.
  }
}
