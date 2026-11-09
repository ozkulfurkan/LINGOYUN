import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput } from 'react-native';

import { MAX_PROFILES, NICKNAME_MAX_LENGTH, type ProfileError } from '@/features/profiles';
import { space, stroke, touchTarget, useTheme } from '@/theme';

import { ThemedText } from './ThemedText';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error: ProfileError | null;
};

/** Nickname field with its error message, shared by onboarding and adding a child. */
export function NicknameInput({ value, onChange, onSubmit, error }: Props) {
  const { t } = useTranslation();
  const { colors, radii, text, elevation } = useTheme();
  return (
    <>
      <TextInput
        accessibilityLabel={t('onboarding.nickname.label')}
        placeholder={t('onboarding.nickname.placeholder')}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        maxLength={NICKNAME_MAX_LENGTH}
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="next"
        style={[
          text.option,
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.accentText : colors.border,
            borderRadius: radii.md,
            boxShadow: elevation.surface ?? undefined,
          },
        ]}
      />
      {error ? (
        <ThemedText color="accentText" accessibilityRole="alert">
          {t(`profileErrors.${error}`, { max: NICKNAME_MAX_LENGTH, limit: MAX_PROFILES })}
        </ThemedText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: touchTarget.mini,
    borderWidth: stroke.thin,
    paddingHorizontal: space.lg,
    marginTop: space.sm,
  },
});
