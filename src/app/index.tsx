import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { space, useTheme } from '@/theme';

// Placeholder home screen until onboarding (LNG-16).
export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors, text } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[text.word, { color: colors.accentText }]}>{t('app.name')}</Text>
      <Text style={[text.body, { color: colors.textMuted }]}>{t('home.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
});
