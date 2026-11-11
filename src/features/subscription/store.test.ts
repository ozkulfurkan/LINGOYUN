import {
  cachedEntitlement,
  EMPTY_SUBSCRIPTION,
  entitlementFrom,
  parseSubscriptionCache,
  PRODUCT_IDS,
  trialPurchaseAt,
  yearlySavingPercent,
  type CustomerInfoLike,
} from './store';

const info = (over: Partial<CustomerInfoLike> = {}): CustomerInfoLike => ({
  entitlements: { active: {} },
  nonSubscriptionTransactions: [],
  ...over,
});

describe('entitlementFrom', () => {
  it('reads the family entitlement', () => {
    const active = {
      family: { isActive: true, willRenew: true, expirationDateMillis: 2_000 },
    };
    expect(entitlementFrom(info({ entitlements: { active } }))).toEqual({
      active: true,
      expiresAt: 2_000,
      willRenew: true,
    });
  });

  it('ignores other entitlements', () => {
    const active = { other: { isActive: true, willRenew: true, expirationDateMillis: null } };
    expect(entitlementFrom(info({ entitlements: { active } }))).toBeNull();
  });
});

describe('trialPurchaseAt', () => {
  it('takes the first purchase of the trial product only', () => {
    const transactions = [
      { productIdentifier: 'something.else', purchaseDate: '2026-01-01T00:00:00Z' },
      { productIdentifier: PRODUCT_IDS.trial, purchaseDate: '2026-11-03T10:00:00Z' },
      { productIdentifier: PRODUCT_IDS.trial, purchaseDate: '2026-11-01T10:00:00Z' },
    ];
    expect(trialPurchaseAt(info({ nonSubscriptionTransactions: transactions }))).toBe(
      Date.parse('2026-11-01T10:00:00Z'),
    );
  });

  it('is null without a trial or with a broken date', () => {
    expect(trialPurchaseAt(info())).toBeNull();
    const broken = [{ productIdentifier: PRODUCT_IDS.trial, purchaseDate: 'soon' }];
    expect(trialPurchaseAt(info({ nonSubscriptionTransactions: broken }))).toBeNull();
  });
});

describe('yearlySavingPercent', () => {
  it.each([
    [100, 840, 30],
    [199.99, 1499.99, 37],
    [100, 1200, null],
    [100, 1300, null],
    [0, 100, null],
  ])('monthly %d, yearly %d → %s', (monthly, yearly, expected) => {
    expect(yearlySavingPercent(monthly, yearly)).toBe(expected);
  });
});

describe('subscription cache', () => {
  it('round-trips and rejects junk', () => {
    const cache = {
      entitlement: { active: true, expiresAt: 5_000, willRenew: false },
      storeTrialAt: 1_000,
      checkedAt: 2_000,
    };
    expect(parseSubscriptionCache(JSON.parse(JSON.stringify(cache)))).toEqual(cache);
    expect(parseSubscriptionCache('x')).toEqual(EMPTY_SUBSCRIPTION);
    expect(parseSubscriptionCache({ entitlement: { active: 'yes' }, storeTrialAt: -1 })).toEqual(
      EMPTY_SUBSCRIPTION,
    );
  });

  it('does not trust a cached subscription after its end date', () => {
    const cache = {
      ...EMPTY_SUBSCRIPTION,
      entitlement: { active: true, expiresAt: 5_000, willRenew: true },
    };
    expect(cachedEntitlement(cache, 4_000)?.active).toBe(true);
    expect(cachedEntitlement(cache, 5_000)?.active).toBe(false);
    const lifetime = { ...cache, entitlement: { ...cache.entitlement, expiresAt: null } };
    expect(cachedEntitlement(lifetime, 9_999_999)?.active).toBe(true);
  });
});
