import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { QuizOption } from '@/features/quiz/types';
import { dimmedOpacity, space, stroke, touchTarget, useTheme } from '@/theme';

import { AnswerMark } from './illustrations';
import { PressScale } from './PressScale';
import { ThemedText } from './ThemedText';

// Short answers fit two columns.
const SHORT_OPTION = 12;

type Reveal = {
  /** Option the learner picked. */
  picked: number;
  correct: number;
};

type Props = {
  options: readonly QuizOption[];
  /** Question id, so a new question gets fresh buttons. */
  questionKey: string;
  onPick: (index: number) => void;
  /** Once set, shows the result and stops taking answers. */
  reveal?: Reveal;
};

/**
 * Answer buttons of a quiz. The result shows as colour plus a mark, so it never
 * depends on colour alone, and the right answer is always shown.
 */
export function QuizOptions({ options, questionKey, onPick, reveal }: Props) {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  const compact = options.every((o) => o.text.length <= SHORT_OPTION);

  return (
    <View style={styles.options}>
      {options.map((option, index) => {
        const isCorrect = reveal?.correct === index;
        const isWrongPick = reveal?.picked === index && !isCorrect;
        const background = isCorrect
          ? colors.correct
          : isWrongPick
            ? colors.incorrect
            : colors.surface;
        const shadow = isCorrect ? elevation.correct : isWrongPick ? null : elevation.surface;
        const state = isCorrect
          ? t('quiz.rightAnswer')
          : isWrongPick
            ? t('quiz.yourAnswer')
            : undefined;
        return (
          <PressScale
            key={`${questionKey}:${option.conceptId}`}
            accessibilityRole="button"
            accessibilityLabel={option.text}
            accessibilityHint={state}
            accessibilityState={{ disabled: reveal !== undefined }}
            disabled={reveal !== undefined}
            onPress={() => onPick(index)}
            style={[
              styles.option,
              compact ? styles.optionCompact : styles.optionWide,
              {
                backgroundColor: background,
                borderColor: colors.border,
                borderRadius: radii.md,
                boxShadow: shadow ?? undefined,
                opacity: reveal && !isCorrect && !isWrongPick ? dimmedOpacity : 1,
              },
            ]}
          >
            <ThemedText
              variant="option"
              color={isCorrect ? 'onCorrect' : isWrongPick ? 'onIncorrect' : 'text'}
              style={styles.text}
            >
              {option.text}
            </ThemedText>
            {isCorrect || isWrongPick ? (
              <View style={styles.mark}>
                <AnswerMark kind={isCorrect ? 'right' : 'wrong'} />
              </View>
            ) : null}
          </PressScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
  text: {
    textAlign: 'center',
  },
  mark: {
    position: 'absolute',
    top: space.xs,
    right: space.xs,
  },
});
