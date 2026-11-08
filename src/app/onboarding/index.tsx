import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput } from 'react-native';

import { RiverHero } from '@/components/illustrations';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { defaultCourseId } from '@/features/onboarding/flow';
import {
  MAX_PROFILES,
  NICKNAME_MAX_LENGTH,
  useProfiles,
  validateNickname,
  type ProfileError,
} from '@/features/profiles';
import { space, stroke, touchTarget, useTheme } from '@/theme';

export default function NicknameScreen() {
  const { t, i18n } = useTranslation();
  const { colors, radii, text, elevation } = useTheme();
  const state = useProfiles();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<ProfileError | null>(null);

  const submit = () => {
    const result = validateNickname(nickname, state, defaultCourseId(i18n.language));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    router.push({ pathname: '/onboarding/age', params: { nickname: result.value } });
  };

  return (
    <Screen
      hero={<RiverHero />}
      footer={<PrimaryButton label={t('common.continue')} onPress={submit} />}
    >
      <ThemedText variant="title" accessibilityRole="header">
        {t('onboarding.nickname.title')}
      </ThemedText>
      <ThemedText color="textMuted">{t('onboarding.nickname.body')}</ThemedText>
      <TextInput
        accessibilityLabel={t('onboarding.nickname.label')}
        placeholder={t('onboarding.nickname.placeholder')}
        placeholderTextColor={colors.textMuted}
        value={nickname}
        onChangeText={(value) => {
          setNickname(value);
          setError(null);
        }}
        onSubmitEditing={submit}
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
    </Screen>
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
