import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { space, stroke, touchTarget, useTheme } from '@/theme';

import { SpeakerIcon } from './illustrations';
import { PressScale } from './PressScale';
import { ThemedText } from './ThemedText';

// Up to this length a prompt fits the big word style on the smallest phones.
const SHORT_PROMPT = 8;

type Props = {
  prompt: string;
  /** Short instruction under the prompt, e.g. "What is it in Turkish?". */
  hint: string;
  onSpeak: () => void;
};

/** The question of a quiz: big prompt, instruction and a read-aloud button. */
export function QuizPromptCard({ prompt, hint, onSpeak }: Props) {
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
        accessibilityLabel={t('quiz.speak')}
        onPress={onSpeak}
        style={[styles.speaker, { backgroundColor: colors.info, borderRadius: radii.pill }]}
      >
        <SpeakerIcon />
      </PressScale>
      <ThemedText
        testID="quiz-prompt"
        variant={prompt.length <= SHORT_PROMPT ? 'word' : 'title'}
        color="accentText"
        accessibilityRole="header"
        style={styles.centered}
      >
        {prompt}
      </ThemedText>
      <ThemedText color="textMuted" style={styles.centered}>
        {hint}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
  centered: {
    textAlign: 'center',
  },
});
