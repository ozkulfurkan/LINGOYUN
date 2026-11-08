import { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { seededRng } from '@/features/quiz/rng';
import { useTheme } from '@/theme';

/** Well under the game-feel limit of ~40 particles at once. */
export const CONFETTI_COUNT = 24;
const SIZE = 10;

type Piece = {
  x: number;
  delay: number;
  drift: number;
  spin: number;
  color: number;
  round: boolean;
};

/** Deterministic layout of the pieces (no Math.random during render). */
export function confettiPieces(count: number, seed: number): Piece[] {
  const rng = seededRng(seed);
  return Array.from({ length: count }, () => ({
    x: rng(),
    delay: Math.round(rng() * 250),
    drift: (rng() - 0.5) * 80,
    spin: (rng() - 0.5) * 720,
    color: Math.floor(rng() * 4),
    round: rng() < 0.5,
  }));
}

/**
 * A short burst of clay confetti over the screen, for a perfect round or a new
 * level. Nothing at all under reduced motion. Never takes touches.
 */
export function Confetti({ seed = 1 }: { seed?: number }) {
  const reducedMotion = useReducedMotion();
  const [pieces] = useState(() => confettiPieces(CONFETTI_COUNT, seed));
  if (reducedMotion) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID="confetti">
      {pieces.map((p, i) => (
        <PieceView key={i} piece={p} />
      ))}
    </View>
  );
}

function PieceView({ piece }: { piece: Piece }) {
  const { colors, motion } = useTheme();
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);
  const palette = [colors.accent, colors.correct, colors.reward, colors.info];

  useEffect(() => {
    t.set(
      withDelay(
        piece.delay,
        withTiming(1, { duration: motion.celebrate * 2, easing: Easing.out(Easing.quad) }),
      ),
    );
  }, [t, piece.delay, motion.celebrate]);

  const animated = useAnimatedStyle(() => {
    const v = t.get();
    return {
      opacity: v < 0.85 ? 1 : (1 - v) / 0.15,
      transform: [
        { translateX: piece.x * width + piece.drift * v },
        { translateY: -SIZE + v * height * 0.7 },
        { rotate: `${piece.spin * v}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        { backgroundColor: palette[piece.color], borderRadius: piece.round ? SIZE : 2 },
        animated,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
});
