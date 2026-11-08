import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChoiceCard } from '@/components/ChoiceCard';
import { LevelMeter } from '@/components/illustrations';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { content } from '@/content/bundle';
import { findCourse } from '@/features/languages';
import { startAtLowestLevel } from '@/features/onboarding/flow';
import { placeableLevels, SELF_ASSESSMENTS, type SelfAssessment } from '@/features/placement';
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
    // Someone who knows nothing skips the test (Furkan's decision), as does
    // anyone when the course has no content to test yet.
    const canTest = placeableLevels(content, profile.courseId, profileType).length > 0;
    if (self !== 'none' && canTest) {
      router.push({ pathname: '/placement', params: { self } });
      return;
    }
    const result = profilesStore.update((state) => startAtLowestLevel(state, profile.id));
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
