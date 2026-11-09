import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { AdultArt, KidArt, MiniArt } from '@/components/illustrations';
import { PressScale } from '@/components/PressScale';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import {
  markProfileChosen,
  profilesStore,
  setActiveProfile,
  useProfiles,
} from '@/features/profiles';
import { space, stroke, touchTarget, useTheme } from '@/theme';

const ART = { mini: MiniArt, kid: KidArt, adult: AdultArt } as const;

/**
 * "Who is playing?": big profile cards a child can pick alone, without the
 * gate. Adding, deleting and settings stay behind the gate.
 */
export default function WhoIsPlayingScreen() {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  const { profiles, activeId } = useProfiles();

  const pick = (id: string) => {
    profilesStore.update((s) => setActiveProfile(s, id));
    markProfileChosen();
    router.replace('/');
  };

  return (
    <Screen>
      <ThemedText variant="title" accessibilityRole="header">
        {t('who.title')}
      </ThemedText>
      {profiles.map((profile) => {
        const Art = ART[profile.type];
        const active = profile.id === activeId;
        return (
          <PressScale
            key={profile.id}
            accessibilityRole="button"
            accessibilityLabel={profile.nickname}
            accessibilityState={{ selected: active }}
            onPress={() => pick(profile.id)}
            style={[
              styles.card,
              {
                backgroundColor: active ? colors.highlight : colors.surface,
                borderColor: active ? colors.accentText : colors.border,
                borderWidth: active ? stroke.thick : stroke.thin,
                borderRadius: radii.lg,
                boxShadow: elevation.surface ?? undefined,
              },
            ]}
          >
            <Art />
            <ThemedText variant="title">{profile.nickname}</ThemedText>
          </PressScale>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: touchTarget.mini * 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
  },
});
