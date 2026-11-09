import { useEffect, useRef, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

/** Sideways travel of a wrong-answer shake (dp). */
const SHAKE = 8;
const BOUNCE_SCALE = 1.08;
const PULSE_SCALE = 1.25;

type Props = {
  /** Plays once each time this value changes to something truthy/new. */
  trigger: number | boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Soft side-to-side shake (three swings) for a wrong answer: says "not this
 * one" without punishing (game-feel skill). Still under reduced motion.
 */
export function Shake({ trigger, style, children }: Props) {
  const { motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const x = useSharedValue(0);

  useEffect(() => {
    if (!trigger || reducedMotion) return;
    const swing = motion.feedback / 6;
    x.set(
      withSequence(
        withTiming(-SHAKE, { duration: swing }),
        withTiming(SHAKE, { duration: swing }),
        withTiming(-SHAKE / 2, { duration: swing }),
        withTiming(SHAKE / 2, { duration: swing }),
        withTiming(0, { duration: swing }),
      ),
    );
  }, [trigger, reducedMotion, motion.feedback, x]);

  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** Quick grow-and-settle for a right answer. Still under reduced motion. */
export function Bounce({ trigger, style, children }: Props) {
  const { motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!trigger || reducedMotion) return;
    scale.set(
      withSequence(
        withTiming(BOUNCE_SCALE, { duration: motion.tap }),
        withSpring(1, motion.spring),
      ),
    );
  }, [trigger, reducedMotion, motion.tap, motion.spring, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/** A pop each time a number goes up, e.g. the gem counter. */
export function Pulse({ value, children }: { value: number; children: ReactNode }) {
  const { motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const previous = useRef(value);

  useEffect(() => {
    const grew = value > previous.current;
    previous.current = value;
    if (reducedMotion || !grew) return;
    scale.set(
      withSequence(withTiming(PULSE_SCALE, { duration: motion.tap }), withSpring(1, motion.spring)),
    );
  }, [value, reducedMotion, motion.tap, motion.spring, scale]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <Animated.View style={animated}>{children}</Animated.View>;
}
