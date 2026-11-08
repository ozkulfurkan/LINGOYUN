import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

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

  if (step === 'createProfile') return <Redirect href="/onboarding" />;
  if (step === 'selfAssessment') return <Redirect href="/onboarding/level" />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedText variant="title" color="accentText">
        {t('app.name')}
      </ThemedText>
      <ThemedText>
        {t('home.hello', { nickname: getActiveProfile(state)?.nickname ?? '' })}
      </ThemedText>
      <ThemedText color="textMuted">{t('home.comingSoon')}</ThemedText>
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
