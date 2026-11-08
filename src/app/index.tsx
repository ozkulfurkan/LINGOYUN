import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, space } from '@/theme';

// Placeholder home screen until onboarding (LNG-16).
export default function HomeScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('app.name')}</Text>
      <Text style={styles.subtitle}>{t('home.comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
});
