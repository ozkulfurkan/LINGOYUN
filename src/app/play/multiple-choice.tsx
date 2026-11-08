import * as Haptics from 'expo-haptics';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BlockProgress } from '@/components/BlockProgress';
import { CloseButton, GameFeedback, GemCount, RoundSummary } from '@/components/GameChrome';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuizOptions } from '@/components/QuizOptions';
import { QuizPromptCard } from '@/components/QuizPromptCard';
import { Screen } from '@/components/Screen';
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
import { space } from '@/theme';

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
      <RoundSummary
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
            <GameFeedback
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  footer: {
    gap: space.md,
  },
});
