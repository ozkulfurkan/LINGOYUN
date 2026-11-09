import { Redirect } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View } from 'react-native';

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
import { content } from '@/content/bundle';
import { finishRound } from '@/features/games/finishRound';
import {
  answerTyping,
  currentItem,
  isTypingFinished,
  startTypingRound,
  typingGrades,
  type TypingResult,
  type TypingRound,
} from '@/features/games/free-typing';
import type { CourseId } from '@/features/languages';
import { levelConcepts } from '@/features/map';
import { useActiveProfile } from '@/features/profiles';
import type { SessionReward } from '@/features/progress';
import { seededRng } from '@/features/quiz/rng';
import { gradeFromVerdict, localDay, recordAnswer } from '@/features/srs';
import { playFeedback } from '@/lib/feedback';
import { comboEvent, trailingRun } from '@/lib/feedbackEvents';
import { speak } from '@/lib/speech';
import { loadProgress } from '@/storage/progress';
import { loadDeck, saveDeck } from '@/storage/srs';
import { space, stroke, touchTarget, useTheme } from '@/theme';

/** Translating by typing is an adult game (Faz 5): kids get the tap-based games. */
export default function FreeTypingScreen() {
  const profile = useActiveProfile();
  const level = profile?.courses[profile.courseId]?.level;
  const [roundNumber, setRoundNumber] = useState(0);

  if (!profile || profile.type !== 'adult' || !level) return <Redirect href="/" />;
  return (
    <Game
      key={roundNumber}
      profileId={profile.id}
      nickname={profile.nickname}
      courseId={profile.courseId}
      level={level}
      onPlayAgain={() => setRoundNumber((n) => n + 1)}
    />
  );
}

type GameProps = {
  profileId: string;
  nickname: string;
  courseId: CourseId;
  level: string;
  onPlayAgain: () => void;
};

function Game({ profileId, nickname, courseId, level, onPlayAgain }: GameProps) {
  const { t } = useTranslation();
  const { colors, radii, text, elevation } = useTheme();
  const [today] = useState(() => localDay(new Date()));
  const [round, setRound] = useState<TypingRound>(() =>
    startTypingRound({
      bundle: content,
      courseId,
      deck: loadDeck(profileId, courseId),
      today,
      levelConcepts: levelConcepts(content, courseId, 'adult', level),
      rng: seededRng(Date.now()),
    }),
  );
  // The result of the current item, shown until the learner moves on.
  const [shown, setShown] = useState<TypingResult | null>(null);
  const [typed, setTyped] = useState('');
  const [gems, setGems] = useState(() => loadProgress(profileId).gems);
  const [comboRun, setComboRun] = useState<number | null>(null);
  const [reward, setReward] = useState<SessionReward | null>(null);
  const [newLevel, setNewLevel] = useState<string | null>(null);

  // While a result is shown, the answered item is the last one in `results`.
  const item = shown ? round.items[round.results.length - 1] : currentItem(round);

  if (reward) {
    const grades = typingGrades(round);
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
  if (!item) return <Redirect href="/" />;

  const submit = (value: string) => {
    if (shown) return;
    const next = answerTyping(content, round, value);
    const result = next.results[next.results.length - 1];
    const grade = gradeFromVerdict(result.verdict);
    setRound(next);
    setShown(result);
    saveDeck(
      profileId,
      courseId,
      recordAnswer(loadDeck(profileId, courseId), item.conceptId, grade, today),
    );
    if (grade === 'good') setGems((g) => g + 1);
    const run = trailingRun(typingGrades(next));
    const combo = grade === 'good' ? comboEvent(run) : null;
    setComboRun(combo ? run : null);
    playFeedback(grade === 'again' ? 'wrong' : (combo ?? 'correct'));
    speak(result.expected, item.answerLang);
  };

  const onContinue = () => {
    setShown(null);
    setTyped('');
    if (!isTypingFinished(round)) return;
    const finished = finishRound({
      profileId,
      courseId,
      profileType: 'adult',
      level,
      grades: typingGrades(round),
      today,
    });
    setNewLevel(finished.newLevel);
    setReward(finished.reward);
  };

  const feedback = !shown
    ? null
    : shown.verdict === 'correct'
      ? withCombo(t('game.correct.adult'), comboRun, t)
      : shown.verdict === 'nearMiss'
        ? t('typing.nearMiss', { answer: shown.expected })
        : shown.verdict === 'typo'
          ? t('typing.typo', { answer: shown.expected })
          : t('game.answerWas', { answer: shown.expected });

  const answered = round.results.length - (shown ? 1 : 0);

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {feedback ? <GameFeedback text={feedback} /> : null}
          {shown ? (
            <PrimaryButton label={t('common.continue')} onPress={onContinue} />
          ) : (
            <>
              <PrimaryButton label={t('typing.check')} onPress={() => submit(typed)} />
              <SecondaryButton label={t('typing.dontKnow')} onPress={() => submit('')} />
            </>
          )}
        </View>
      }
    >
      <View style={styles.header}>
        <CloseButton />
        <BlockProgress
          answered={answered + (shown ? 1 : 0)}
          blockSize={round.items.length}
          blocks={1}
          label={t('quiz.progressLabel', { current: answered + 1, total: round.items.length })}
        />
        <GemCount gems={gems} />
      </View>

      <QuizPromptCard
        prompt={item.prompt}
        hint={t(item.isSentence ? 'typing.hintSentence' : 'typing.hintWord', {
          language: t(`languages.${item.answerLang}`),
        })}
        onSpeak={() => speak(item.prompt, item.promptLang)}
      />

      <Shake trigger={shown?.verdict === 'wrong' ? round.results.length : 0}>
        <Bounce trigger={shown?.verdict === 'correct' ? round.results.length : 0}>
          <TextInput
            key={item.conceptId}
            accessibilityLabel={t('typing.inputLabel')}
            placeholder={t('typing.placeholder')}
            placeholderTextColor={colors.textMuted}
            value={shown ? shown.typed : typed}
            onChangeText={setTyped}
            onSubmitEditing={() => submit(typed)}
            editable={!shown}
            multiline={item.isSentence}
            submitBehavior={item.isSentence ? 'submit' : undefined}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            returnKeyType="done"
            autoFocus
            style={[
              text.option,
              styles.input,
              {
                color: colors.text,
                backgroundColor:
                  shown?.verdict === 'correct'
                    ? colors.correct
                    : shown?.verdict === 'wrong'
                      ? colors.incorrect
                      : colors.surface,
                borderColor: colors.border,
                borderRadius: radii.md,
                boxShadow: elevation.surface ?? undefined,
              },
            ]}
          />
        </Bounce>
      </Shake>
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
  input: {
    minHeight: touchTarget.mini,
    borderWidth: stroke.thin,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
