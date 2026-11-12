import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { CHARACTERS } from '@/components/art/characters';
import { WordPicture } from '@/components/art/words/WordPicture';
import { RiverHero, SettingsIcon } from '@/components/illustrations';
import { AlbumIcon } from '@/components/mini/MiniParts';
import { PressScale } from '@/components/PressScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RiverMap } from '@/components/RiverMap';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { miniCanStart, miniWorlds } from '@/features/games/mini';
import { dailyReviewConcepts } from '@/features/games/multiple-choice/round';
import { findCourse, isLanguageCode } from '@/features/languages';
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
import { canPlay } from '@/features/subscription';
import { speakSequence } from '@/lib/speech';
import { themeName } from '@/lib/themeName';
import { useAccess } from '@/lib/useAccess';
import { loadPath } from '@/storage/path';
import { loadProgress } from '@/storage/progress';
import { loadDeck } from '@/storage/srs';
import { space, stroke, touchTarget, useTheme } from '@/theme';

// Sends unfinished setups to onboarding. Leveled profiles get the river map;
// mini profiles (ages 2–7) get their picture worlds (LNG-33).
export default function HomeScreen() {
  const state = useProfiles();
  const step = onboardingStep(state);
  const profile = getActiveProfile(state);

  if (step === 'createProfile') return <Redirect href="/onboarding" />;
  if (needsProfilePicker(state)) return <Redirect href="/who" />;
  if (step === 'selfAssessment') return <Redirect href="/onboarding/level" />;
  if (!profile) return null;

  const level = profile.courses[profile.courseId]?.level;
  if (profile.type === 'mini') return <MiniHome profile={profile} />;
  if (!level) return <ComingSoon nickname={profile.nickname} />;
  return <MapHome profile={profile} profileType={profile.type} level={level} />;
}

/** A kid or adult profile without a level yet: nothing to play. */
function ComingSoon({ nickname }: { nickname: string }) {
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

/**
 * Ages 2–7: six big world cards, no text to read. Nehir greets the child out
 * loud; the first session is free, then a trial or subscription is needed.
 */
function MiniHome({ profile }: { profile: Profile }) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const access = useAccess();
  const worlds = miniWorlds(content, profile.courseId);
  const [sessions, setSessions] = useState(() => loadProgress(profile.id).stats.sessions);
  const course = findCourse(profile.courseId);
  const uiLang = isLanguageCode(i18n.language) ? i18n.language : course?.nativeLang;
  const open = miniCanStart(access, sessions);

  useFocusEffect(
    useCallback(() => {
      setSessions(loadProgress(profile.id).stats.sessions);
      if (!open || !uiLang) return;
      // Spoken without the nickname: that line is a recording (the screen shows the name).
      // Leaving the screen stops only this greeting, never the game it opens.
      return speakSequence([{ text: t('mini.homeHelloSpoken'), language: uiLang }]);
    }, [profile, open, uiLang, t]),
  );

  if (!open) {
    return (
      <LockedHome
        ended={access.kind === 'trialEnded'}
        grownUp={false}
        nickname={profile.nickname}
      />
    );
  }

  const size = Math.min((width - space.xl * 2 - space.lg) / 2, 220);
  return (
    <Screen>
      <View style={styles.header}>
        <AlbumButton />
        <View style={styles.grow}>
          <NehirHello />
        </View>
        <SettingsButton />
      </View>
      <ThemedText variant="title" accessibilityRole="header" style={styles.center}>
        {t('mini.homeHello', { nickname: profile.nickname })}
      </ThemedText>
      <View style={styles.worlds}>
        {worlds.map((world) => (
          <WorldCard
            key={world.id}
            cover={world.cover}
            label={t('mini.worldLabel', {
              world: t(`mini.worlds.${world.id}` as 'mini.worlds.animals'),
            })}
            size={size}
            onPress={() => router.push({ pathname: '/play/mini', params: { world: world.id } })}
          />
        ))}
      </View>
    </Screen>
  );
}

/** Opens the sticker album (LNG-34); no gate: it only shows what the child earned. */
function AlbumButton() {
  const { t } = useTranslation();
  const { colors, radii } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={t('mini.album')}
      onPress={() => router.push('/album')}
      style={[
        styles.album,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md },
      ]}
    >
      <AlbumIcon size={touchTarget.mini * 0.7} />
    </PressScale>
  );
}

function NehirHello() {
  const { Component } = CHARACTERS.nehir;
  return (
    <View style={styles.hello}>
      <Component size={140} framing="portrait" expression="talking" />
    </View>
  );
}

/** A world: its first word's picture on a big clay card. */
function WorldCard({
  cover,
  label,
  size,
  onPress,
}: {
  cover: string;
  label: string;
  size: number;
  onPress: () => void;
}) {
  const { colors, radii, elevation } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.world,
        {
          width: size,
          height: size,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.lg,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      <WordPicture image={cover} size={size * 0.8} />
    </PressScale>
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
  const access = useAccess();

  if (!canPlay(access)) {
    return (
      <LockedHome
        ended={access.kind === 'trialEnded'}
        grownUp={profileType === 'adult'}
        nickname={profile.nickname}
      />
    );
  }

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
          {access.kind === 'trial' && access.endingSoon ? (
            <ThemedText color="accentText">
              {t('subscription.ending', { count: access.daysLeft })}
            </ThemedText>
          ) : null}
        </View>
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

/**
 * No trial and no subscription: the games wait. A child is asked to fetch a
 * grown-up; the plans themselves sit behind the parental gate.
 */
function LockedHome({
  ended,
  grownUp,
  nickname,
}: {
  ended: boolean;
  grownUp: boolean;
  nickname: string;
}) {
  const { t } = useTranslation();
  const body = grownUp
    ? t(ended ? 'paywall.trialEnded' : 'paywall.trialBody')
    : t(ended ? 'lock.endedBody' : 'lock.notStartedBody');
  return (
    <Screen
      hero={<RiverHero />}
      footer={
        <PrimaryButton
          label={grownUp ? t('subscription.plans') : t('lock.parent')}
          onPress={() => router.push('/paywall')}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.grow}>
          <ThemedText color="textMuted">{t('home.hello', { nickname })}</ThemedText>
          <ThemedText variant="title" accessibilityRole="header">
            {t(ended ? 'lock.endedTitle' : 'lock.notStartedTitle')}
          </ThemedText>
        </View>
        <SettingsButton />
      </View>
      <ThemedText>{body}</ThemedText>
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
  row: {},
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
  center: {
    textAlign: 'center',
  },
  hello: {
    alignItems: 'center',
  },
  worlds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.lg,
  },
  album: {
    width: touchTarget.mini,
    height: touchTarget.mini,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
  },
  world: {
    minWidth: touchTarget.mini,
    minHeight: touchTarget.mini,
    alignItems: 'center',
    justifyContent: 'center',
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
