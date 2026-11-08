import { useEffect, type ReactNode } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

const START_SCALE = 0.5;

/** Springs its content into view; with reduced motion it simply appears. */
export function PopIn({ children }: { children: ReactNode }) {
  const { motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : START_SCALE);

  useEffect(() => {
    scale.set(withSpring(1, motion.spring));
  }, [scale, motion.spring]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return <Animated.View style={animated}>{children}</Animated.View>;
}
