import { StyleSheet } from 'react-native';

import { space, touchTarget, useTheme } from '@/theme';

import { PressScale } from './PressScale';
import { ThemedText } from './ThemedText';

type Props = {
  label: string;
  onPress: () => void;
};

/** The screen's main action. Sits at the bottom, within reach of either hand. */
export function PrimaryButton({ label, onPress }: Props) {
  const { colors, radii, elevation } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: colors.accent,
          borderRadius: radii.lg,
          boxShadow: elevation.accent ?? undefined,
        },
      ]}
    >
      <ThemedText variant="button" color="onAccent">
        {label}
      </ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.mini,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
});
