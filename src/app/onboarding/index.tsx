import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RiverHero } from '@/components/illustrations';
import { NicknameInput } from '@/components/NicknameInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { defaultCourseId } from '@/features/onboarding/flow';
import { useProfiles, validateNickname, type ProfileError } from '@/features/profiles';

export default function NicknameScreen() {
  const { t, i18n } = useTranslation();
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
      <NicknameInput
        value={nickname}
        onChange={(value) => {
          setNickname(value);
          setError(null);
        }}
        onSubmit={submit}
        error={error}
      />
    </Screen>
  );
}
