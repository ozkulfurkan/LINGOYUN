import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import Purchases from 'react-native-purchases';

import HomeScreen from '@/app/index';
import ParentGateScreen from '@/app/parent-gate';
import PaywallScreen from '@/app/paywall';
import {
  addProfile,
  deleteProfile,
  profilesStore,
  setCourseLevel,
  type ProfileType,
} from '@/features/profiles';
import { closeGate } from '@/features/parental-gate';
import { PRODUCT_IDS } from '@/features/subscription';
import i18n from '@/i18n';
import tr from '@/i18n/tr.json';
import { clearTestAccess, startTestTrial } from '../test-support/access';

const ROUTES = { index: HomeScreen, 'parent-gate': ParentGateScreen, paywall: PaywallScreen };
const DAY = 86_400_000;

const annual = { product: { price: 840, priceString: '₺840,00' } };
const monthly = { product: { price: 100, priceString: '₺100,00' } };

const info = (over: object = {}) => ({
  entitlements: { active: {} },
  nonSubscriptionTransactions: [],
  ...over,
});
const subscribed = info({
  entitlements: {
    active: {
      family: { isActive: true, willRenew: true, expirationDateMillis: Date.now() + 30 * DAY },
    },
  },
});
const trialStarted = info({
  nonSubscriptionTransactions: [
    { productIdentifier: PRODUCT_IDS.trial, purchaseDate: new Date().toISOString() },
  ],
});

const store = jest.mocked(Purchases);

/** After a purchase the store keeps answering with the new state. */
function storeAnswers(next: object) {
  store.getCustomerInfo.mockResolvedValue(next as never);
  return { customerInfo: next } as never;
}

function seedProfile(type: ProfileType, level: string) {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type, courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  profilesStore.update((s) => setCourseLevel(s, added.value.activeId!, level));
}

const NUMBER: Record<string, number> = Object.fromEntries(
  Object.entries(tr.gate.numbers).map(([n, word]) => [word, Number(n)]),
);

async function passGate() {
  const question = screen.getByTestId('gate-question').props.children as string;
  const [a, , b] = question.split(' ');
  for (const d of String(NUMBER[a] * NUMBER[b])) await fireEvent.press(screen.getByLabelText(d));
}

async function press(label: string | RegExp) {
  await fireEvent.press(screen.getByLabelText(label));
}

describe('family plans', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    jest.clearAllMocks();
    clearTestAccess();
    closeGate();
    store.getOfferings.mockResolvedValue({ current: { annual, monthly }, all: {} } as never);
  });

  afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

  it('locks the map until a grown-up starts the free trial behind the gate', async () => {
    seedProfile('adult', 'A1');
    store.getProducts.mockResolvedValue([{ identifier: PRODUCT_IDS.trial }] as never);
    store.purchaseStoreProduct.mockImplementation(async () => storeAnswers(trialStarted));
    await renderRouter(ROUTES);

    expect(screen.getByText('7 gün ücretsiz dene')).toBeTruthy();
    expect(screen.queryByLabelText(/^1\. Selamlaşma/)).toBeNull();

    await press('Paketleri gör');
    await passGate();
    expect(await screen.findByText('Bütün aile için LINGOYUN')).toBeTruthy();
    expect(await screen.findByLabelText('Yıllık. ₺840,00 / yıl · %30 tasarruf')).toBeTruthy();
    expect(screen.getByLabelText('Aylık. ₺100,00 / ay')).toBeTruthy();

    await press('Ücretsiz denemeyi başlat');
    expect(store.getProducts).toHaveBeenCalledWith([PRODUCT_IDS.trial], 'NON_SUBSCRIPTION');
    expect(await screen.findByLabelText(/^1\. Selamlaşma/)).toBeTruthy();
  });

  it('asks a child to fetch a grown-up once the trial has ended, then sells a plan', async () => {
    seedProfile('kid', 'L1');
    startTestTrial(Date.now() - 8 * DAY);
    store.purchasePackage.mockImplementation(async () => storeAnswers(subscribed));
    await renderRouter(ROUTES);

    expect(screen.getByText('Ücretsiz deneme bitti')).toBeTruthy();
    expect(screen.getByText('Devam etmek için bir yetişkinden yardım iste.')).toBeTruthy();

    await press('Ebeveyn: paketleri gör');
    await passGate();
    expect(
      await screen.findByText('Ücretsiz deneme bitti. Devam etmek için bir paket seç.'),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Ücretsiz denemeyi başlat')).toBeNull();

    await press('Aylık. ₺100,00 / ay');
    await press('Abone ol');
    expect(store.purchasePackage).toHaveBeenCalledWith(monthly);
    // Back on the river map: the first theme's stone.
    expect(await screen.findByLabelText(/^1\. /)).toBeTruthy();
  });

  it('stays on the plans when a purchase is cancelled or nothing can be restored', async () => {
    seedProfile('adult', 'A1');
    startTestTrial(Date.now() - 8 * DAY);
    store.purchasePackage.mockRejectedValue({ code: '1', userCancelled: true });
    await renderRouter(ROUTES, { initialUrl: '/paywall' });
    await passGate();

    await screen.findByLabelText('Yıllık. ₺840,00 / yıl · %30 tasarruf');
    await press('Abone ol');
    expect(store.purchasePackage).toHaveBeenCalledWith(annual);
    expect(screen.getByText('Bütün aile için LINGOYUN')).toBeTruthy();
    expect(screen.queryByText('İşlem tamamlanamadı. Lütfen tekrar dene.')).toBeNull();

    await press('Satın alımları geri yükle');
    expect(
      await screen.findByText('Bu hesapta geri yüklenecek bir abonelik bulunamadı.'),
    ).toBeTruthy();
  });

  it('shows a way back when the plans cannot be loaded', async () => {
    seedProfile('adult', 'A1');
    store.getOfferings.mockRejectedValue(new Error('offline'));
    await renderRouter(ROUTES, { initialUrl: '/paywall' });
    await passGate();
    expect(await screen.findByText(/Paketler yüklenemedi/)).toBeTruthy();
    await press('Şimdi değil');
    expect(await screen.findByText('7 gün ücretsiz dene')).toBeTruthy();
  });
});
