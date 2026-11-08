import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { SettingsIcon } from '@/components/illustrations';
import { PressScale } from '@/components/PressScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RiverMap } from '@/components/RiverMap';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { content } from '@/content/bundle';
import { levelNodes } from '@/features/map';
import { onboardingStep } from '@/features/onboarding/flow';
import { getActiveProfile, useProfiles, type Profile } from '@/features/profiles';
import { visibleStreak } from '@/features/progress';
import { localDay } from '@/features/srs';
import { loadProgress } from '@/storage/progress';
import { loadDeck } from '@/storage/srs';
import { space, stroke, touchTarget, useTheme } from '@/theme';

// Sends unfinished setups to onboarding. Leveled profiles get the river map;
// mini profiles get their picture games later (LNG-33).
export default function HomeScreen() {
  const state = useProfiles();
  const step = onboardingStep(state);
  const profile = getActiveProfile(state);

  if (step === 'createProfile') return <Redirect href="/onboarding" />;
  if (step === 'selfAssessment') return <Redirect href="/onboarding/level" />;
  if (!profile) return null;

  const level = profile.courses[profile.courseId]?.level;
  if (profile.type === 'mini' || !level) return <MiniHome nickname={profile.nickname} />;
  return <MapHome profile={profile} profileType={profile.type} level={level} />;
}

function MiniHome({ nickname }: { nickname: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.mini, { backgroundColor: colors.background }]}>
      <View style={styles.cornerButton}>
        <SettingsButton />
      </View>
      <ThemedText variant="title" color="accentText">
        {t('app.name')}
      </ThemedText>
      <ThemedText>{t('home.hello', { nickname })}</ThemedText>
      <ThemedText color="textMuted">{t('home.comingSoon')}</ThemedText>
    </View>
  );
}

type MapHomeProps = { profile: Profile; profileType: 'kid' | 'adult'; level: string };

function MapHome({ profile, profileType, level }: MapHomeProps) {
  const { t } = useTranslation();
  // Storage is read on every visit (not during render): a round may have
  // changed the deck, the level or the streak.
  const read = useCallback(() => {
    const progress = loadProgress(profile.id);
    return {
      nodes: levelNodes(
        content,
        profile.courseId,
        profileType,
        loadDeck(profile.id, profile.courseId),
        level,
      ),
      gems: progress.gems,
      streak: visibleStreak(progress.streak, localDay(new Date())),
    };
  }, [profile.id, profile.courseId, profileType, level]);
  const [data, setData] = useState(read);
  useFocusEffect(useCallback(() => setData(read()), [read]));

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            label={t('home.play')}
            onPress={() => router.push('/play/multiple-choice')}
          />
          <View style={styles.row}>
            <View style={styles.half}>
              <SecondaryButton
                label={t('home.playLetters')}
                onPress={() => router.push('/play/letter-order')}
              />
            </View>
            <View style={styles.half}>
              <SecondaryButton
                label={t('home.playSentences')}
                onPress={() => router.push('/play/sentence-builder')}
              />
            </View>
          </View>
          {profileType === 'adult' ? (
            <SecondaryButton
              label={t('home.playTyping')}
              onPress={() => router.push('/play/free-typing')}
            />
          ) : null}
        </View>
      }
    >
      <View style={styles.header}>
        <View style={styles.grow}>
          <ThemedText variant="title" accessibilityRole="header">
            {t('home.hello', { nickname: profile.nickname })}
          </ThemedText>
          <ThemedText color="textMuted">
            {t('home.stats', { gems: data.gems, streak: data.streak })}
          </ThemedText>
        </View>
        <SettingsButton />
      </View>
      <RiverMap
        nodes={data.nodes}
        shortLabel={(l) => (profileType === 'kid' ? l.replace(/^L/, '') : l)}
      />
    </Screen>
  );
}

/** Opens settings through the parental gate (kids-ux skill). */
function SettingsButton() {
  const { t } = useTranslation();
  const { colors, radii } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={t('settings.open')}
      onPress={() => router.push('/parent-gate')}
      style={[
        styles.settings,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm },
      ]}
    >
      <SettingsIcon />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  mini: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  footer: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    gap: space.sm,
  },
  half: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  grow: {
    flex: 1,
  },
  settings: {
    width: touchTarget.kid,
    height: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
  },
  cornerButton: {
    position: 'absolute',
    top: space.xxxl,
    right: space.xl,
  },
});
