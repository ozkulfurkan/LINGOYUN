import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import { themeUnits } from '@/content';
import { content } from '@/content/bundle';
import { useActiveProfile } from '@/features/profiles';
import { space, stroke, useTheme } from '@/theme';

// Themes with their own title and description in src/i18n.
const THEMES = ['restaurant'] as const;
// Difficulties with their own description in src/i18n.
const TIERS = ['A2', 'B1', 'B2', 'C1'] as const;

/** One real-life situation: the learner picks a difficulty and a game. */
export default function ThemeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const profile = useActiveProfile();
  const params = useLocalSearchParams<{ theme?: string }>();
  const theme = THEMES.find((name) => name === params.theme);

  if (!profile || profile.type !== 'adult' || !theme) return <Redirect href="/" />;

  const available = themeUnits(content, profile.courseId, profile.type, theme).map((u) => u.level);
  const tiers = TIERS.filter((tier) => available.includes(tier));

  return (
    <Screen>
      <ThemedText variant="title" accessibilityRole="header">
        {t(`themes.${theme}.title`)}
      </ThemedText>
      <ThemedText color="textMuted">{t(`themes.${theme}.body`)}</ThemedText>
      {tiers.map((tier) => (
        <View key={tier} style={[styles.tier, { borderTopColor: colors.border }]}>
          <ThemedText variant="option" color="accentText">
            {tier}
          </ThemedText>
          <ThemedText color="textMuted">{t(`themes.tier.${tier}`)}</ThemedText>
          <View style={styles.row}>
            <View style={styles.half}>
              <SecondaryButton
                label={`${tier} ${t('themes.words')}`}
                onPress={() =>
                  router.push({
                    pathname: '/play/multiple-choice',
                    params: { mode: 'theme', theme, tier },
                  })
                }
              />
            </View>
            <View style={styles.half}>
              <SecondaryButton
                label={`${tier} ${t('themes.sentences')}`}
                onPress={() =>
                  router.push({ pathname: '/play/sentence-builder', params: { theme, tier } })
                }
              />
            </View>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tier: {
    gap: space.xs,
    borderTopWidth: stroke.thin,
    paddingTop: space.md,
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
    marginTop: space.xs,
  },
  half: {
    flex: 1,
  },
});
