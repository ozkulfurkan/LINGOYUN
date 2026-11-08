import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { BlockProgress } from '@/components/BlockProgress';
import { SpeakerIcon } from '@/components/illustrations';
import { PressScale } from '@/components/PressScale';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { content } from '@/content/bundle';
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
import type { QuizOption } from '@/features/quiz/types';
import { speak, stopSpeaking } from '@/lib/speech';
import { space, stroke, touchTarget, useTheme } from '@/theme';

// Up to this length a prompt fits the big word style, and options fit two columns.
const SHORT_PROMPT = 8;
const SHORT_OPTION = 12;

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

  // Younger readers get each question read aloud; adults use the button.
  useEffect(() => {
    if (question && profileType === 'kid') speak(question.prompt, question.promptLang);
    return stopSpeaking;
  }, [question, profileType]);

  if (!session || !question) return <Redirect href="/onboarding/level" />;

  const answer = (optionIndex: number | null) => {
    const next = answerSession(ctx, session, optionIndex);
    if (next.question) {
      setSession(next);
      return;
    }
    const level = placementResult(next.placement);
    const saved = profilesStore.update((state) => setCourseLevel(state, profileId, level));
    if (saved.ok) router.replace('/placement/result');
  };

  const answered = answeredCount(session.placement);
  const current = answered + 1;
  const compact = question.options.every((o) => o.text.length <= SHORT_OPTION);

  return (
    <Screen
      footer={<SecondaryButton label={t('placement.dontKnow')} onPress={() => answer(null)} />}
    >
      <View style={styles.header}>
        <BlockProgress
          answered={answered}
          blockSize={QUESTIONS_PER_BLOCK}
          blocks={BLOCK_COUNT}
          label={t('placement.progressLabel', { current, total: TOTAL_QUESTIONS })}
        />
        <ThemedText variant="label" color="textMuted">
          {t('placement.progress', { current, total: TOTAL_QUESTIONS })}
        </ThemedText>
      </View>

      <PromptCard
        prompt={question.prompt}
        hint={t(`placement.meaningIn.${question.answerLang}`)}
        onSpeak={() => speak(question.prompt, question.promptLang)}
      />

      <View style={styles.options}>
        {question.options.map((option, index) => (
          <OptionButton
            key={`${question.conceptId}:${option.conceptId}`}
            option={option}
            compact={compact}
            onPress={() => answer(index)}
          />
        ))}
      </View>
    </Screen>
  );
}

function PromptCard({
  prompt,
  hint,
  onSpeak,
}: {
  prompt: string;
  hint: string;
  onSpeak: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.lg,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={t('placement.speak')}
        onPress={onSpeak}
        style={[styles.speaker, { backgroundColor: colors.info, borderRadius: radii.pill }]}
      >
        <SpeakerIcon />
      </PressScale>
      <ThemedText
        testID="placement-prompt"
        variant={prompt.length <= SHORT_PROMPT ? 'word' : 'title'}
        color="accentText"
        accessibilityRole="header"
        style={styles.prompt}
      >
        {prompt}
      </ThemedText>
      <ThemedText color="textMuted" style={styles.prompt}>
        {hint}
      </ThemedText>
    </View>
  );
}

function OptionButton({
  option,
  compact,
  onPress,
}: {
  option: QuizOption;
  compact: boolean;
  onPress: () => void;
}) {
  const { colors, radii, elevation } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={option.text}
      onPress={onPress}
      style={[
        styles.option,
        compact ? styles.optionCompact : styles.optionWide,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.md,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      <ThemedText variant="option" style={styles.prompt}>
        {option.text}
      </ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  card: {
    minHeight: touchTarget.mini * 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: stroke.thin,
    paddingHorizontal: space.xl,
    paddingTop: touchTarget.mini,
    paddingBottom: space.xl,
  },
  speaker: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    width: touchTarget.kid,
    height: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  option: {
    minHeight: touchTarget.mini,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
    padding: space.md,
  },
  // Slightly under half a row: the gap takes the rest, and flexGrow fills it.
  optionCompact: {
    flexBasis: '45%',
    flexGrow: 1,
  },
  optionWide: {
    flexBasis: '100%',
  },
});
