import { EMPTY_TRIAL, startTrial } from '@/features/subscription';

import { storage } from './storage';
import { loadTrial, saveTrial } from './trial';

describe('trial storage', () => {
  beforeEach(() => storage.clearAll());

  it('saves and loads the record', () => {
    expect(loadTrial()).toEqual(EMPTY_TRIAL);
    const record = startTrial(EMPTY_TRIAL, 1_700_000_000_000);
    saveTrial(record);
    expect(loadTrial()).toEqual(record);
  });

  it('recovers from corrupt data', () => {
    storage.set('trial.v1', '{oops');
    expect(loadTrial()).toEqual(EMPTY_TRIAL);
  });
});
