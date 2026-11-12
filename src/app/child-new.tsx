import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ChoiceCard } from '@/components/ChoiceCard';
import { KidArt, MiniArt } from '@/components/illustrations';
import { NicknameInput } from '@/components/NicknameInput';
import { PopIn } from '@/components/PopIn';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { defaultCourseId } from '@/features/onboarding/flow';
import { closeGate } from '@/features/parental-gate';
import {
  addProfile,
  CHILD_TYPES,
  getActiveProfile,
  markProfileChosen,
  profilesStore,
  setActiveProfile,
  type Profile,
  type ProfileError,
} from '@/features/profiles';
import { useGateAllowed } from '@/lib/useGateAllowed';
import { space } from '@/theme';

const ART = { mini: MiniArt, kid: KidArt } as const;
type ChildType = (typeof CHILD_TYPES)[number];

/**
 * A parent adds a child profile: age group, then nickname. Behind the parental
 * gate like settings; the parent stays on their own profile unless they choose
 * to hand over.
 */
export default function NewChildScreen() {
  // Checked once when the screen opens: a direct link without the gate is sent there.
  const allowed = useGateAllowed();
  if (!allowed) return <Redirect href="/parent-gate" />;
  return <NewChild />;
}

function NewChild() {
  const { t, i18n } = useTranslation();
  const [type, setType] = useState<ChildType | null>(null);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<ProfileError | null>(null);
  const [created, setCreated] = useState<Profile | null>(null);

  if (created) return <Ready child={created} />;

  const submit = () => {
    if (!type) return;
    const state = profilesStore.getState();
    // The child learns the same course as the parent's current profile.
    const courseId = getActiveProfile(state)?.courseId ?? defaultCourseId(i18n.language);
    const result = profilesStore.update((s, deps) =>
      addProfile(s, { nickname, type, courseId }, deps, { activate: false }),
    );
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreated(result.value.profiles.at(-1) ?? null);
  };

  return (
    <Screen
      footer={type ? <PrimaryButton label={t('child.create')} onPress={submit} /> : undefined}
    >
      <ThemedText variant="title" accessibilityRole="header">
        {t('child.title')}
      </ThemedText>
      {CHILD_TYPES.map((option) => {
        const Art = ART[option];
        return (
          <ChoiceCard
            key={option}
            title={t(`onboarding.age.${option}.title`)}
            body={t(`onboarding.age.${option}.body`)}
            art={<Art />}
            selected={type === option}
            onPress={() => setType(option)}
          />
        );
      })}
      {type ? (
        <>
          <ThemedText variant="option">{t('child.nickname')}</ThemedText>
          <ThemedText color="textMuted">{t('onboarding.nickname.body')}</ThemedText>
          <NicknameInput
            value={nickname}
            onChange={(value) => {
              setNickname(value);
              setError(null);
            }}
            onSubmit={submit}
            error={error}
          />
        </>
      ) : null}
    </Screen>
  );
}

function Ready({ child }: { child: Profile }) {
  const { t } = useTranslation();
  const Art = child.type === 'mini' ? MiniArt : KidArt;

  const playNow = () => {
    profilesStore.update((s) => setActiveProfile(s, child.id));
    markProfileChosen();
    closeGate();
    // Home sends a new 7–12 profile to self-assessment and the placement test.
    router.replace('/');
  };

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label={t('child.playNow', { nickname: child.nickname })}
            onPress={playNow}
          />
          <SecondaryButton label={t('child.back')} onPress={() => router.replace('/settings')} />
        </View>
      }
    >
      <View style={styles.art}>
        <PopIn>
          <Art />
        </PopIn>
      </View>
      <ThemedText variant="title" accessibilityRole="header">
        {t('child.ready', { nickname: child.nickname })}
      </ThemedText>
      <ThemedText color="textMuted">
        {child.type === 'kid' ? t('child.readyKid') : t('child.readyMini')}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: space.md,
  },
  art: {
    alignItems: 'flex-start',
    paddingVertical: space.xl,
  },
});
