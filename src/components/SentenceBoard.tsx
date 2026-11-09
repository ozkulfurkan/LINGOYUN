import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import {
  builtText,
  isSentenceDone,
  sentenceHint,
  type SentencePuzzle,
} from '@/features/games/sentence-builder';
import { space, stroke, touchTarget, useTheme } from '@/theme';

import { DraggableBlock, measureView, type Measurable } from './DraggableBlock';
import { PressScale } from './PressScale';
import { ThemedText } from './ThemedText';

// Word-block board of the sentence game: the answer area and the block pool.

type AnswerProps = {
  puzzle: SentencePuzzle;
  zoneRef: RefObject<Measurable | null>;
  onRemove: (blockId: number) => void;
};

export function AnswerArea({ puzzle, zoneRef, onRemove }: AnswerProps) {
  const { t } = useTranslation();
  const { colors, radii } = useTheme();
  const done = isSentenceDone(puzzle);
  const byId = new Map(puzzle.blocks.map((b) => [b.id, b.word]));
  return (
    <View
      ref={(view) => {
        zoneRef.current = view as unknown as Measurable | null;
      }}
      testID="sentence-answer"
      accessible={done}
      accessibilityLabel={done ? `${builtText(puzzle)}${puzzle.ending}` : undefined}
      style={[
        styles.answer,
        {
          backgroundColor: puzzle.solved ? colors.correct : colors.surfaceShade,
          borderColor: puzzle.solved ? colors.correctShade : colors.border,
          borderRadius: radii.md,
        },
      ]}
    >
      {puzzle.placed.length === 0 ? (
        <ThemedText color="textMuted">{t('sentences.dropHere')}</ThemedText>
      ) : (
        puzzle.placed.map((id, i) => {
          const word = byId.get(id) ?? '';
          const last = i === puzzle.placed.length - 1 && done;
          return (
            <WordBlock
              key={id}
              word={last ? `${word}${puzzle.ending}` : word}
              label={t('sentences.placed', { n: i + 1, word })}
              disabled={done}
              onPress={() => onRemove(id)}
            />
          );
        })
      )}
    </View>
  );
}

type PoolProps = {
  puzzle: SentencePuzzle;
  measureZone: (done: Parameters<typeof measureView>[1]) => void;
  onPlace: (blockId: number) => void;
};

export function Pool({ puzzle, measureZone, onPlace }: PoolProps) {
  const { t } = useTranslation();
  const hint = sentenceHint(puzzle);
  const full = puzzle.placed.length >= puzzle.words.length;
  return (
    <View style={styles.pool}>
      {puzzle.blocks
        .filter((b) => !puzzle.placed.includes(b.id))
        .map((b) => (
          <DraggableBlock
            key={b.id}
            measureZone={measureZone}
            onDrop={() => onPlace(b.id)}
            disabled={full}
          >
            <WordBlock
              word={b.word}
              label={t('sentences.block', { word: b.word })}
              hint={b.id === hint ? t('sentences.hintLabel') : undefined}
              highlighted={b.id === hint}
              disabled={full}
              onPress={() => onPlace(b.id)}
            />
          </DraggableBlock>
        ))}
    </View>
  );
}

type WordBlockProps = {
  word: string;
  label: string;
  hint?: string;
  highlighted?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function WordBlock({
  word,
  label,
  hint,
  highlighted = false,
  disabled = false,
  onPress,
}: WordBlockProps) {
  const { colors, radii, elevation } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.block,
        {
          backgroundColor: highlighted ? colors.highlight : colors.surface,
          borderColor: highlighted ? colors.accentText : colors.border,
          borderWidth: highlighted ? stroke.thick : stroke.thin,
          borderRadius: radii.sm,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      <ThemedText variant="option">{word}</ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  answer: {
    minHeight: touchTarget.mini * 1.5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.md,
    borderWidth: stroke.thin,
    borderStyle: 'dashed',
  },
  pool: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  block: {
    minHeight: touchTarget.kid,
    minWidth: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
});
