import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { ChoiceCard } from '@/components/ChoiceCard';
import { CheckMark, RiverHero } from '@/components/illustrations';
import { PressScale } from '@/components/PressScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { closeGate, isGateOpen } from '@/features/parental-gate';
import { canPlay, yearlySavingPercent, type Plan } from '@/features/subscription';
import { privacyUrl, TERMS_URL } from '@/lib/links';
import {
  buyPlan,
  currentAccess,
  loadOffers,
  restorePurchases,
  startFreeTrial,
  type PlanOffer,
  type PurchaseOutcome,
} from '@/lib/purchases';
import { space, touchTarget } from '@/theme';

/**
 * Family plans. It speaks to the parent and sits behind the parental gate
 * (kids-ux): a direct visit without the gate is sent there first.
 */
export default function PaywallScreen() {
  const [allowed] = useState(() => isGateOpen());
  if (!allowed)
    return <Redirect href={{ pathname: '/parent-gate', params: { next: 'paywall' } }} />;
  return <PaywallBody />;
}

type Offers = 'loading' | 'failed' | PlanOffer[];

function PaywallBody() {
  const { t, i18n } = useTranslation();
  const [access, setAccess] = useState(currentAccess);
  const [offers, setOffers] = useState<Offers>('loading');
  const [plan, setPlan] = useState<Plan>('yearly');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchOffers = useCallback(
    () =>
      loadOffers().then(
        (list) => setOffers(list.length ? list : 'failed'),
        () => setOffers('failed'),
      ),
    [],
  );
  useEffect(() => {
    void fetchOffers();
  }, [fetchOffers]);
  const load = () => {
    setOffers('loading');
    void fetchOffers();
  };

  const leave = () => {
    closeGate();
    router.replace('/');
  };

  /** Runs a store action; on success with access the family goes home. */
  const act = async (action: () => Promise<PurchaseOutcome>, nothing?: string) => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const outcome = await action();
    setBusy(false);
    const next = currentAccess();
    setAccess(next);
    if (outcome === 'done' && canPlay(next)) return leave();
    if (outcome === 'done' && nothing) setMessage(nothing);
    else if (outcome === 'failed') setMessage(t('paywall.failed'));
  };

  const list = Array.isArray(offers) ? offers : [];
  const chosen = list.find((o) => o.plan === plan) ?? list[0];
  const monthly = list.find((o) => o.plan === 'monthly');
  const yearly = list.find((o) => o.plan === 'yearly');
  const saving = monthly && yearly ? yearlySavingPercent(monthly.price, yearly.price) : null;
  const trialAvailable = access.kind === 'notStarted';
  const subscribe = () => {
    if (chosen) void act(() => buyPlan(chosen));
  };

  return (
    <Screen
      hero={<RiverHero />}
      footer={
        <View style={styles.footer}>
          {trialAvailable ? (
            <PrimaryButton
              label={t('paywall.trialStart')}
              onPress={() => void act(startFreeTrial)}
            />
          ) : (
            <PrimaryButton label={t('paywall.subscribe')} onPress={subscribe} />
          )}
          <SecondaryButton label={t('paywall.notNow')} onPress={leave} />
        </View>
      }
    >
      <ThemedText variant="title" accessibilityRole="header">
        {t('paywall.title')}
      </ThemedText>
      <ThemedText>{t('paywall.lead')}</ThemedText>
      {(['benefit1', 'benefit2', 'benefit3'] as const).map((key) => (
        <View key={key} style={styles.benefit}>
          <CheckMark />
          <ThemedText style={styles.grow}>{t(`paywall.${key}`)}</ThemedText>
        </View>
      ))}

      {trialAvailable ? (
        <View style={styles.block}>
          <ThemedText variant="label" color="accentText">
            {t('paywall.trialTitle')}
          </ThemedText>
          <ThemedText>{t('paywall.trialBody')}</ThemedText>
        </View>
      ) : access.kind === 'trialEnded' ? (
        <ThemedText accessibilityRole="alert">{t('paywall.trialEnded')}</ThemedText>
      ) : null}

      <ThemedText variant="label" color="accentText">
        {trialAvailable ? t('paywall.orSubscribe') : t('paywall.plans')}
      </ThemedText>
      {offers === 'loading' ? (
        <ThemedText color="textMuted">{t('paywall.loading')}</ThemedText>
      ) : offers === 'failed' ? (
        <View style={styles.block}>
          <ThemedText color="textMuted">{t('paywall.loadFailed')}</ThemedText>
          <SecondaryButton label={t('paywall.retry')} onPress={load} />
        </View>
      ) : (
        list.map((offer) => (
          <ChoiceCard
            key={offer.plan}
            title={t(`paywall.${offer.plan}`)}
            body={[
              t(offer.plan === 'yearly' ? 'paywall.perYear' : 'paywall.perMonth', {
                price: offer.priceString,
              }),
              offer.plan === 'yearly' && saving ? t('paywall.saving', { percent: saving }) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            selected={chosen?.plan === offer.plan}
            onPress={() => setPlan(offer.plan)}
          />
        ))
      )}
      {trialAvailable && chosen ? (
        <SecondaryButton label={t('paywall.subscribe')} onPress={subscribe} />
      ) : null}

      {message ? (
        <ThemedText color="textMuted" accessibilityRole="alert">
          {message}
        </ThemedText>
      ) : null}

      <SecondaryButton
        label={t('paywall.restore')}
        onPress={() => void act(restorePurchases, t('paywall.restoreNone'))}
      />
      {/* Each store words renewal and cancelling its own way. */}
      <ThemedText variant="caption" color="textMuted">
        {t(Platform.OS === 'ios' ? 'paywall.legalIos' : 'paywall.legalAndroid')}
      </ThemedText>
      <View style={styles.links}>
        <LinkText label={t('paywall.terms')} url={TERMS_URL} />
        <LinkText label={t('paywall.privacy')} url={privacyUrl(i18n.language)} />
      </View>
    </Screen>
  );
}

function LinkText({ label, url }: { label: string; url: string }) {
  return (
    <PressScale
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void Linking.openURL(url)}
      style={styles.link}
    >
      <ThemedText variant="caption" color="accentText">
        {label}
      </ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  footer: { gap: space.sm },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  grow: { flex: 1 },
  block: { gap: space.sm },
  links: { flexDirection: 'row', gap: space.lg, flexWrap: 'wrap' },
  // The paywall speaks to grown-ups, but a child may hold the phone.
  link: { minHeight: touchTarget.kid, justifyContent: 'center' },
});
