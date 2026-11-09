import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { touchTarget, useTheme } from '@/theme';

/** Window rectangle of a drop zone, from View.measureInWindow. */
export type DropZone = { x: number; y: number; width: number; height: number };

/** A drop this close to the zone still counts: it snaps in like a magnet (kids-ux). */
export const DROP_TOLERANCE = touchTarget.mini / 2;

/** True when a point in window coordinates lands in the zone, with tolerance. */
export function isInZone(zone: DropZone | null, x: number, y: number): boolean {
  if (!zone) return false;
  return (
    x >= zone.x - DROP_TOLERANCE &&
    x <= zone.x + zone.width + DROP_TOLERANCE &&
    y >= zone.y - DROP_TOLERANCE &&
    y <= zone.y + zone.height + DROP_TOLERANCE
  );
}

type Props = {
  /** Measures the drop zone at the start of every drag (the page may have scrolled). */
  measureZone: (done: (zone: DropZone | null) => void) => void;
  onDrop: () => void;
  disabled?: boolean;
  children: ReactNode;
};

/**
 * Lets a child be dragged onto a drop zone. Taps go to the child (it is
 * claimed only after the finger moves), so tapping stays the accessible way.
 * Uses React Native's own PanResponder: no extra native module, so no new
 * development build is needed.
 */
export function DraggableBlock({ measureZone, onDrop, disabled = false, children }: Props) {
  const { motion } = useTheme();
  const reducedMotion = useReducedMotion();
  const [offset] = useState(() => new Animated.ValueXY());
  const zone = useRef<DropZone | null>(null);
  // Latest props, read only inside gesture callbacks (never during render).
  const latest = useRef({ measureZone, onDrop, disabled, reducedMotion, spring: motion.spring });
  useEffect(() => {
    latest.current = { measureZone, onDrop, disabled, reducedMotion, spring: motion.spring };
  });

  // The refs below are read only inside PanResponder callbacks, which run on
  // touch events, never during render; the compiler cannot see that.
  // eslint-disable-next-line react-hooks/refs
  const [responder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !latest.current.disabled && Math.hypot(g.dx, g.dy) > 6,
      onPanResponderGrant: () => latest.current.measureZone((z) => (zone.current = z)),
      onPanResponderMove: Animated.event([null, { dx: offset.x, dy: offset.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        if (isInZone(zone.current, g.moveX, g.moveY)) {
          offset.setValue({ x: 0, y: 0 });
          latest.current.onDrop();
          return;
        }
        if (latest.current.reducedMotion) offset.setValue({ x: 0, y: 0 });
        else
          Animated.spring(offset, {
            toValue: { x: 0, y: 0 },
            damping: latest.current.spring.damping,
            stiffness: latest.current.spring.stiffness,
            useNativeDriver: false,
          }).start();
      },
      onPanResponderTerminate: () => offset.setValue({ x: 0, y: 0 }),
    }),
  );

  return (
    <Animated.View
      {...responder.panHandlers}
      style={{ transform: offset.getTranslateTransform(), zIndex: 1 }}
    >
      {children}
    </Animated.View>
  );
}

/** Anything that can report its window rectangle, such as a mounted View. */
export type Measurable = {
  measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
};

/** Measures a view's window rectangle for DraggableBlock. */
export function measureView(view: Measurable | null, done: (zone: DropZone | null) => void): void {
  if (!view) return done(null);
  view.measureInWindow((x, y, width, height) => done({ x, y, width, height }));
}
