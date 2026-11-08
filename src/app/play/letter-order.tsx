import * as Haptics from 'expo-haptics';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BlockProgress } from '@/components/BlockProgress';
import { CloseButton, GameFeedback, GemCount, RoundSummary } from '@/components/GameChrome';
import { PressScale } from '@/components/PressScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuizPromptCard } from '@/components/QuizPromptCard';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { unitsFor } from '@/content';
import { content } from '@/content/bundle';
import {
  checkPuzzle,
  clearSlot,
  currentPuzzle,
  hintTileId,
  isDone,
  isFull,
  isRoundFinished,
  letterRoundGrades,
  nextPuzzle,
  placedTileIds,
  placeTile,
  puzzleGrade,
  revealPuzzle,
  startLetterRound,
  updateCurrent,
  type LetterRound,
  type Puzzle,
  type Slot,
} from '@/features/games/letter-order';
import type { CourseId } from '@/features/languages';
import { useActiveProfile } from '@/features/profiles';
import { completeSession, type SessionReward } from '@/features/progress';
import { seededRng } from '@/features/quiz/rng';
import { learnedCount, localDay, recordAnswer } from '@/features/srs';
import { speak, stopSpeaking } from '@/lib/speech';
import { loadProgress, saveProgress } from '@/storage/progress';
import { loadDeck, saveDeck } from '@/storage/srs';
import { dimmedOpacity, space, stroke, touchTarget, useTheme } from '@/theme';

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
    // Some devices have no haptics; the game must still work.
    (done.solved
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    ).catch(() => undefined);
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
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
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
    const result = completeSession(loadProgress(profileId), {
      grades: letterRoundGrades(next),
      today,
      wordsLearned: learnedCount(loadDeck(profileId, courseId)),
    });
    saveProgress(profileId, result.progress);
    setReward(result.reward);
  };

  const done = isDone(puzzle);
  const feedback = !done
    ? missed
      ? t('letters.tryAgain')
      : null
    : puzzle.revealed
      ? t('letters.answerIs', { answer: puzzle.answer })
      : puzzle.attempts === 0
        ? t(`game.correct.${profileType}`)
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

      <Slots puzzle={puzzle} onClear={(i) => apply(clearSlot(puzzle, i))} />
      {done ? null : <Tiles puzzle={puzzle} onPlace={(id) => apply(placeTile(puzzle, id))} />}
    </Screen>
  );
}

function Slots({ puzzle, onClear }: { puzzle: Puzzle; onClear: (index: number) => void }) {
  const { t } = useTranslation();
  const { colors, radii } = useTheme();
  const letterOf = new Map(puzzle.tiles.map((tile) => [tile.id, tile.letter]));
  // 1-based number of each letter slot, for screen readers ("box 3").
  const positions = puzzle.slots.map(
    (_, i) => puzzle.slots.slice(0, i + 1).filter((s) => s.kind === 'letter').length,
  );
  return (
    <View
      style={styles.row}
      accessible={isDone(puzzle)}
      accessibilityLabel={isDone(puzzle) ? puzzle.answer : undefined}
      testID="letter-slots"
    >
      {puzzle.slots.map((slot: Slot, i) => {
        if (slot.kind === 'fixed') {
          return (
            <View key={i} style={styles.fixed}>
              <ThemedText variant="option">{slot.char === ' ' ? '' : slot.char}</ThemedText>
            </View>
          );
        }
        const position = positions[i];
        const letter = slot.tileId === null ? null : (letterOf.get(slot.tileId) ?? null);
        const background = puzzle.solved
          ? colors.correct
          : puzzle.revealed
            ? colors.highlight
            : letter
              ? colors.surface
              : colors.surfaceShade;
        return (
          <PressScale
            key={i}
            accessibilityRole="button"
            accessibilityLabel={
              letter
                ? t('letters.slot', { n: position, letter })
                : t('letters.slotEmpty', { n: position })
            }
            disabled={!letter || isDone(puzzle)}
            onPress={() => onClear(i)}
            style={[
              styles.cell,
              {
                backgroundColor: background,
                borderColor: letter ? colors.accentText : colors.border,
                borderStyle: letter ? 'solid' : 'dashed',
                borderRadius: radii.sm,
              },
            ]}
          >
            <ThemedText variant="option" color={puzzle.solved ? 'onCorrect' : 'text'}>
              {letter ?? ''}
            </ThemedText>
          </PressScale>
        );
      })}
    </View>
  );
}

function Tiles({ puzzle, onPlace }: { puzzle: Puzzle; onPlace: (tileId: number) => void }) {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  const placed = placedTileIds(puzzle);
  const hint = hintTileId(puzzle);
  return (
    <View style={styles.row}>
      {puzzle.tiles.map((tile) => {
        const used = placed.has(tile.id);
        const hinted = tile.id === hint;
        return (
          <PressScale
            key={tile.id}
            accessibilityRole="button"
            accessibilityLabel={t('letters.tile', { letter: tile.letter })}
            accessibilityHint={hinted ? t('letters.hintLabel') : undefined}
            accessibilityState={{ disabled: used }}
            disabled={used}
            onPress={() => onPlace(tile.id)}
            style={[
              styles.cell,
              {
                // A used tile keeps its place so the others do not jump around.
                opacity: used ? dimmedOpacity / 4 : 1,
                backgroundColor: hinted ? colors.highlight : colors.surface,
                borderColor: hinted ? colors.accentText : colors.border,
                borderWidth: hinted ? stroke.thick : stroke.thin,
                borderRadius: radii.sm,
                boxShadow: used ? undefined : (elevation.surface ?? undefined),
              },
            ]}
          >
            <ThemedText variant="option">{tile.letter}</ThemedText>
          </PressScale>
        );
      })}
    </View>
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  cell: {
    width: touchTarget.kid,
    height: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
  },
  fixed: {
    width: touchTarget.kid / 2,
    height: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
