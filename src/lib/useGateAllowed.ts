import { useState } from 'react';

import { isGateOpen, needsParentGate } from '@/features/parental-gate';
import { useActiveProfile } from '@/features/profiles';

/**
 * Whether a screen behind the parental gate may open: the gate was just
 * passed, or a grown-up's own profile is playing. Checked once, when the
 * screen opens.
 */
export function useGateAllowed(): boolean {
  const profile = useActiveProfile();
  const [allowed] = useState(() => isGateOpen() || !needsParentGate(profile?.type ?? null));
  return allowed;
}
