import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BlockProgress } from '@/components/BlockProgress';
import { CloseIcon, GemIcon, LevelMedal } from '@/components/illustrations';
import { PopIn } from '@/components/PopIn';
import { PressScale } from '@/components/PressScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuizOptions } from '@/components/QuizOptions';
import { QuizPromptCard } from '@/components/QuizPromptCard';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { unitsFor } from '@/content';
import { content } from '@/content/bundle';
import {
  advance,
  currentPick,
  currentQuestion,
  isFinished,
  pickOption,
  roundGrades,
  startRound,
  type Round as RoundState,
} from '@/features/games/multiple-choice/round';
import type { CourseId } from '@/features/languages';
import { useActiveProfile } from '@/features/profiles';
import { completeSession, type SessionReward } from '@/features/progress';
import { seededRng } from '@/features/quiz/rng';
import { learnedCount, localDay, recordAnswer } from '@/features/srs';
import { speak } from '@/lib/speech';
import { useReadAloud } from '@/lib/useReadAloud';
import { loadProgress, saveProgress } from '@/storage/progress';
import { loadDeck, saveDeck } from '@/storage/srs';
import { space, stroke, touchTarget, useTheme } from '@/theme';

type LeveledType = 'kid' | 'adult';

export default function MultipleChoiceScreen() {
  const profile = useActiveProfile();
  const level = profile?.courses[profile.courseId]?.level;
  // Each new round starts from what is stored, so it picks up the last answers.
  const [roundNumber, setRoundNumber] = useState(0);

  if (!profile || profile.type === 'mini' || !level) return <Redirect href="/" />;
  return (
    <Game
      key={roundNumber}
      profileId={profile.id}
      nickname={profile.nickname}
      courseId={profile.courseId}
      profileType={profile.type}
      level={level}
      onPlayAgain={() => setRoundNumber((n) => n + 1)}
    />
  );
}

type GameProps = {
  profileId: string;
  nickname: string;
  courseId: CourseId;
  profileType: LeveledType;
  level: string;
  onPlayAgain: () => void;
};

function Game({ profileId, nickname, courseId, profileType, level, onPlayAgain }: GameProps) {
  const { t } = useTranslation();
  const [today] = useState(() => localDay(new Date()));
  const [round, setRound] = useState<RoundState>(() =>
    startRound({
      bundle: content,
      courseId,
      deck: loadDeck(profileId, courseId),
      today,
      levelConcepts: unitsFor(content, courseId, profileType, level).flatMap((u) => u.concepts),
      rng: seededRng(Date.now()),
    }),
  );
  const [gems, setGems] = useState(() => loadProgress(profileId).gems);
  const [reward, setReward] = useState<SessionReward | null>(null);

  const question = currentQuestion(round);
  const pick = currentPick(round);
  useReadAloud(reward ? null : question, profileType);

  if (reward) {
    const grades = roundGrades(round);
    return (
      <Summary
        nickname={nickname}
        reward={reward}
        correct={grades.filter((g) => g === 'good').length}
        total={grades.length}
        onPlayAgain={onPlayAgain}
      />
    );
  }
  if (!question) return <Redirect href="/" />;

  const onPick = (index: number) => {
    if (pick !== null) return;
    const right = index === question.correctIndex;
    setRound(pickOption(round, index));
    // Saved per answer: leaving mid-round must not lose what was practised.
    const deck = loadDeck(profileId, courseId);
    saveDeck(
      profileId,
      courseId,
      recordAnswer(deck, question.conceptId, right ? 'good' : 'again', today),
    );
    if (right) setGems((g) => g + 1);
    // Some devices have no haptics; the game must still work.
    (right
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    ).catch(() => undefined);
  };

  const onContinue = () => {
    const next = advance(round);
    setRound(next);
    if (!isFinished(next)) return;
    // Rewards only for a finished round (docs/game-design.md).
    const result = completeSession(loadProgress(profileId), {
      grades: roundGrades(next),
      today,
      wordsLearned: learnedCount(loadDeck(profileId, courseId)),
    });
    saveProgress(profileId, result.progress);
    setReward(result.reward);
  };

  const right = pick === question.correctIndex;
  const correctText = question.options[question.correctIndex].text;

  return (
    <Screen
      footer={
        pick === null ? undefined : (
          <View style={styles.footer}>
            <Feedback
              text={
                right
                  ? t(`game.correct.${profileType}`)
                  : t('game.answerWas', { answer: correctText })
              }
            />
            <PrimaryButton label={t('common.continue')} onPress={onContinue} />
          </View>
        )
      }
    >
      <View style={styles.header}>
        <CloseButton />
        <BlockProgress
          answered={round.picks.length}
          blockSize={round.questions.length}
          blocks={1}
          label={t('quiz.progressLabel', {
            current: round.index + 1,
            total: round.questions.length,
          })}
        />
        <GemCount gems={gems} />
      </View>

      <QuizPromptCard
        prompt={question.prompt}
        hint={t(`quiz.meaningIn.${question.answerLang}`)}
        onSpeak={() => speak(question.prompt, question.promptLang)}
      />

      <QuizOptions
        questionKey={question.conceptId}
        options={question.options}
        onPick={onPick}
        reveal={pick === null ? undefined : { picked: pick, correct: question.correctIndex }}
      />
    </Screen>
  );
}

function CloseButton() {
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

function GemCount({ gems }: { gems: number }) {
  const { t } = useTranslation();
  return (
    <View style={styles.gems} accessible accessibilityLabel={t('game.gemsLabel', { n: gems })}>
      <GemIcon />
      <ThemedText variant="option">{String(gems)}</ThemedText>
    </View>
  );
}

function Feedback({ text }: { text: string }) {
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

function Summary({ nickname, reward, correct, total, onPlayAgain }: SummaryProps) {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
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
  footer: {
    gap: space.md,
  },
  feedback: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
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
