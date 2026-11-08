import { useSyncExternalStore } from 'react';

import { createId } from '@/lib/id';

import type { ProfilesState } from './types';

type Persistence = {
  load: () => ProfilesState;
  save: (state: ProfilesState) => void;
};

/**
 * Small external store around the pure profile functions: holds the state,
 * persists every change and notifies React subscribers.
 */
export function createProfilesStore(
  persistence: Persistence,
  deps = { now: () => Date.now(), id: () => createId() },
) {
  let state = persistence.load();
  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /** Applies a pure update; saves and notifies only when it succeeded. */
    update<E>(
      fn: (
        s: ProfilesState,
        d: { id: string; now: number },
      ) => { ok: true; value: ProfilesState } | { ok: false; error: E },
    ) {
      const result = fn(state, { id: deps.id(), now: deps.now() });
      if (result.ok && result.value !== state) {
        state = result.value;
        persistence.save(state);
        listeners.forEach((l) => l());
      }
      return result;
    },
  };
}

export type ProfilesStore = ReturnType<typeof createProfilesStore>;

/** Subscribes a component to the store. */
export function useProfilesState(store: ProfilesStore): ProfilesState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
