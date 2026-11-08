import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { space, stroke, touchTarget, useTheme } from '@/theme';

import { CheckMark } from './illustrations';
import { PressScale } from './PressScale';
import { ThemedText } from './ThemedText';

type Props = {
  title: string;
  body?: string;
  /** Picture or marker on the leading side. */
  art?: ReactNode;
  selected: boolean;
  onPress: () => void;
};

/**
 * One option of a single-choice list. Selection shows as a border plus a check
 * mark, so it never depends on colour alone. Clay card in the kids theme; in
 * the adult theme the same tokens give a flat, ruled dictionary entry.
 */
export function ChoiceCard({ title, body, art, selected, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  return (
    <PressScale
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={body ? `${title}. ${body}` : title}
      accessibilityHint={selected ? t('common.selected') : undefined}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.highlight : colors.surface,
          borderColor: selected ? colors.accentText : colors.border,
          borderWidth: selected ? stroke.thick : stroke.thin,
          borderRadius: radii.md,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      {art}
      <View style={styles.text}>
        <ThemedText variant="option">{title}</ThemedText>
        {body ? <ThemedText color="textMuted">{body}</ThemedText> : null}
      </View>
      {selected ? <CheckMark /> : null}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: touchTarget.mini,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
  },
  text: {
    flex: 1,
  },
});
