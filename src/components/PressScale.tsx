import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { pressedScale, useTheme } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Pressable that squashes on press and springs back, with a light tap on the
 * device. With reduced motion on, it only dims instead of moving.
 */
export function PressScale({ style, children, onPress, onPressIn, onPressOut, ...rest }: Props) {
  const { motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const pressed = useSharedValue(1);

  const animated = useAnimatedStyle(() =>
    reducedMotion ? { opacity: pressed.get() } : { transform: [{ scale: pressed.get() }] },
  );

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animated]}
      onPressIn={(e) => {
        pressed.set(withTiming(pressedScale, { duration: motion.tap }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withSpring(1, motion.spring));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        // Some devices have no haptics; the press itself must still work.
        Haptics.selectionAsync().catch(() => undefined);
        onPress?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
