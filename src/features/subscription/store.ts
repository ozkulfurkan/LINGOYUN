import { ENTITLEMENT_ID, type Entitlement } from './access';

/** Store product ids (App Store Connect; RevenueCat imports them). Never reuse or rename. */
export const PRODUCT_IDS = {
  monthly: 'lingoyun.family_monthly',
  yearly: 'lingoyun.family_yearly',
  /** iOS only: the free 7-day trial (non-consumable, App Review 3.1.1). */
  trial: 'lingoyun.trial_7_days',
} as const;

export type Plan = 'monthly' | 'yearly';

/** The parts of RevenueCat's CustomerInfo this app reads. */
export type CustomerInfoLike = {
  entitlements: {
    active: Record<
      string,
      { isActive: boolean; willRenew: boolean; expirationDateMillis: number | null }
    >;
  };
  nonSubscriptionTransactions: { productIdentifier: string; purchaseDate: string }[];
};

/** The family entitlement, or null when the store reports none. */
export function entitlementFrom(info: CustomerInfoLike): Entitlement | null {
  const e = info.entitlements.active[ENTITLEMENT_ID];
  if (!e) return null;
  return { active: e.isActive, expiresAt: e.expirationDateMillis, willRenew: e.willRenew };
}

/** When the free trial product was first bought (epoch ms), or null. */
export function trialPurchaseAt(info: CustomerInfoLike): number | null {
  const times = info.nonSubscriptionTransactions
    .filter((t) => t.productIdentifier === PRODUCT_IDS.trial)
    .map((t) => Date.parse(t.purchaseDate))
    .filter(Number.isFinite);
  return times.length ? Math.min(...times) : null;
}

/** Whole percent saved by a year at `yearly` instead of twelve months; null if none. */
export function yearlySavingPercent(monthly: number, yearly: number): number | null {
  if (!(monthly > 0) || !(yearly > 0)) return null;
  const percent = Math.floor(100 * (1 - yearly / (12 * monthly)));
  return percent > 0 ? percent : null;
}

/**
 * Last answer from the store, kept on the device so the app opens offline with
 * what it knew. `storeTrialAt` is the iOS trial purchase date.
 */
export type SubscriptionCache = {
  entitlement: Entitlement | null;
  storeTrialAt: number | null;
  checkedAt: number | null;
};

export const EMPTY_SUBSCRIPTION: SubscriptionCache = {
  entitlement: null,
  storeTrialAt: null,
  checkedAt: null,
};

/** Rebuilds the cache from storage; anything malformed becomes "unknown". */
export function parseSubscriptionCache(data: unknown): SubscriptionCache {
  if (typeof data !== 'object' || data === null) return EMPTY_SUBSCRIPTION;
  const d = data as Record<string, unknown>;
  const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
  const e = d.entitlement as Record<string, unknown> | null | undefined;
  const entitlement =
    typeof e === 'object' && e !== null && typeof e.active === 'boolean'
      ? { active: e.active, expiresAt: time(e.expiresAt), willRenew: e.willRenew === true }
      : null;
  return { entitlement, storeTrialAt: time(d.storeTrialAt), checkedAt: time(d.checkedAt) };
}

/**
 * A cached subscription past its end date is not trusted offline: the store
 * would have renewed it or not, and the app has not heard which.
 */
export function cachedEntitlement(cache: SubscriptionCache, now: number): Entitlement | null {
  const e = cache.entitlement;
  if (!e?.active) return e;
  if (e.expiresAt !== null && e.expiresAt <= now) return { ...e, active: false };
  return e;
}
