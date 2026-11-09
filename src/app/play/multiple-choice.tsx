import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BlockProgress } from '@/components/BlockProgress';
import {
  CloseButton,
  GameFeedback,
  GemCount,
  RoundSummary,
  withCombo,
} from '@/components/GameChrome';
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
  dailyReviewConcepts,
  expressionConcepts,
  REVIEW_ROUND_LIMIT,
  isFinished,
  pickOption,
  roundGrades,
  startRound,
  type Round as RoundState,
} from '@/features/games/multiple-choice/round';
import { finishRound } from '@/features/games/finishRound';
import type { CourseId } from '@/features/languages';
import { useActiveProfile } from '@/features/profiles';
import type { SessionReward } from '@/features/progress';
import { seededRng } from '@/features/quiz/rng';
import { localDay, recordAnswer } from '@/features/srs';
import { comboEvent, trailingRun } from '@/lib/feedbackEvents';
import { playFeedback } from '@/lib/feedback';
import { speak } from '@/lib/speech';
import { useReadAloud } from '@/lib/useReadAloud';
import { loadProgress } from '@/storage/progress';
import { loadDeck, saveDeck } from '@/storage/srs';
import { space } from '@/theme';

type LeveledType = 'kid' | 'adult';

export default function MultipleChoiceScreen() {
  const profile = useActiveProfile();
  const level = profile?.courses[profile.courseId]?.level;
  const { mode } = useLocalSearchParams<{ mode?: string }>();
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
      expressions={mode === 'expressions' && profile.type === 'adult'}
      review={mode === 'review'}
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
  /** Idioms and false friends instead of the level's words (LNG-28). */
  expressions?: boolean;
  /** Today's due reviews from every level instead of the level's words (LNG-29). */
  review?: boolean;
  onPlayAgain: () => void;
};

function Game({
  profileId,
  nickname,
  courseId,
  profileType,
  level,
  expressions = false,
  review = false,
  onPlayAgain,
}: GameProps) {
  const { t } = useTranslation();
  const [today] = useState(() => localDay(new Date()));
  const [round, setRound] = useState<RoundState>(() => {
    const deck = loadDeck(profileId, courseId);
    const levelWords = unitsFor(content, courseId, profileType, level).flatMap((u) => u.concepts);
    const due = dailyReviewConcepts(content, deck, today).slice(0, REVIEW_ROUND_LIMIT);
    return startRound({
      bundle: content,
      courseId,
      deck,
      today,
      // Expressions mode: idioms and false friends, asked English → Turkish
      // so the false friend's look-alike can be offered as the trap.
      // Review mode: only today's due words; the level fills in wrong options.
      levelConcepts: expressions
        ? expressionConcepts(content, courseId)
        : review
          ? due
          : levelWords,
      directions: expressions ? 'targetToNative' : 'mixed',
      distractorIds: review ? [...due, ...levelWords] : undefined,
      rng: seededRng(Date.now()),
    });
  });
  const [gems, setGems] = useState(() => loadProgress(profileId).gems);
  const [reward, setReward] = useState<SessionReward | null>(null);
  const [newLevel, setNewLevel] = useState<string | null>(null);
  const [comboRun, setComboRun] = useState<number | null>(null);

  const question = currentQuestion(round);
  const pick = currentPick(round);
  useReadAloud(reward ? null : question, profileType);

  if (reward) {
    const grades = roundGrades(round);
    return (
      <RoundSummary
        nickname={nickname}
        reward={reward}
        newLevel={newLevel}
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
    const answered = pickOption(round, index);
    setRound(answered);
    // Saved per answer: leaving mid-round must not lose what was practised.
    const deck = loadDeck(profileId, courseId);
    saveDeck(
      profileId,
      courseId,
      recordAnswer(deck, question.conceptId, right ? 'good' : 'again', today),
    );
    if (right) setGems((g) => g + 1);
    const run = right ? trailingRun(roundGrades(answered)) : 0;
    const combo = comboEvent(run);
    setComboRun(combo ? run : null);
    playFeedback(right ? (combo ?? 'correct') : 'wrong');
  };

  const onContinue = () => {
    const next = advance(round);
    setRound(next);
    if (!isFinished(next)) return;
    // Rewards (and a possible level-up) only for a finished round (docs/game-design.md).
    const finished = finishRound({
      profileId,
      courseId,
      profileType,
      level,
      grades: roundGrades(next),
      today,
    });
    setNewLevel(finished.newLevel);
    setReward(finished.reward);
  };

  const right = pick === question.correctIndex;
  const correctText = question.options[question.correctIndex].text;

  return (
    <Screen
      footer={
        pick === null ? undefined : (
          <View style={styles.footer}>
            <GameFeedback
              text={withNote(
                right
                  ? withCombo(t(`game.correct.${profileType}`), comboRun, t)
                  : t('game.answerWas', { answer: correctText }),
                question.note,
              )}
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

/** Adds a false friend's explanation under the verdict. */
function withNote(text: string, note: string | undefined): string {
  return note ? `${text}\n${note}` : text;
}
