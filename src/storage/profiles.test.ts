import { EMPTY_STATE } from '@/features/profiles/profiles';

import { loadProfiles, saveProfiles } from './profiles';
import { storage } from './storage';

describe('profile storage', () => {
  beforeEach(() => storage.clearAll());

  it('starts empty', () => {
    expect(loadProfiles()).toEqual(EMPTY_STATE);
  });

  it('saves and loads', () => {
    const state = {
      profiles: [
        {
          id: 'a',
          nickname: 'Zeynep',
          type: 'mini' as const,
          courseId: 'tr-en' as const,
          courses: { 'tr-en': { level: null } },
          createdAt: 5,
        },
      ],
      activeId: 'a',
    };
    saveProfiles(state);
    expect(loadProfiles()).toEqual(state);
  });

  it('recovers from corrupt data', () => {
    storage.set('profiles.v1', '{not json');
    expect(loadProfiles()).toEqual(EMPTY_STATE);
  });
});
