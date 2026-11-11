import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { ChoiceCard } from '@/components/ChoiceCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { closeGate, isGateOpen } from '@/features/parental-gate';
import { DIFFICULTIES, setDifficulty, type Difficulty } from '@/features/path';
import {
  canAddProfile,
  deleteProfile,
  MAX_PROFILES,
  profilesStore,
  setActiveProfile,
  useActiveProfile,
  useProfiles,
  type Profile,
} from '@/features/profiles';
import { manageSubscription } from '@/lib/purchases';
import { useAccess } from '@/lib/useAccess';
import { loadPath, savePath } from '@/storage/path';
import { loadSettings, saveSettings, type Settings } from '@/storage/settings';
import { space, stroke, useTheme } from '@/theme';

/** Grown-ups' settings. Only reachable through the parental gate. */
export default function SettingsScreen() {
  // Checked once when the screen opens: a direct link without the gate is sent there.
  const [allowed] = useState(() => isGateOpen());
  if (!allowed) return <Redirect href="/parent-gate" />;
  return <SettingsBody />;
}

function SettingsBody() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const state = useProfiles();

  const update = (change: Partial<Settings>) => {
    const next = { ...settings, ...change };
    saveSettings(next);
    setSettings(next);
  };

  const close = () => {
    closeGate();
    router.replace('/');
  };

  return (
    <Screen footer={<PrimaryButton label={t('settings.close')} onPress={close} />}>
      <ThemedText variant="title" accessibilityRole="header">
        {t('settings.title')}
      </ThemedText>
      <Toggle
        label={t('settings.sound')}
        value={settings.sound}
        onChange={(sound) => update({ sound })}
      />
      <Toggle
        label={t('settings.haptics')}
        value={settings.haptics}
        onChange={(haptics) => update({ haptics })}
      />

      <SubscriptionPanel />

      <DifficultyPicker />

      <ThemedText variant="label" color="accentText">
        {t('settings.profiles')}
      </ThemedText>
      {state.profiles.map((p) => (
        <ProfileRow key={p.id} profile={p} active={p.id === state.activeId} />
      ))}
      {state.profiles.length > 1 ? (
        <SecondaryButton
          label={t('who.switch')}
          onPress={() => {
            closeGate();
            router.push('/who');
          }}
        />
      ) : null}
      {canAddProfile(state) ? (
        <PrimaryButton label={t('settings.addChild')} onPress={() => router.push('/child-new')} />
      ) : (
        <ThemedText color="textMuted">
          {t('profileErrors.limitReached', { limit: MAX_PROFILES })}
        </ThemedText>
      )}
    </Screen>
  );
}

/** The family subscription or trial, with a way to the plans or the store page. */
function SubscriptionPanel() {
  const { t, i18n } = useTranslation();
  const access = useAccess();
  const date = (ms: number) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(ms));

  let status: string;
  let detail: string | null = null;
  if (access.kind === 'subscribed') {
    status = t('subscription.subscribed');
    if (access.expiresAt !== null) {
      const key = access.willRenew ? 'subscription.renews' : 'subscription.ends';
      detail = t(key, { date: date(access.expiresAt) });
    }
  } else if (access.kind === 'trial') {
    status = t('subscription.trial', { count: access.daysLeft });
  } else if (access.kind === 'trialEnded') {
    status = t('subscription.trialEnded');
  } else {
    status = t('subscription.notStarted');
  }

  return (
    <View style={styles.profile}>
      <ThemedText variant="label" color="accentText">
        {t('subscription.title')}
      </ThemedText>
      <ThemedText variant="option" testID="subscription-status">
        {status}
      </ThemedText>
      {detail ? <ThemedText color="textMuted">{detail}</ThemedText> : null}
      {access.kind === 'subscribed' ? (
        <SecondaryButton
          label={t('subscription.manage')}
          onPress={() => void manageSubscription()}
        />
      ) : (
        <SecondaryButton label={t('subscription.plans')} onPress={() => router.push('/paywall')} />
      )}
    </View>
  );
}

/** Difficulty of the active profile's content; it also adapts on its own. */
function DifficultyPicker() {
  const { t } = useTranslation();
  const profile = useActiveProfile();
  const [difficulty, setChosen] = useState<Difficulty | null>(() =>
    profile && profile.type !== 'mini' ? loadPath(profile).difficulty : null,
  );
  if (!profile || profile.type === 'mini' || difficulty === null) return null;

  const choose = (next: Difficulty) => {
    savePath(profile.id, profile.courseId, setDifficulty(loadPath(profile), next));
    setChosen(next);
  };

  return (
    <View style={styles.profile}>
      <ThemedText variant="label" color="accentText">
        {t('settings.difficulty.title')}
      </ThemedText>
      <ThemedText color="textMuted">{t('settings.difficulty.body')}</ThemedText>
      {DIFFICULTIES.map((level) => (
        <ChoiceCard
          key={level}
          title={t(`settings.difficulty.${level}`)}
          selected={difficulty === level}
          onPress={() => choose(level)}
        />
      ))}
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <ThemedText variant="option" style={styles.grow}>
        {label}
      </ThemedText>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.correct, false: colors.surfaceShade }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

function ProfileRow({ profile, active }: { profile: Profile; active: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [confirming, setConfirming] = useState(false);
  return (
    <View style={[styles.profile, { borderTopColor: colors.border }]}>
      <ThemedText variant="option">{profile.nickname}</ThemedText>
      <ThemedText color="textMuted">
        {active
          ? `${t(`settings.type.${profile.type}`)} · ${t('settings.active')}`
          : t(`settings.type.${profile.type}`)}
      </ThemedText>
      {confirming ? (
        <>
          <ThemedText accessibilityRole="alert">
            {t('settings.confirmDelete', { nickname: profile.nickname })}
          </ThemedText>
          <SecondaryButton label={t('settings.confirmNo')} onPress={() => setConfirming(false)} />
          <PrimaryButton
            label={t('settings.confirmYes')}
            onPress={() => deleteProfile(profile.id)}
          />
        </>
      ) : (
        <View style={styles.actions}>
          {active ? null : (
            <View style={styles.grow}>
              <SecondaryButton
                label={t('settings.switchTo')}
                onPress={() => profilesStore.update((s) => setActiveProfile(s, profile.id))}
              />
            </View>
          )}
          <View style={styles.grow}>
            <SecondaryButton
              label={`${t('settings.delete')}: ${profile.nickname}`}
              onPress={() => setConfirming(true)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderTopWidth: stroke.thin,
    paddingTop: space.md,
  },
  grow: {
    flex: 1,
  },
  profile: {
    gap: space.sm,
    borderTopWidth: stroke.thin,
    paddingTop: space.md,
  },
  actions: {
    flexDirection: 'row',
    gap: space.sm,
  },
});
