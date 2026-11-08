import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { LevelMedal } from '@/components/illustrations';
import { PopIn } from '@/components/PopIn';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { levelNumber } from '@/features/placement';
import { useActiveProfile } from '@/features/profiles';
import { space } from '@/theme';

export default function PlacementResultScreen() {
  const { t } = useTranslation();
  const profile = useActiveProfile();
  const level = profile?.courses[profile.courseId]?.level;

  useEffect(() => {
    // Some devices have no haptics; the screen must still work.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }, []);

  if (!profile || !level) return <Redirect href="/" />;

  const number = levelNumber(level);
  const label = number === null ? level : t('levels.numbered', { number });

  return (
    <Screen
      footer={
        <PrimaryButton label={t('placement.result.start')} onPress={() => router.replace('/')} />
      }
    >
      <View style={styles.medal}>
        <PopIn>
          <LevelMedal />
        </PopIn>
      </View>
      <ThemedText variant="label" color="accentText">
        {t('placement.result.eyebrow')}
      </ThemedText>
      <ThemedText variant="word" color="accentText">
        {label}
      </ThemedText>
      <ThemedText variant="title" accessibilityRole="header">
        {t('placement.result.title', { nickname: profile.nickname })}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  medal: {
    alignItems: 'flex-start',
    paddingVertical: space.xl,
  },
});
