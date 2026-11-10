import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BlockProgress } from '@/components/BlockProgress';
import { measureView, type Measurable } from '@/components/DraggableBlock';
import { CloseButton, GameFeedback } from '@/components/GameChrome';
import { Hearts } from '@/components/Hearts';
import { LevelMedal } from '@/components/illustrations';
import { Slots, Tiles } from '@/components/LetterBoard';
import { Bounce, Shake } from '@/components/Motion';
import { PopIn } from '@/components/PopIn';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QuizOptions } from '@/components/QuizOptions';
import { QuizPromptCard } from '@/components/QuizPromptCard';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { AnswerArea, Pool } from '@/components/SentenceBoard';
import { ThemedText } from '@/components/ThemedText';
import { TypingBoard } from '@/components/TypingBoard';
import { pathOf, type Theme } from '@/content';
import { content } from '@/content/bundle';
import {
  checkPuzzle,
  clearSlot,
  isDone,
  isFull,
  placeTile,
  puzzleGrade,
  revealPuzzle,
  type Puzzle,
} from '@/features/games/letter-order';
import {
  canCheck,
  checkSentence,
  isSentenceDone,
  placeBlock,
  removeBlock,
  revealSentence,
  sentenceGrade,
  type SentencePuzzle,
} from '@/features/games/sentence-builder';
import { checkTyping, type TypingResult } from '@/features/games/free-typing';
import { type CourseId } from '@/features/languages';
import {
  buildStep,
  EXAM_STEP,
  isOutOfHearts,
  isPerfect,
  isRefilled,
  isStepPassed,
  missCurrent,
  nextQuestion,
  refillAnswer,
  startRefill,
  startStepSession,
  themeSentences,
  type PathProgress,
  type RefillSession,
  type StepItem,
  type StepSession,
} from '@/features/path';
import { finishPassedStep, recordFailedStep } from '@/features/path/finish';
import { useActiveProfile } from '@/features/profiles';
import type { SessionReward } from '@/features/progress';
import { buildQuestion } from '@/features/quiz/generate';
import { seededRng, type Rng } from '@/features/quiz/rng';
import { gradeFromVerdict, localDay, recordAnswer, type Grade } from '@/features/srs';
import { playFeedback } from '@/lib/feedback';
import { speak, stopSpeaking } from '@/lib/speech';
import { themeName } from '@/lib/themeName';
import { loadPath } from '@/storage/path';
import { loadDeck, saveDeck } from '@/storage/srs';
import { space, stroke, useTheme } from '@/theme';

type Leveled = 'kid' | 'adult';

