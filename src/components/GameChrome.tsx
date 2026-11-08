import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { SessionReward } from '@/features/progress';
import { space, stroke, touchTarget, useTheme } from '@/theme';

import { CloseIcon, GemIcon, LevelMedal } from './illustrations';
import { PopIn } from './PopIn';
import { PressScale } from './PressScale';
import { PrimaryButton } from './PrimaryButton';
import { Screen } from './Screen';
import { SecondaryButton } from './SecondaryButton';
import { ThemedText } from './ThemedText';

/** Leaves a game for the home screen. */
export function CloseButton() {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={t('game.close')}
      onPress={() => router.replace('/')}
      style={[
        styles.close,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.sm,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      <CloseIcon />
    </PressScale>
  );
}

export function GemCount({ gems }: { gems: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.gems} accessible accessibilityLabel={t('game.gemsLabel', { n: gems })}>
      <GemIcon />
      <ThemedText variant="option">{String(gems)}</ThemedText>
    </View>
  );
}

/** The verdict above the continue button, announced to screen readers. */
export function GameFeedback({ text }: { text: string }) {
  const { colors, radii } = useTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.feedback, { backgroundColor: colors.surfaceInverse, borderRadius: radii.md }]}
    >
      <ThemedText variant="option" color="onSurfaceInverse" accessibilityRole="alert">
        {text}
      </ThemedText>
    </View>
  );
}

type SummaryProps = {
  nickname: string;
  reward: SessionReward;
  correct: number;
  total: number;
  onPlayAgain: () => void;
};

/** End-of-round screen shared by every game. */
export function RoundSummary({ nickname, reward, correct, total, onPlayAgain }: SummaryProps) {
  const { t } = useTranslation();
  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <PrimaryButton label={t('game.summary.again')} onPress={onPlayAgain} />
          <SecondaryButton label={t('game.summary.done')} onPress={() => router.replace('/')} />
        </View>
      }
    >
      <View style={styles.medal}>
        <PopIn>
          <LevelMedal />
        </PopIn>
      </View>
      <ThemedText variant="label" color="accentText">
        {t('game.summary.eyebrow')}
      </ThemedText>
      <ThemedText variant="title" accessibilityRole="header">
        {reward.perfect
          ? t('game.summary.perfect', { nickname })
          : t('game.summary.finished', { nickname })}
      </ThemedText>
      <Stat text={t('game.summary.score', { correct, total })} />
      <Stat text={t('game.summary.xp', { n: reward.xp })} />
      <Stat text={t('game.summary.gems', { n: reward.gems })} />
      <Stat text={t('game.summary.streak', { n: reward.streak })} />
      {reward.usedFreezes > 0 ? <Stat text={t('game.summary.freezeUsed')} /> : null}
      {reward.newBadges.length > 0 ? (
        <Stat text={t('game.summary.badges', { n: reward.newBadges.length })} />
      ) : null}
    </Screen>
  );
}

function Stat({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { borderTopColor: colors.border }]}>
      <ThemedText variant="option">{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  close: {
    width: touchTarget.kid,
    height: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
  },
  gems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  feedback: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  footer: {
    gap: space.md,
  },
  medal: {
    alignItems: 'flex-start',
    paddingVertical: space.lg,
  },
  stat: {
    borderTopWidth: stroke.thin,
    paddingTop: space.sm,
  },
});
