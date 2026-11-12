import { useEffect, useState } from 'react';

/**
 * The value, but only once it has stayed the same for `delayMs`. iOS draws
 * text blurry when it is redrawn while its card is still scaled by a press or
 * bounce animation (BUG-1), so a text colour change waits for the motion to end.
 */
export function useSettled<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (Object.is(value, settled)) return;
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, settled, delayMs]);
  return settled;
}
