import { addProfile, EMPTY_STATE, removeProfile } from './profiles';
import { createProfilesStore } from './store';
import type { ProfilesState } from './types';

function setup(initial: ProfilesState = EMPTY_STATE) {
  const saved: ProfilesState[] = [];
  const store = createProfilesStore(
    { load: () => initial, save: (s) => saved.push(s) },
    { now: () => 1000, id: () => 'id1' },
  );
  return { store, saved };
}

describe('profiles store', () => {
  it('loads the persisted state', () => {
    const { store } = setup();
    expect(store.getState()).toBe(EMPTY_STATE);
  });

  it('applies, persists and notifies on success', () => {
    const { store, saved } = setup();
    const listener = jest.fn();
    store.subscribe(listener);

    const result = store.update((s, d) =>
      addProfile(s, { nickname: 'Kerem', type: 'kid', courseId: 'tr-en' }, d),
    );

    expect(result.ok).toBe(true);
    expect(store.getState().profiles[0]).toMatchObject({
      id: 'id1',
      nickname: 'Kerem',
      createdAt: 1000,
    });
    expect(saved).toEqual([store.getState()]);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('changes nothing on failure', () => {
    const { store, saved } = setup();
    const listener = jest.fn();
    store.subscribe(listener);

    const result = store.update((s, d) =>
      addProfile(s, { nickname: ' ', type: 'kid', courseId: 'tr-en' }, d),
    );

    expect(result).toEqual({ ok: false, error: 'nicknameEmpty' });
    expect(store.getState()).toBe(EMPTY_STATE);
    expect(saved).toEqual([]);
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const { store } = setup();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.update((s, d) =>
      addProfile(s, { nickname: 'Nehir', type: 'mini', courseId: 'tr-en' }, d),
    );
    store.update((s) => ({ ok: true, value: removeProfile(s, 'id1') }));
    expect(listener).not.toHaveBeenCalled();
  });
});
