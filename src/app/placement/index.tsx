import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BlockProgress } from '@/components/BlockProgress';
import { QuizOptions } from '@/components/QuizOptions';
import { QuizPromptCard } from '@/components/QuizPromptCard';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { findCourse } from '@/features/languages';
import { difficultyFromPlacement, startPath } from '@/features/path';
import {
  answeredCount,
  answerSession,
  BLOCK_COUNT,
  placementResult,
  QUESTIONS_PER_BLOCK,
  SELF_ASSESSMENTS,
  startSession,
  TOTAL_QUESTIONS,
  type PlacementSession,
  type SelfAssessment,
  type SessionContext,
} from '@/features/placement';
import { profilesStore, setCourseLevel, useActiveProfile } from '@/features/profiles';
import { seededRng } from '@/features/quiz/rng';
import { speak } from '@/lib/speech';
import { savePath } from '@/storage/path';
import { useReadAloud } from '@/lib/useReadAloud';
import { space } from '@/theme';

export default function PlacementScreen() {
  const profile = useActiveProfile();
  const { self } = useLocalSearchParams<{ self?: string }>();
  const assessment = SELF_ASSESSMENTS.find((s) => s === self);

  if (!profile || profile.type === 'mini' || !assessment) return <Redirect href="/" />;
  return (
    <Test
      profileId={profile.id}
      courseId={profile.courseId}
      profileType={profile.type}
      self={assessment}
    />
  );
}

type TestProps = {
  profileId: string;
  courseId: SessionContext['courseId'];
  profileType: SessionContext['profileType'];
  self: SelfAssessment;
};

function Test({ profileId, courseId, profileType, self }: TestProps) {
  const { t } = useTranslation();
  const [rng] = useState(() => seededRng(Date.now()));
  const ctx = useMemo<SessionContext>(
    () => ({ bundle: content, courseId, profileType, rng }),
    [courseId, profileType, rng],
  );
  const [session, setSession] = useState<PlacementSession | null>(() => startSession(ctx, self));
  const question = session?.question ?? null;

  useReadAloud(question, profileType);

  if (!session || !question) return <Redirect href="/onboarding/level" />;

  const answer = (optionIndex: number | null) => {
    const next = answerSession(ctx, session, optionIndex);
    if (next.question) {
      setSession(next);
      return;
    }
    const level = placementResult(next.placement);
    const saved = profilesStore.update((state) => setCourseLevel(state, profileId, level));
    if (!saved.ok) return;
    // The result picks the first theme of the level and how hard its content is.
    const correct = next.placement.finished.reduce((sum, b) => sum + b.correct, 0);
    const scale = findCourse(courseId)?.levels[profileType] ?? [];
    savePath(
      profileId,
      courseId,
      startPath(
        pathOf(content, courseId, profileType),
        scale,
        level,
        difficultyFromPlacement(correct, TOTAL_QUESTIONS),
      ),
    );
    router.replace('/placement/result');
  };

  const answered = answeredCount(session.placement);
  const current = answered + 1;

  return (
    <Screen
      footer={<SecondaryButton label={t('placement.dontKnow')} onPress={() => answer(null)} />}
    >
      <View style={styles.header}>
        <BlockProgress
          answered={answered}
          blockSize={QUESTIONS_PER_BLOCK}
          blocks={BLOCK_COUNT}
          label={t('quiz.progressLabel', { current, total: TOTAL_QUESTIONS })}
        />
        <ThemedText variant="label" color="textMuted">
          {t('placement.progress', { current, total: TOTAL_QUESTIONS })}
        </ThemedText>
      </View>

      <QuizPromptCard
        prompt={question.prompt}
        hint={t(`quiz.meaningIn.${question.answerLang}`)}
        onSpeak={() => speak(question.prompt, question.promptLang)}
      />

      <QuizOptions questionKey={question.conceptId} options={question.options} onPick={answer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
});
