import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { QuizOption } from '@/features/quiz/types';
import { useSettled } from '@/lib/useSettled';
import { dimmedOpacity, space, stroke, touchTarget, useTheme } from '@/theme';

import { CardFace } from './CardFace';
import { AnswerMark } from './illustrations';
import { Bounce, Shake } from './Motion';
import { PressScale } from './PressScale';
import { ThemedText } from './ThemedText';

type ColorName = 'onCorrect' | 'onIncorrect' | 'text';

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
          <Shake
            key={`${questionKey}:${option.conceptId}`}
            trigger={isWrongPick}
            style={compact ? styles.optionCompact : styles.optionWide}
          >
            <Bounce trigger={isCorrect && reveal !== undefined}>
              <PressScale
                accessibilityRole="button"
                accessibilityLabel={option.text}
                accessibilityHint={state}
                accessibilityState={{ disabled: reveal !== undefined }}
                disabled={reveal !== undefined}
                onPress={() => onPick(index)}
                style={[
                  styles.option,
                  {
                    borderRadius: radii.md,
                    opacity: reveal && !isCorrect && !isWrongPick ? dimmedOpacity : 1,
                  },
                ]}
              >
                <CardFace
                  backgroundColor={background}
                  borderColor={colors.border}
                  borderWidth={stroke.thin}
                  borderRadius={radii.md}
                  boxShadow={shadow ?? undefined}
                />
                <OptionText color={isCorrect ? 'onCorrect' : isWrongPick ? 'onIncorrect' : 'text'}>
                  {option.text}
                </OptionText>
                {isCorrect || isWrongPick ? (
                  <View style={styles.mark}>
                    <AnswerMark kind={isCorrect ? 'right' : 'wrong'} />
                  </View>
                ) : null}
              </PressScale>
            </Bounce>
          </Shake>
        );
      })}
    </View>
  );
}

/**
 * An option's words. The colour for a right or wrong answer comes in once the
 * card's press and bounce have ended: redrawn mid-motion, iOS left the text
 * blurry (BUG-1).
 */
function OptionText({ color, children }: { color: ColorName; children: string }) {
  const { motion } = useTheme();
  const settled = useSettled(color, motion.celebrate);
  return (
    <ThemedText variant="option" color={settled} style={styles.text}>
      {children}
    </ThemedText>
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
