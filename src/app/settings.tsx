import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { closeGate, isGateOpen } from '@/features/parental-gate';
import {
  deleteProfile,
  profilesStore,
  setActiveProfile,
  useProfiles,
  type Profile,
} from '@/features/profiles';
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

      <ThemedText variant="label" color="accentText">
        {t('settings.profiles')}
      </ThemedText>
      {state.profiles.map((p) => (
        <ProfileRow key={p.id} profile={p} active={p.id === state.activeId} />
      ))}
    </Screen>
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