/** One step of a theme: fifteen questions with three lives (LNG-43). */
export default function StepScreen() {
  const profile = useActiveProfile();
  const params = useLocalSearchParams<{ theme?: string; step?: string }>();
  // A new attempt (after earning lives back) builds a fresh step.
  const [attempt, setAttempt] = useState(0);

  if (!profile || profile.type === 'mini') return <Redirect href="/" />;
  const themes = pathOf(content, profile.courseId, profile.type);
  const progress = loadPath(profile);
  const themeIndex = Number(params.theme);
  const stepIndex = Number(params.step);
  const reached =
    themeIndex < progress.themeIndex ||
    (themeIndex === progress.themeIndex && stepIndex <= progress.stepIndex);
  const theme = themes[themeIndex];
  if (
    !theme ||
    !Number.isInteger(stepIndex) ||
    stepIndex < 0 ||
    stepIndex > EXAM_STEP ||
    !reached
  ) {
    return <Redirect href="/" />;
  }
  return (
    <Step
      key={`${themeIndex}:${stepIndex}:${attempt}`}
      profileId={profile.id}
      nickname={profile.nickname}
      courseId={profile.courseId}
      profileType={profile.type}
      themes={themes}
      themeIndex={themeIndex}
      stepIndex={stepIndex}
      progress={progress}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

type StepProps = {
  profileId: string;
  nickname: string;
  courseId: CourseId;
  profileType: Leveled;
  themes: readonly Theme[];
  themeIndex: number;
  stepIndex: number;
  progress: PathProgress;
  onRetry: () => void;
};

type Phase = 'play' | 'outOfHearts' | 'refill' | 'passed';

function Step(props: StepProps) {
  const { profileId, courseId, profileType, themes, themeIndex, stepIndex, progress } = props;
  const { t } = useTranslation();
  const theme = themes[themeIndex];
  const current = themeIndex === progress.themeIndex && stepIndex === progress.stepIndex;
  const [today] = useState(() => localDay(new Date()));
  const [rng] = useState<Rng>(() => seededRng(Date.now()));
  const [items, setItems] = useState<StepItem[]>(() =>
    buildStep({
      bundle: content,
      courseId,
      profileType,
      theme,
      stepIndex,
      difficulty: progress.difficulty,
      mistakes: current ? progress.lastMistakes : [],
      extraSentences: themes
        .filter((other) => other.band === theme.band && other.id !== theme.id)
        .flatMap((other) => themeSentences(other, progress.difficulty)),
      deck: loadDeck(profileId, courseId),
      rng,
    }),
  );
  const [session, setSession] = useState<StepSession>(() => startStepSession(items.length));
  const [grades, setGrades] = useState<Grade[]>([]);
  // Picked option of the current choice question; null while unanswered.
  const [pick, setPick] = useState<number | null>(null);
  const [missed, setMissed] = useState(false);
  const [typed, setTyped] = useState('');
  const [typingResult, setTypingResult] = useState<TypingResult | null>(null);
  const [phase, setPhase] = useState<Phase>('play');
  const [reward, setReward] = useState<SessionReward | null>(null);
  const zoneRef = useRef<Measurable | null>(null);

  const item = items[session.index];

  // Listening questions always play their word; kids also hear every other prompt.
  useEffect(() => {
    if (phase !== 'play' || !item) return;
    if (item.kind === 'listen') speak(item.question.prompt, item.question.promptLang);
    else if (profileType === 'kid') {
      const p =
        item.kind === 'choice' ? item.question : item.kind === 'typing' ? item.item : item.puzzle;
      speak(p.prompt, p.promptLang);
    }
    return stopSpeaking;
    // Only when a new question comes up, not on every move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.index, phase]);

  if (phase === 'passed' && reward) {
    return (
      <Passed
        {...props}
        reward={reward}
        mistakes={session.mistakes.length}
        exam={stepIndex === EXAM_STEP}
      />
    );
  }
  if (phase === 'outOfHearts') {
    return <OutOfHearts onRefill={() => setPhase('refill')} />;
  }
  if (phase === 'refill') {
    return (
      <Refill
        courseId={courseId}
        theme={theme}
        mistakes={session.mistakes}
        sentencePool={items.filter((i) => i.kind === 'sentence').map((i) => i.conceptId)}
        rng={rng}
        onDone={props.onRetry}
      />
    );
  }
  if (!item) return <Redirect href="/" />;

  const record = (conceptId: string, grade: Grade) =>
    saveDeck(
      profileId,
      courseId,
      recordAnswer(loadDeck(profileId, courseId), conceptId, grade, today),
    );

  /** The current question is over: save it and wait for "Continue". */
  const settle = (grade: Grade) => {
    record(item.conceptId, grade);
    setGrades((g) => [...g, grade]);
    playFeedback(grade === 'again' ? 'wrong' : 'correct');
  };

  const lose = () => {
    const next = missCurrent(session, item.conceptId);
    setSession(next);
    return next;
  };

  const onPick = (index: number) => {
    if (pick !== null || (item.kind !== 'choice' && item.kind !== 'listen')) return;
    setPick(index);
    if (index === item.question.correctIndex) settle('good');
    else {
      lose();
      settle('again');
    }
  };

  const updateItem = (next: StepItem) =>
    setItems((list) => list.map((x, i) => (i === session.index ? next : x)));

  const applyLetters = (puzzle: Puzzle) => {
    if (!isFull(puzzle)) {
      setMissed(false);
      return updateItem({ kind: 'letters', conceptId: item.conceptId, puzzle });
    }
    const { puzzle: checked, result } = checkPuzzle(puzzle);
    if (result === 'right') {
      updateItem({ kind: 'letters', conceptId: item.conceptId, puzzle: checked });
      return settle(puzzleGrade(checked));
    }
    setMissed(true);
    // The last life is gone: show the word and stop here.
    if (isOutOfHearts(lose())) {
      const shown = revealPuzzle(checked);
      updateItem({ kind: 'letters', conceptId: item.conceptId, puzzle: shown });
      return settle('again');
    }
    updateItem({ kind: 'letters', conceptId: item.conceptId, puzzle: checked });
    playFeedback('wrong');
  };

  const checkBlocks = (puzzle: SentencePuzzle) => {
    const { puzzle: checked, result } = checkSentence(puzzle);
    if (result === 'right') {
      updateItem({ kind: 'sentence', conceptId: item.conceptId, puzzle: checked });
      return settle(sentenceGrade(checked));
    }
    setMissed(true);
    if (isOutOfHearts(lose())) {
      const shown = revealSentence(checked);
      updateItem({ kind: 'sentence', conceptId: item.conceptId, puzzle: shown });
      return settle('again');
    }
    updateItem({ kind: 'sentence', conceptId: item.conceptId, puzzle: checked });
    playFeedback('wrong');
  };

  const applyBlocks = (puzzle: SentencePuzzle) => {
    // Kids have no decoys, so a full answer is checked at once; adults decide.
    if (profileType === 'kid' && canCheck(puzzle)) return checkBlocks(puzzle);
    setMissed(false);
    updateItem({ kind: 'sentence', conceptId: item.conceptId, puzzle });
  };

  const reveal = () => {
    setMissed(false);
    if (item.kind === 'letters') {
      updateItem({ ...item, puzzle: revealPuzzle(item.puzzle) });
    } else if (item.kind === 'sentence') {
      updateItem({ ...item, puzzle: revealSentence(item.puzzle) });
    }
    settle('again');
  };

  /** Checks a typed answer ("" = I don't know). Spelling slips cost no life. */
  const submitTyping = (value: string) => {
    if (item.kind !== 'typing' || typingResult) return;
    const { answerLang } = item.item;
    const result = checkTyping(content, item.item, value);
    const grade = gradeFromVerdict(result.verdict);
    if (grade === 'again') lose();
    setTypingResult(result);
    settle(grade);
    speak(result.expected, answerLang);
  };

  const onContinue = () => {
    setPick(null);
    setTyped('');
    setTypingResult(null);
    setMissed(false);
    if (isOutOfHearts(session)) {
      recordFailedStep({ profileId, courseId, progress, current });
      setPhase('outOfHearts');
      return;
    }
    const next = nextQuestion(session);
    setSession(next);
    if (!isStepPassed(next)) return;
    const finished = finishPassedStep({
      profileId,
      courseId,
      profileType,
      progress,
      current,
      grades,
      mistakes: next.mistakes,
      perfect: isPerfect(next),
      today,
    });
    setReward(finished.reward);
    setPhase('passed');
  };

  const answered =
    item.kind === 'letters'
      ? isDone(item.puzzle)
      : item.kind === 'sentence'
        ? isSentenceDone(item.puzzle)
        : item.kind === 'typing'
          ? typingResult !== null
          : pick !== null;
  const right = answered && grades.at(-1) !== 'again';
  const feedback = feedbackText(t, item, answered, right, missed, profileType, typingResult);

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {feedback ? <GameFeedback text={feedback} /> : null}
          {answered ? (
            <PrimaryButton label={t('common.continue')} onPress={onContinue} />
          ) : item.kind === 'typing' ? (
            <>
              <PrimaryButton label={t('typing.check')} onPress={() => submitTyping(typed)} />
              <SecondaryButton label={t('typing.dontKnow')} onPress={() => submitTyping('')} />
            </>
          ) : item.kind === 'sentence' && canCheck(item.puzzle) && profileType === 'adult' ? (
            <PrimaryButton label={t('sentences.check')} onPress={() => checkBlocks(item.puzzle)} />
          ) : null}
          {!answered &&
          (item.kind === 'letters' || item.kind === 'sentence') &&
          item.puzzle.attempts > 0 ? (
            <SecondaryButton
              label={t(item.kind === 'letters' ? 'letters.show' : 'sentences.show')}
              onPress={reveal}
            />
          ) : null}
        </View>
      }
    >
      <View style={styles.header}>
        <CloseButton />
        <BlockProgress
          answered={session.index + (answered ? 1 : 0)}
          blockSize={items.length}
          blocks={1}
          label={t('quiz.progressLabel', { current: session.index + 1, total: items.length })}
        />
        <Hearts hearts={session.hearts} />
      </View>
      <ThemedText variant="label" color="textMuted">
        {`${themeName(t, theme, themeIndex + 1)} · ${
          stepIndex === EXAM_STEP ? t('path.exam') : t('path.step', { n: stepIndex + 1 })
        }`}
      </ThemedText>

      {item.kind === 'choice' || item.kind === 'listen' ? (
        <>
          <QuizPromptCard
            prompt={item.question.prompt}
            hidden={item.kind === 'listen' && !answered}
            hint={
              item.kind === 'listen'
                ? t('path.listenHint')
                : t(`quiz.meaningIn.${item.question.answerLang}`)
            }
            onSpeak={() => speak(item.question.prompt, item.question.promptLang)}
            onSpeakSlow={() =>
              speak(item.question.prompt, item.question.promptLang, { slow: true })
            }
          />
          <QuizOptions
            questionKey={`${session.index}:${item.conceptId}`}
            options={item.question.options}
            onPick={onPick}
            reveal={
              pick === null ? undefined : { picked: pick, correct: item.question.correctIndex }
            }
          />
        </>
      ) : item.kind === 'letters' ? (
        <>
          <QuizPromptCard
            prompt={item.puzzle.prompt}
            hint={t(`letters.build.${item.puzzle.answerLang}`)}
            onSpeak={() => speak(item.puzzle.prompt, item.puzzle.promptLang)}
          />
          <Shake trigger={item.puzzle.attempts}>
            <Bounce trigger={item.puzzle.solved}>
              <Slots
                puzzle={item.puzzle}
                onClear={(i) => applyLetters(clearSlot(item.puzzle, i))}
              />
            </Bounce>
          </Shake>
          {answered ? null : (
            <Tiles
              puzzle={item.puzzle}
              onPlace={(id) => applyLetters(placeTile(item.puzzle, id))}
            />
          )}
        </>
      ) : item.kind === 'typing' ? (
        <>
          <QuizPromptCard
            prompt={item.item.prompt}
            hint={t('typing.hintWord', { language: t(`languages.${item.item.answerLang}`) })}
            onSpeak={() => speak(item.item.prompt, item.item.promptLang)}
          />
          <TypingBoard
            questionKey={`${session.index}:${item.conceptId}`}
            value={typingResult ? typingResult.typed : typed}
            onChange={setTyped}
            onSubmit={() => submitTyping(typed)}
            verdict={typingResult?.verdict ?? null}
          />
        </>
      ) : (
        <>
          <QuizPromptCard
            prompt={item.puzzle.prompt}
            hint={t(`sentences.build.${item.puzzle.answerLang}`)}
            onSpeak={() => speak(item.puzzle.prompt, item.puzzle.promptLang)}
          />
          <Shake trigger={item.puzzle.attempts}>
            <Bounce trigger={item.puzzle.solved}>
              <AnswerArea
                puzzle={item.puzzle}
                zoneRef={zoneRef}
                onRemove={(id) => applyBlocks(removeBlock(item.puzzle, id))}
              />
            </Bounce>
          </Shake>
          {answered ? null : (
            <Pool
              puzzle={item.puzzle}
              measureZone={(cb) => measureView(zoneRef.current, cb)}
              onPlace={(id) => applyBlocks(placeBlock(item.puzzle, id))}
            />
          )}
        </>
      )}
    </Screen>
  );
}

type T = ReturnType<typeof useTranslation>['t'];

function feedbackText(
  t: T,
  item: StepItem,
  answered: boolean,
  right: boolean,
  missed: boolean,
  profileType: Leveled,
  typingResult: TypingResult | null,
): string | null {
  if (item.kind === 'typing' && typingResult) {
    const answer = typingResult.expected;
    if (typingResult.verdict === 'correct') return t(`game.correct.${profileType}`);
    if (typingResult.verdict === 'nearMiss') return t('typing.nearMiss', { answer });
    if (typingResult.verdict === 'typo') return t('typing.typo', { answer });
    if (typingResult.verdict === 'otherWord') return t('typing.otherWord', { answer });
    return t('game.answerWas', { answer });
  }
  if (!answered) {
    if (!missed) return null;
    return t(item.kind === 'letters' ? 'letters.tryAgain' : 'sentences.tryAgain');
  }
  if (right) return t(`game.correct.${profileType}`);
  if (item.kind === 'letters') return t('letters.answerIs', { answer: item.puzzle.answer });
  if (item.kind === 'typing') return null;
  if (item.kind === 'sentence') {
    return t('sentences.answerIs', {
      answer: `${item.puzzle.words.join(' ')}${item.puzzle.ending}`,
    });
  }
  return t('game.answerWas', { answer: item.question.options[item.question.correctIndex].text });
}

function OutOfHearts({ onRefill }: { onRefill: () => void }) {
  const { t } = useTranslation();
  useEffect(() => {
    playFeedback('wrong');
  }, []);
  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <PrimaryButton label={t('path.outOfHearts.refill')} onPress={onRefill} />
          <SecondaryButton label={t('path.passed.home')} onPress={() => router.replace('/')} />
        </View>
      }
    >
      <View style={styles.center}>
        <Hearts hearts={0} />
      </View>
      <ThemedText variant="title" accessibilityRole="header">
        {t('path.outOfHearts.title')}
      </ThemedText>
      <ThemedText color="textMuted">{t('path.outOfHearts.body')}</ThemedText>
    </Screen>
  );
}

