import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { playFeedback } from '@/lib/feedback';
import { StyleSheet, View } from 'react-native';

import { LevelMedal } from '@/components/illustrations';
import { PopIn } from '@/components/PopIn';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { useActiveProfile } from '@/features/profiles';
import { canPlay } from '@/features/subscription';
import { currentAccess } from '@/lib/purchases';
import { themeLabel } from '@/lib/themeName';
import { loadPath } from '@/storage/path';
import { space } from '@/theme';

export default function PlacementResultScreen() {
  const { t } = useTranslation();
  const profile = useActiveProfile();
  const level = profile?.courses[profile.courseId]?.level;

  useEffect(() => {
    playFeedback('complete');
  }, []);

  if (!profile || !level) return <Redirect href="/" />;

  const type = profile.type === 'mini' ? 'kid' : profile.type;
  const themes = pathOf(content, profile.courseId, type);
  const index = Math.min(loadPath(profile).themeIndex, Math.max(themes.length - 1, 0));
  const theme = themes[index];

  return (
    <Screen
      footer={
        <PrimaryButton
          label={t('placement.result.start')}
          // The family plans come right after the first level result (CLAUDE.md).
          onPress={() => router.replace(canPlay(currentAccess()) ? '/' : '/paywall')}
        />
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
        {String(index + 1)}
      </ThemedText>
      {theme ? (
        <ThemedText variant="option">
          {t('placement.result.themeStart', { number: index + 1, name: themeLabel(t, theme) })}
        </ThemedText>
      ) : null}
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
