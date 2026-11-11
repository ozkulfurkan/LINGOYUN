import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Access } from '@/features/subscription';

import { currentAccess, refreshSubscription } from './purchases';

/**
 * What the family may use. Starts from the stored state (works offline), then
 * asks the store each time the screen comes into view.
 */
export function useAccess(): Access {
  const [access, setAccess] = useState<Access>(() => currentAccess());
  useFocusEffect(
    useCallback(() => {
      let live = true;
      setAccess(currentAccess());
      void refreshSubscription().then(() => {
        if (live) setAccess(currentAccess());
      });
      return () => {
        live = false;
      };
    }, []),
  );
  return access;
}
