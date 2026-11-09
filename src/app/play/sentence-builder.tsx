import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BlockProgress } from '@/components/BlockProgress';
import { DraggableBlock, measureView, type Measurable } from '@/components/DraggableBlock';
import {
  CloseButton,
  GameFeedback,
  GemCount,
  RoundSummary,
  withCombo,
} from '@/components/GameChrome';
import { Bounce, Shake } from '@/components/Motion';
import { PressScale } from '@/components/PressScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuizPromptCard } from '@/components/QuizPromptCard';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { themeConcepts } from '@/content';
import { content } from '@/content/bundle';
import {
  builtText,
  canCheck,
  checkSentence,
  currentSentence,
  isSentenceDone,
  isSentenceRoundFinished,
  levelSentences,
  nextSentence,
  placeBlock,
  removeBlock,
  revealSentence,
  sentenceGrade,
  sentenceHint,
  sentenceRoundGrades,
  startSentenceRound,
  updateSentence,
  type SentencePuzzle,
  type SentenceRound,
} from '@/features/games/sentence-builder';
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
import { space, stroke, touchTarget, useTheme } from '@/theme';

type LeveledType = 'kid' | 'adult';

export default function SentenceBuilderScreen() {
  const profile = useActiveProfile();
  const level = profile?.courses[profile.courseId]?.level;
  const { theme, tier } = useLocalSearchParams<{ theme?: string; tier?: string }>();
  const [roundNumber, setRoundNumber] = useState(0);

  // Building sentences needs reading: not for mini profiles.
  if (!profile || profile.type === 'mini' || !level) return <Redirect href="/" />;
  return (
    <Game
      key={roundNumber}
      profileId={profile.id}
      nickname={profile.nickname}
      courseId={profile.courseId}
      profileType={profile.type}
      level={level}
      theme={theme}
      tier={tier}
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
  /** A situation's sentences at this difficulty instead of the level's (LNG-41). */
  theme?: string;
  tier?: string;
  onPlayAgain: () => void;
};

function Game({
  profileId,
  nickname,
  courseId,
  profileType,
  level,
  theme,
  tier,
  onPlayAgain,
}: GameProps) {
  const { t } = useTranslation();
  const [today] = useState(() => localDay(new Date()));
  const [round, setRound] = useState<SentenceRound>(() =>
    startSentenceRound({
      bundle: content,
      courseId,
      deck: loadDeck(profileId, courseId),
      today,
      sentences:
        theme && tier
          ? themeConcepts(content, courseId, profileType, theme, tier, 'sentence')
          : levelSentences(content, courseId, profileType, level),
      profileType,
      rng: seededRng(Date.now()),
    }),
  );
  const [gems, setGems] = useState(() => loadProgress(profileId).gems);
  const [missed, setMissed] = useState(false);
  const [reward, setReward] = useState<SessionReward | null>(null);
  const [newLevel, setNewLevel] = useState<string | null>(null);
  const [comboRun, setComboRun] = useState<number | null>(null);
  const zoneRef = useRef<Measurable | null>(null);

  const puzzle = currentSentence(round);

  // Younger readers hear the sentence without asking (kids-ux skill).
  useEffect(() => {
    if (puzzle && profileType === 'kid') speak(puzzle.prompt, puzzle.promptLang);
    return stopSpeaking;
    // Only when a new sentence comes up, not on every move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle?.conceptId, profileType]);

  if (reward) {
    const grades = sentenceRoundGrades(round);
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

  const finish = (done: SentencePuzzle) => {
    const grade = sentenceGrade(done);
    saveDeck(
      profileId,
      courseId,
      recordAnswer(loadDeck(profileId, courseId), done.conceptId, grade, today),
    );
    if (grade === 'good') setGems((g) => g + 1);
    speak(`${done.words.join(' ')}${done.ending}`, done.answerLang);
    const run = done.solved ? trailingRun([...sentenceRoundGrades(round), grade]) : 0;
    const combo = comboEvent(run);
    setComboRun(combo ? run : null);
    playFeedback(done.solved ? (combo ?? 'correct') : 'wrong');
  };

  const check = (p: SentencePuzzle) => {
    const { puzzle: checked, result } = checkSentence(p);
    setRound(updateSentence(round, checked));
    setMissed(result === 'wrong');
    if (result === 'right') finish(checked);
    else playFeedback('wrong');
  };

  const apply = (next: SentencePuzzle) => {
    // Kids have no decoys, so a full answer is checked at once; adults decide.
    if (profileType === 'kid' && canCheck(next)) return check(next);
    setMissed(false);
    setRound(updateSentence(round, next));
  };

  const onReveal = () => {
    const shown = revealSentence(puzzle);
    setMissed(false);
    setRound(updateSentence(round, shown));
    finish(shown);
  };

  const onContinue = () => {
    const next = nextSentence(round);
    setRound(next);
    setMissed(false);
    if (!isSentenceRoundFinished(next)) return;
    // Rewards (and a possible level-up) only for a finished round (docs/game-design.md).
    const finished = finishRound({
      profileId,
      courseId,
      profileType,
      level,
      grades: sentenceRoundGrades(next),
      today,
    });
    setNewLevel(finished.newLevel);
    setReward(finished.reward);
  };

  const done = isSentenceDone(puzzle);
  const feedback = !done
    ? missed
      ? t('sentences.tryAgain')
      : null
    : puzzle.revealed
      ? t('sentences.answerIs', { answer: `${puzzle.words.join(' ')}${puzzle.ending}` })
      : puzzle.attempts === 0
        ? withCombo(t(`game.correct.${profileType}`), comboRun, t)
        : t('sentences.gotIt');

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {feedback ? <GameFeedback text={feedback} /> : null}
          {done ? (
            <PrimaryButton label={t('common.continue')} onPress={onContinue} />
          ) : (
            <>
              {canCheck(puzzle) ? (
                <PrimaryButton label={t('sentences.check')} onPress={() => check(puzzle)} />
              ) : null}
              {puzzle.attempts > 0 ? (
                <SecondaryButton label={t('sentences.show')} onPress={onReveal} />
              ) : null}
            </>
          )}
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
        hint={t(`sentences.build.${puzzle.answerLang}`)}
        onSpeak={() => speak(puzzle.prompt, puzzle.promptLang)}
      />

      <Shake trigger={puzzle.attempts}>
        <Bounce trigger={puzzle.solved}>
          <AnswerArea
            puzzle={puzzle}
            zoneRef={zoneRef}
            onRemove={(id) => apply(removeBlock(puzzle, id))}
          />
        </Bounce>
      </Shake>
      {done ? null : (
        <Pool
          puzzle={puzzle}
          measureZone={(cb) => measureView(zoneRef.current, cb)}
          onPlace={(id) => apply(placeBlock(puzzle, id))}
        />
      )}
    </Screen>
  );
}

type AnswerProps = {
  puzzle: SentencePuzzle;
  zoneRef: RefObject<Measurable | null>;
  onRemove: (blockId: number) => void;
};

function AnswerArea({ puzzle, zoneRef, onRemove }: AnswerProps) {
  const { t } = useTranslation();
  const { colors, radii } = useTheme();
  const done = isSentenceDone(puzzle);
  const byId = new Map(puzzle.blocks.map((b) => [b.id, b.word]));
  return (
    <View
      ref={(view) => {
        zoneRef.current = view as unknown as Measurable | null;
      }}
      testID="sentence-answer"
      accessible={done}
      accessibilityLabel={done ? `${builtText(puzzle)}${puzzle.ending}` : undefined}
      style={[
        styles.answer,
        {
          backgroundColor: puzzle.solved ? colors.correct : colors.surfaceShade,
          borderColor: puzzle.solved ? colors.correctShade : colors.border,
          borderRadius: radii.md,
        },
      ]}
    >
      {puzzle.placed.length === 0 ? (
        <ThemedText color="textMuted">{t('sentences.dropHere')}</ThemedText>
      ) : (
        puzzle.placed.map((id, i) => {
          const word = byId.get(id) ?? '';
          const last = i === puzzle.placed.length - 1 && done;
          return (
            <WordBlock
              key={id}
              word={last ? `${word}${puzzle.ending}` : word}
              label={t('sentences.placed', { n: i + 1, word })}
              disabled={done}
              onPress={() => onRemove(id)}
            />
          );
        })
      )}
    </View>
  );
}

type PoolProps = {
  puzzle: SentencePuzzle;
  measureZone: (done: Parameters<typeof measureView>[1]) => void;
  onPlace: (blockId: number) => void;
};

function Pool({ puzzle, measureZone, onPlace }: PoolProps) {
  const { t } = useTranslation();
  const hint = sentenceHint(puzzle);
  const full = puzzle.placed.length >= puzzle.words.length;
  return (
    <View style={styles.pool}>
      {puzzle.blocks
        .filter((b) => !puzzle.placed.includes(b.id))
        .map((b) => (
          <DraggableBlock
            key={b.id}
            measureZone={measureZone}
            onDrop={() => onPlace(b.id)}
            disabled={full}
          >
            <WordBlock
              word={b.word}
              label={t('sentences.block', { word: b.word })}
              hint={b.id === hint ? t('sentences.hintLabel') : undefined}
              highlighted={b.id === hint}
              disabled={full}
              onPress={() => onPlace(b.id)}
            />
          </DraggableBlock>
        ))}
    </View>
  );
}

type WordBlockProps = {
  word: string;
  label: string;
  hint?: string;
  highlighted?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function WordBlock({
  word,
  label,
  hint,
  highlighted = false,
  disabled = false,
  onPress,
}: WordBlockProps) {
  const { colors, radii, elevation } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.block,
        {
          backgroundColor: highlighted ? colors.highlight : colors.surface,
          borderColor: highlighted ? colors.accentText : colors.border,
          borderWidth: highlighted ? stroke.thick : stroke.thin,
          borderRadius: radii.sm,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      <ThemedText variant="option">{word}</ThemedText>
    </PressScale>
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
  answer: {
    minHeight: touchTarget.mini * 1.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.md,
    borderWidth: stroke.thin,
    borderStyle: 'dashed',
  },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  block: {
    minHeight: touchTarget.kid,
    minWidth: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
});
