import { completeSession, EMPTY_PROGRESS } from '@/features/progress';

import { loadProgress, removeProgress, saveProgress } from './progress';
import { storage } from './storage';

describe('progress storage', () => {
  beforeEach(() => storage.clearAll());

  it('saves, loads and removes per profile', () => {
    const { progress } = completeSession(EMPTY_PROGRESS, {
      grades: ['good'],
      today: 3,
      wordsLearned: 0,
    });
    saveProgress('p1', progress);
    expect(loadProgress('p1')).toEqual(progress);
    expect(loadProgress('p2')).toEqual(EMPTY_PROGRESS);
    removeProgress('p1');
    expect(loadProgress('p1')).toEqual(EMPTY_PROGRESS);
  });

  it('recovers from corrupt data', () => {
    storage.set('progress.v1.p1', 'nope{');
    expect(loadProgress('p1')).toEqual(EMPTY_PROGRESS);
  });
});
