import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { CloseButton } from '@/components/GameChrome';
import { CheckMark } from '@/components/illustrations';
import { PressScale } from '@/components/PressScale';
import { Screen } from '@/components/Screen';
import { ThemedText } from '@/components/ThemedText';
import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { EXAM_STEP, STEP_COUNT } from '@/features/path';
import { useActiveProfile } from '@/features/profiles';
import { themeName } from '@/lib/themeName';
import { loadPath } from '@/storage/path';
import { dimmedOpacity, space, stroke, touchTarget, useTheme } from '@/theme';

type StepState = 'done' | 'current' | 'locked';

/** A theme's five steps: four that teach new words, then the exam. */
export default function ThemeScreen() {
  const { t } = useTranslation();
  const profile = useActiveProfile();
  const params = useLocalSearchParams<{ index?: string }>();

  if (!profile || profile.type === 'mini') return <Redirect href="/" />;
  const themes = pathOf(content, profile.courseId, profile.type);
  const index = Number(params.index);
  const theme = themes[index];
  const progress = loadPath(profile);
  if (!theme || index > progress.themeIndex) return <Redirect href="/" />;

  const stateOf = (step: number): StepState =>
    index < progress.themeIndex || step < progress.stepIndex
      ? 'done'
      : step === progress.stepIndex
        ? 'current'
        : 'locked';

  return (
    <Screen>
      <View style={styles.header}>
        <CloseButton />
      </View>
      <ThemedText variant="title" accessibilityRole="header">
        {themeName(t, theme, index + 1)}
      </ThemedText>
      {Array.from({ length: STEP_COUNT }, (_, step) => {
        const name = step === EXAM_STEP ? t('path.exam') : t('path.step', { n: step + 1 });
        return (
          <StepRow
            key={step}
            name={name}
            state={stateOf(step)}
            onPress={() =>
              router.push({
                pathname: '/play/step',
                params: { theme: String(index), step: String(step) },
              })
            }
          />
        );
      })}
    </Screen>
  );
}

function StepRow({
  name,
  state,
  onPress,
}: {
  name: string;
  state: StepState;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  const label =
    state === 'done'
      ? t('path.stepDone', { name })
      : state === 'current'
        ? t('path.stepCurrent', { name })
        : t('path.stepLocked', { name });
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: state === 'locked' }}
      disabled={state === 'locked'}
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: state === 'current' ? colors.highlight : colors.surface,
          borderColor: state === 'current' ? colors.accentText : colors.border,
          borderWidth: state === 'current' ? stroke.thick : stroke.thin,
          borderRadius: radii.md,
          boxShadow: state === 'locked' ? undefined : (elevation.surface ?? undefined),
          opacity: state === 'locked' ? dimmedOpacity : 1,
        },
      ]}
    >
      <ThemedText variant="option" style={styles.grow}>
        {name}
      </ThemedText>
      {state === 'done' ? <CheckMark /> : null}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
  },
  row: {
    minHeight: touchTarget.mini,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
  },
  grow: {
    flex: 1,
  },
});
