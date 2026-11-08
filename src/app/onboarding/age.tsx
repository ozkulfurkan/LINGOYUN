import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChoiceCard } from '@/components/ChoiceCard';
import { AdultArt, KidArt, MiniArt } from '@/components/illustrations';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { defaultCourseId } from '@/features/onboarding/flow';
import {
  addProfile,
  MAX_PROFILES,
  NICKNAME_MAX_LENGTH,
  PROFILE_TYPES,
  profilesStore,
  type ProfileError,
  type ProfileType,
} from '@/features/profiles';

const ART = { mini: MiniArt, kid: KidArt, adult: AdultArt } as const;

export default function AgeGroupScreen() {
  const { t, i18n } = useTranslation();
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const [type, setType] = useState<ProfileType | null>(null);
  const [error, setError] = useState<ProfileError | null>(null);

  if (!nickname) return <Redirect href="/onboarding" />;

  const submit = () => {
    if (!type) return;
    const result = profilesStore.update((state, deps) =>
      addProfile(state, { nickname, type, courseId: defaultCourseId(i18n.language) }, deps),
    );
    if (result.ok) router.replace('/');
    else setError(result.error);
  };

  return (
    <Screen
      footer={type ? <PrimaryButton label={t('common.continue')} onPress={submit} /> : undefined}
    >
      <ThemedText variant="title" accessibilityRole="header">
        {t('onboarding.age.title', { nickname })}
      </ThemedText>
      <ThemedText color="textMuted">{t('onboarding.age.body')}</ThemedText>
      {PROFILE_TYPES.map((option) => {
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
      {error ? (
        <ThemedText color="accentText" accessibilityRole="alert">
          {t(`profileErrors.${error}`, { max: NICKNAME_MAX_LENGTH, limit: MAX_PROFILES })}
        </ThemedText>
      ) : null}
    </Screen>
  );
}
