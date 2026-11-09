import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  hintTileId,
  isDone,
  placedTileIds,
  type Puzzle,
  type Slot,
} from '@/features/games/letter-order';
import { dimmedOpacity, space, stroke, touchTarget, useTheme } from '@/theme';

import { PressScale } from './PressScale';
import { ThemedText } from './ThemedText';

// Letter-tile board of the spelling game: answer slots and the tiles to place.

export function Slots({ puzzle, onClear }: { puzzle: Puzzle; onClear: (index: number) => void }) {
  const { t } = useTranslation();
  const { colors, radii } = useTheme();
  const letterOf = new Map(puzzle.tiles.map((tile) => [tile.id, tile.letter]));
  // 1-based number of each letter slot, for screen readers ("box 3").
  const positions = puzzle.slots.map(
    (_, i) => puzzle.slots.slice(0, i + 1).filter((s) => s.kind === 'letter').length,
  );
  return (
    <View
      style={styles.row}
      accessible={isDone(puzzle)}
      accessibilityLabel={isDone(puzzle) ? puzzle.answer : undefined}
      testID="letter-slots"
    >
      {puzzle.slots.map((slot: Slot, i) => {
        if (slot.kind === 'fixed') {
          return (
            <View key={i} style={styles.fixed}>
              <ThemedText variant="option">{slot.char === ' ' ? '' : slot.char}</ThemedText>
            </View>
          );
        }
        const position = positions[i];
        const letter = slot.tileId === null ? null : (letterOf.get(slot.tileId) ?? null);
        const background = puzzle.solved
          ? colors.correct
          : puzzle.revealed
            ? colors.highlight
            : letter
              ? colors.surface
              : colors.surfaceShade;
        return (
          <PressScale
            key={i}
            accessibilityRole="button"
            accessibilityLabel={
              letter
                ? t('letters.slot', { n: position, letter })
                : t('letters.slotEmpty', { n: position })
            }
            disabled={!letter || isDone(puzzle)}
            onPress={() => onClear(i)}
            style={[
              styles.cell,
              {
                backgroundColor: background,
                borderColor: letter ? colors.accentText : colors.border,
                borderStyle: letter ? 'solid' : 'dashed',
                borderRadius: radii.sm,
              },
            ]}
          >
            <ThemedText variant="option" color={puzzle.solved ? 'onCorrect' : 'text'}>
              {letter ?? ''}
            </ThemedText>
          </PressScale>
        );
      })}
    </View>
  );
}

export function Tiles({ puzzle, onPlace }: { puzzle: Puzzle; onPlace: (tileId: number) => void }) {
  const { t } = useTranslation();
  const { colors, radii, elevation } = useTheme();
  const placed = placedTileIds(puzzle);
  const hint = hintTileId(puzzle);
  return (
    <View style={styles.row}>
      {puzzle.tiles.map((tile) => {
        const used = placed.has(tile.id);
        const hinted = tile.id === hint;
        return (
          <PressScale
            key={tile.id}
            accessibilityRole="button"
            accessibilityLabel={t('letters.tile', { letter: tile.letter })}
            accessibilityHint={hinted ? t('letters.hintLabel') : undefined}
            accessibilityState={{ disabled: used }}
            disabled={used}
            onPress={() => onPlace(tile.id)}
            style={[
              styles.cell,
              {
                // A used tile keeps its place so the others do not jump around.
                opacity: used ? dimmedOpacity / 4 : 1,
                backgroundColor: hinted ? colors.highlight : colors.surface,
                borderColor: hinted ? colors.accentText : colors.border,
                borderWidth: hinted ? stroke.thick : stroke.thin,
                borderRadius: radii.sm,
                boxShadow: used ? undefined : (elevation.surface ?? undefined),
              },
            ]}
          >
            <ThemedText variant="option">{tile.letter}</ThemedText>
          </PressScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  cell: {
    width: touchTarget.kid,
    height: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
  },
  fixed: {
    width: touchTarget.kid / 2,
    height: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
