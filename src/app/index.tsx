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
import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { dailyReviewConcepts } from '@/features/games/multiple-choice/round';
import { themeNodes } from '@/features/map';
import { onboardingStep } from '@/features/onboarding/flow';
import {
  getActiveProfile,
  needsProfilePicker,
  useProfiles,
  type Profile,
} from '@/features/profiles';
import { visibleStreak } from '@/features/progress';
import { localDay } from '@/features/srs';
import { themeName } from '@/lib/themeName';
import { loadPath } from '@/storage/path';
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
  if (needsProfilePicker(state)) return <Redirect href="/who" />;
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
        <ProfileSwitch />
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

function MapHome({ profile, profileType }: MapHomeProps) {
  const { t } = useTranslation();
  const themes = pathOf(content, profile.courseId, profileType);
  // Storage is read on every visit (not during render): a step may have
  // changed the deck, the path or the streak.
  const read = useCallback(() => {
    const progress = loadProgress(profile.id);
    const deck = loadDeck(profile.id, profile.courseId);
    const path = loadPath(profile);
    const today = localDay(new Date());
    return {
      path,
      nodes: themeNodes(themes, path.themeIndex, deck, (theme, n) => themeName(t, theme, n)),
      gems: progress.gems,
      streak: visibleStreak(progress.streak, today),
      reviews: dailyReviewConcepts(content, deck, today).length,
    };
  }, [profile, themes, t]);
  const [data, setData] = useState(read);
  const [selected, setSelected] = useState<number | null>(null);
  useFocusEffect(useCallback(() => setData(read()), [read]));

  const complete = data.path.themeIndex >= themes.length;
  const open = (index: number) => router.push({ pathname: '/play/theme', params: { index } });

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {complete ? (
            <ThemedText color="textMuted">{t('path.complete')}</ThemedText>
          ) : (
            <PrimaryButton
              label={t('path.continue')}
              onPress={() =>
                router.push({
                  pathname: '/play/step',
                  params: {
                    theme: String(data.path.themeIndex),
                    step: String(data.path.stepIndex),
                  },
                })
              }
            />
          )}
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
        <ProfileSwitch />
        <SettingsButton />
      </View>
      <ReviewCard count={data.reviews} />
      {selected !== null && themes[selected] ? (
        <ThemeCard
          name={themeName(t, themes[selected], selected + 1)}
          state={data.nodes[selected].state}
          onOpen={() => open(selected)}
        />
      ) : null}
      <RiverMap nodes={data.nodes} shortLabel={(l) => l} onSelect={setSelected} />
    </Screen>
  );
}

/** The theme behind a tapped stone: its name, and a way in once reached. */
function ThemeCard({
  name,
  state,
  onOpen,
}: {
  name: string;
  state: 'done' | 'current' | 'locked';
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.review,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.md,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      <ThemedText variant="option" testID="theme-card-name">
        {name}
      </ThemedText>
      <ThemedText color="textMuted">
        {state === 'locked'
          ? t('path.locked')
          : state === 'done'
            ? t('path.done')
            : t('path.current')}
      </ThemedText>
      {state === 'locked' ? null : <SecondaryButton label={t('path.open')} onPress={onOpen} />}
    </View>
  );
}

/** Today's spaced-repetition reviews (LNG-29). */
function ReviewCard({ count }: { count: number }) {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  return (
    <View
      style={[
        styles.review,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.md,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      <ThemedText variant="option">
        {count > 0 ? t('home.reviewsDue', { count }) : t('home.noReviews')}
      </ThemedText>
      {count > 0 ? (
        <SecondaryButton
          label={t('home.review')}
          onPress={() => router.push('/play/multiple-choice?mode=review')}
        />
      ) : null}
    </View>
  );
}

/** Opens "Who is playing?"; hidden while there is a single profile. */
function ProfileSwitch() {
  const { t } = useTranslation();
  const { colors, radii } = useTheme();
  const { profiles, activeId } = useProfiles();
  const active = profiles.find((p) => p.id === activeId);
  if (profiles.length < 2 || !active) return null;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={t('who.switch')}
      onPress={() => router.push('/who')}
      style={[
        styles.settings,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.pill },
      ]}
    >
      <ThemedText variant="option">{[...active.nickname][0] ?? ''}</ThemedText>
    </PressScale>
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
  review: {
    gap: space.sm,
    padding: space.lg,
    borderWidth: stroke.thin,
  },
  cornerButton: {
    position: 'absolute',
    top: space.xxxl,
    right: space.xl,
    flexDirection: 'row',
    gap: space.sm,
  },
});
