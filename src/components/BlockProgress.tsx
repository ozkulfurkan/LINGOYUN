import { StyleSheet, View } from 'react-native';

import { space, useTheme } from '@/theme';

type Props = {
  /** Questions answered so far. */
  answered: number;
  /** Questions in one block. */
  blockSize: number;
  blocks: number;
  label: string;
};

/** Progress split into the test's blocks, so the end is always in sight. */
export function BlockProgress({ answered, blockSize, blocks, label }: Props) {
  const { colors, radii } = useTheme();
  const total = blockSize * blocks;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: answered }}
      style={styles.row}
    >
      {Array.from({ length: blocks }, (_, i) => {
        const done = Math.min(Math.max(answered - i * blockSize, 0), blockSize);
        return (
          <View
            key={i}
            style={[styles.track, { backgroundColor: colors.border, borderRadius: radii.sm }]}
          >
            <View
              style={[
                styles.fill,
                {
                  width: `${(done / blockSize) * 100}%`,
                  backgroundColor: colors.correct,
                  borderRadius: radii.sm,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: space.xs,
  },
  track: {
    flex: 1,
    height: space.md,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
