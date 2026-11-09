import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput } from 'react-native';

import type { Verdict } from '@/features/answer-check';
import { space, stroke, touchTarget, useTheme } from '@/theme';

import { Bounce, Shake } from './Motion';

type Props = {
  /** Changes for each new question, so the field starts empty and focused. */
  questionKey: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** Once checked: the result colours the field and it stops taking input. */
  verdict: Verdict | null;
  /** Taller field for whole sentences. */
  multiline?: boolean;
};

/** The answer field of a typing question, shared by the typing game and theme steps. */
export function TypingBoard({
  questionKey,
  value,
  onChange,
  onSubmit,
  verdict,
  multiline = false,
}: Props) {
  const { t } = useTranslation();
  const { colors, radii, text, elevation } = useTheme();
  return (
    <Shake trigger={verdict === 'wrong'}>
      <Bounce trigger={verdict === 'correct'}>
        <TextInput
          key={questionKey}
          accessibilityLabel={t('typing.inputLabel')}
          placeholder={t('typing.placeholder')}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          editable={verdict === null}
          multiline={multiline}
          submitBehavior={multiline ? 'submit' : undefined}
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
                verdict === 'correct'
                  ? colors.correct
                  : verdict === 'wrong'
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
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: touchTarget.mini,
    borderWidth: stroke.thin,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
});