type RefillProps = {
  courseId: CourseId;
  theme: Theme;
  mistakes: readonly string[];
  sentencePool: readonly string[];
  rng: Rng;
  onDone: () => void;
};

/** "Earn them back": missed questions again, one life per right answer. */
function Refill({ courseId, theme, mistakes, sentencePool, rng, onDone }: RefillProps) {
  const { t } = useTranslation();
  // Only mistakes that can be asked as a choice question (a lone sentence cannot).
  const [refill, setRefill] = useState<RefillSession>(() =>
    startRefill(mistakes.filter((id) => ask(id) !== null)),
  );
  const [pick, setPick] = useState<number | null>(null);
  const conceptId = refill.queue[0];
  const [question, setQuestion] = useState(() => ask(conceptId));

  function ask(id: string | undefined) {
    if (!id) return null;
    return buildQuestion({
      bundle: content,
      courseId,
      conceptId: id,
      direction: 'targetToNative',
      distractorIds: [...theme.words, ...sentencePool],
      rng,
    });
  }

  useEffect(() => {
    if (!question) onDone();
  }, [question, onDone]);
  if (!question) return null;

  const onPick = (index: number) => {
    if (pick !== null) return;
    setPick(index);
    const right = index === question.correctIndex;
    playFeedback(right ? 'correct' : 'wrong');
    setRefill((r) => refillAnswer(r, right));
  };

  const onContinue = () => {
    if (isRefilled(refill)) return onDone();
    setPick(null);
    setQuestion(ask(refill.queue[0]));
  };

  return (
    <Screen
      footer={
        pick === null ? undefined : (
          <View style={styles.footer}>
            <PrimaryButton label={t('common.continue')} onPress={onContinue} />
          </View>
        )
      }
    >
      <View style={styles.header}>
        <CloseButton />
        <View style={styles.grow}>
          <ThemedText variant="option">{t('path.refill.title')}</ThemedText>
        </View>
        <Hearts hearts={refill.hearts} />
      </View>
      <QuizPromptCard
        prompt={question.prompt}
        hint={t(`quiz.meaningIn.${question.answerLang}`)}
        onSpeak={() => speak(question.prompt, question.promptLang)}
        onSpeakSlow={() => speak(question.prompt, question.promptLang, { slow: true })}
      />
      <QuizOptions
        questionKey={`refill:${refill.queue.length}:${refill.hearts}:${question.conceptId}`}
        options={question.options}
        onPick={onPick}
        reveal={pick === null ? undefined : { picked: pick, correct: question.correctIndex }}
      />
    </Screen>
  );
}

