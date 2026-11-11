/* eslint-env jest */
// Stand-in for react-native-purchases in Jest: no native store. Tests change
// the answers with jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(...).
const emptyInfo = () => ({ entitlements: { active: {} }, nonSubscriptionTransactions: [] });

const Purchases = {
  configure: jest.fn(),
  getCustomerInfo: jest.fn(async () => emptyInfo()),
  getOfferings: jest.fn(async () => ({ current: null, all: {} })),
  getProducts: jest.fn(async () => []),
  purchasePackage: jest.fn(async () => ({ customerInfo: emptyInfo() })),
  purchaseStoreProduct: jest.fn(async () => ({ customerInfo: emptyInfo() })),
  restorePurchases: jest.fn(async () => emptyInfo()),
  showManageSubscriptions: jest.fn(async () => undefined),
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
  PRODUCT_CATEGORY: { NON_SUBSCRIPTION: 'NON_SUBSCRIPTION', SUBSCRIPTION: 'SUBSCRIPTION' },
};

module.exports = Purchases;
module.exports.default = Purchases;
module.exports.__esModule = true;
