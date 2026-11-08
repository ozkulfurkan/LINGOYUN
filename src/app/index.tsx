import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { onboardingStep } from '@/features/onboarding/flow';
import { getActiveProfile, useProfiles } from '@/features/profiles';
import { space, useTheme } from '@/theme';

// Sends unfinished setups to onboarding. The rest is a placeholder home screen
// until the river map (LNG-21).
export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const state = useProfiles();
  const step = onboardingStep(state);
  const profile = getActiveProfile(state);

  if (step === 'createProfile') return <Redirect href="/onboarding" />;
  if (step === 'selfAssessment') return <Redirect href="/onboarding/level" />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText variant="title" color="accentText">
        {t('app.name')}
      </ThemedText>
      <ThemedText>{t('home.hello', { nickname: profile?.nickname ?? '' })}</ThemedText>
      {/* mini profiles get their own picture games (LNG-33). */}
      {profile?.type === 'mini' ? (
        <ThemedText color="textMuted">{t('home.comingSoon')}</ThemedText>
      ) : (
        <>
          <PrimaryButton
            label={t('home.play')}
            onPress={() => router.push('/play/multiple-choice')}
          />
          <SecondaryButton
            label={t('home.playLetters')}
            onPress={() => router.push('/play/letter-order')}
          />
          <SecondaryButton
            label={t('home.playSentences')}
            onPress={() => router.push('/play/sentence-builder')}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});