type PassedProps = StepProps & { reward: SessionReward; mistakes: number; exam: boolean };

function Passed({ nickname, themes, themeIndex, stepIndex, reward, mistakes, exam }: PassedProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  useEffect(() => {
    playFeedback(exam ? 'levelUp' : 'complete');
  }, [exam]);
  const nextTheme = exam ? themeIndex + 1 : themeIndex;
  const nextStep = exam ? 0 : stepIndex + 1;
  const hasNext = nextTheme < themes.length;
  const stats = [
    t('path.passed.mistakes', { count: mistakes }),
    t('game.summary.xp', { n: reward.xp }),
    t('game.summary.gems', { n: reward.gems }),
    t('game.summary.streak', { n: reward.streak }),
  ];
  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {hasNext ? (
            <PrimaryButton
              label={t(exam ? 'path.passed.nextTheme' : 'path.passed.next')}
              onPress={() =>
                router.replace({
                  pathname: '/play/step',
                  params: { theme: String(nextTheme), step: String(nextStep) },
                })
              }
            />
          ) : null}
          <SecondaryButton label={t('path.passed.home')} onPress={() => router.replace('/')} />
        </View>
      }
    >
      <View style={styles.medal}>
        <PopIn>
          <LevelMedal />
        </PopIn>
      </View>
      <ThemedText variant="label" color="accentText">
        {exam ? themeName(t, themes[themeIndex], themeIndex + 1) : t('path.passed.eyebrow')}
      </ThemedText>
      <ThemedText variant="title" accessibilityRole="header">
        {t(exam ? 'path.passed.exam' : 'path.passed.title', { nickname })}
      </ThemedText>
      {stats.map((text) => (
        <View key={text} style={[styles.stat, { borderTopColor: colors.border }]}>
          <ThemedText variant="option">{text}</ThemedText>
        </View>
      ))}
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
  grow: {
    flex: 1,
  },
  center: {
    alignItems: 'flex-start',
    paddingVertical: space.xl,
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
