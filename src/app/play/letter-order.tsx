import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { Bounce, Shake } from '@/components/Motion';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuizPromptCard } from '@/components/QuizPromptCard';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Slots, Tiles } from '@/components/LetterBoard';
import { unitsFor } from '@/content';
import { content } from '@/content/bundle';
import {
  checkPuzzle,
  clearSlot,
  currentPuzzle,
  isDone,
  isFull,
  isRoundFinished,
  letterRoundGrades,
  nextPuzzle,
  placeTile,
  puzzleGrade,
  revealPuzzle,
  startLetterRound,
  updateCurrent,
  type LetterRound,
  type Puzzle,
} from '@/features/games/letter-order';
import { finishRound } from '@/features/games/finishRound';
import type { CourseId } from '@/features/languages';
import { useActiveProfile } from '@/features/profiles';
import type { SessionReward } from '@/features/progress';
import { seededRng } from '@/features/quiz/rng';
import { localDay, recordAnswer } from '@/features/srs';
import { comboEvent, trailingRun } from '@/lib/feedbackEvents';
import { playFeedback } from '@/lib/feedback';
import { speak, stopSpeaking } from '@/lib/speech';
import { loadProgress } from '@/storage/progress';
import { loadDeck, saveDeck } from '@/storage/srs';
import { space } from '@/theme';

type LeveledType = 'kid' | 'adult';

export default function LetterOrderScreen() {
  const profile = useActiveProfile();
  const level = profile?.courses[profile.courseId]?.level;
  const [roundNumber, setRoundNumber] = useState(0);

  // Spelling needs reading: not for mini profiles (they get picture games, LNG-33).
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
  const [round, setRound] = useState<LetterRound>(() =>
    startLetterRound({
      bundle: content,
      courseId,
      deck: loadDeck(profileId, courseId),
      today,
      levelConcepts: unitsFor(content, courseId, profileType, level).flatMap((u) => u.concepts),
      rng: seededRng(Date.now()),
    }),
  );
  const [gems, setGems] = useState(() => loadProgress(profileId).gems);
  const [missed, setMissed] = useState(false);
  const [reward, setReward] = useState<SessionReward | null>(null);
  const [newLevel, setNewLevel] = useState<string | null>(null);
  const [comboRun, setComboRun] = useState<number | null>(null);

  const puzzle = currentPuzzle(round);

  // Younger readers hear the prompt without asking (kids-ux skill).
  useEffect(() => {
    if (puzzle && profileType === 'kid') speak(puzzle.prompt, puzzle.promptLang);
    return stopSpeaking;
    // Only when a new word comes up, not on every move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle?.conceptId, profileType]);

  if (reward) {
    const grades = letterRoundGrades(round);
    return (
      <RoundSummary
        nickname={nickname}
        reward={reward}
        newLevel={newLevel}
        correct={grades.filter((g) => g !== 'again').length}
        total={grades.length}
        onPlayAgain={onPlayAgain}
      />
    );
  }
  if (!puzzle) return <Redirect href="/" />;

  /** Saves the finished word and plays its feedback. */
  const finish = (done: Puzzle) => {
    const grade = puzzleGrade(done);
    saveDeck(
      profileId,
      courseId,
      recordAnswer(loadDeck(profileId, courseId), done.conceptId, grade, today),
    );
    if (grade === 'good') setGems((g) => g + 1);
    speak(done.answer, done.answerLang);
    const run = done.solved ? trailingRun([...letterRoundGrades(round), grade]) : 0;
    const combo = comboEvent(run);
    setComboRun(combo ? run : null);
    playFeedback(done.solved ? (combo ?? 'correct') : 'wrong');
  };

  const apply = (next: Puzzle) => {
    if (!isFull(next)) {
      setMissed(false);
      setRound(updateCurrent(round, next));
      return;
    }
    const { puzzle: checked, result } = checkPuzzle(next);
    setRound(updateCurrent(round, checked));
    setMissed(result === 'wrong');
    if (result === 'right') finish(checked);
    else playFeedback('wrong');
  };

  const onReveal = () => {
    const shown = revealPuzzle(puzzle);
    setMissed(false);
    setRound(updateCurrent(round, shown));
    finish(shown);
  };

  const onContinue = () => {
    const next = nextPuzzle(round);
    setRound(next);
    setMissed(false);
    if (!isRoundFinished(next)) return;
    // Rewards (and a possible level-up) only for a finished round (docs/game-design.md).
    const finished = finishRound({
      profileId,
      courseId,
      profileType,
      level,
      grades: letterRoundGrades(next),
      today,
    });
    setNewLevel(finished.newLevel);
    setReward(finished.reward);
  };

  const done = isDone(puzzle);
  const feedback = !done
    ? missed
      ? t('letters.tryAgain')
      : null
    : puzzle.revealed
      ? t('letters.answerIs', { answer: puzzle.answer })
      : puzzle.attempts === 0
        ? withCombo(t(`game.correct.${profileType}`), comboRun, t)
        : t('letters.gotIt');

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {feedback ? <GameFeedback text={feedback} /> : null}
          {done ? (
            <PrimaryButton label={t('common.continue')} onPress={onContinue} />
          ) : puzzle.attempts > 0 ? (
            <SecondaryButton label={t('letters.show')} onPress={onReveal} />
          ) : null}
        </View>
      }
    >
      <View style={styles.header}>
        <CloseButton />
        <BlockProgress
          answered={round.index + (done ? 1 : 0)}
          blockSize={round.puzzles.length}
          blocks={1}
          label={t('quiz.progressLabel', {
            current: round.index + 1,
            total: round.puzzles.length,
          })}
        />
        <GemCount gems={gems} />
      </View>

      <QuizPromptCard
        prompt={puzzle.prompt}
        hint={t(`letters.build.${puzzle.answerLang}`)}
        onSpeak={() => speak(puzzle.prompt, puzzle.promptLang)}
      />

      <Shake trigger={puzzle.attempts}>
        <Bounce trigger={puzzle.solved}>
          <Slots puzzle={puzzle} onClear={(i) => apply(clearSlot(puzzle, i))} />
        </Bounce>
      </Shake>
      {done ? null : <Tiles puzzle={puzzle} onPlace={(id) => apply(placeTile(puzzle, id))} />}
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
