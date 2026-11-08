import { StyleSheet } from 'react-native';

import { space, stroke, touchTarget, useTheme } from '@/theme';

import { PressScale } from './PressScale';
import { ThemedText } from './ThemedText';

type Props = {
  label: string;
  onPress: () => void;
};

/** A quiet way out of the main choice, such as "I don't know". */
export function SecondaryButton({ label, onPress }: Props) {
  const { colors, radii } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.button, { borderColor: colors.textMuted, borderRadius: radii.lg }]}
    >
      <ThemedText variant="option" color="textMuted">
        {label}
      </ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
});
