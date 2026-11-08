import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChoiceCard } from '@/components/ChoiceCard';
import { LevelMeter } from '@/components/illustrations';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { findCourse } from '@/features/languages';
import { applySelfAssessment } from '@/features/onboarding/flow';
import { SELF_ASSESSMENTS, type SelfAssessment } from '@/features/placement';
import { profilesStore, useActiveProfile } from '@/features/profiles';

export default function SelfAssessmentScreen() {
  const { t } = useTranslation();
  const profile = useActiveProfile();
  const [self, setSelf] = useState<SelfAssessment | null>(null);
  const course = profile ? findCourse(profile.courseId) : undefined;

  if (!profile || !course) return <Redirect href="/onboarding" />;
  // mini profiles have no levels and never reach this screen on their own.
  if (profile.type === 'mini') return <Redirect href="/" />;
  const profileType = profile.type;

  const submit = () => {
    if (!self) return;
    const result = profilesStore.update((state) => applySelfAssessment(state, profile.id, self));
    if (result.ok) router.replace('/');
  };

  return (
    <Screen
      footer={self ? <PrimaryButton label={t('common.continue')} onPress={submit} /> : undefined}
    >
      <ThemedText variant="label" color="accentText">
        {t('onboarding.level.eyebrow')}
      </ThemedText>
      <ThemedText variant="title" accessibilityRole="header">
        {t('onboarding.level.title', { language: t(`languages.${course.targetLang}`) })}
      </ThemedText>
      <ThemedText color="textMuted">{t('onboarding.level.body')}</ThemedText>
      {SELF_ASSESSMENTS.map((option, index) => (
        <ChoiceCard
          key={option}
          title={t(`onboarding.level.${profileType}.${option}`)}
          art={<LevelMeter filled={index + 1} />}
          selected={self === option}
          onPress={() => setSelf(option)}
        />
      ))}
    </Screen>
  );
}
