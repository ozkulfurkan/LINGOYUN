import {
  accessState,
  canPlay,
  EMPTY_TRIAL,
  ENDING_SOON_DAYS,
  parseTrialRecord,
  resolveTrialStart,
  startTrial,
  touchTrial,
  TRIAL_DAYS,
  TRIAL_MS,
  type Entitlement,
} from './access';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T0 = Date.UTC(2026, 10, 9, 10, 0);

const active: Entitlement = { active: true, expiresAt: T0 + 30 * DAY, willRenew: true };

describe('trial', () => {
  it('has not started before the paywall', () => {
    expect(accessState({ now: T0, trialStartedAt: null, entitlement: null })).toEqual({
      kind: 'notStarted',
    });
    expect(canPlay({ kind: 'notStarted' })).toBe(false);
  });

  it('runs for 7 days with whole days left, rounded up', () => {
    const at = (ms: number) => accessState({ now: T0 + ms, trialStartedAt: T0, entitlement: null });
    expect(at(0)).toEqual({
      kind: 'trial',
      endsAt: T0 + TRIAL_MS,
      daysLeft: TRIAL_DAYS,
      endingSoon: false,
    });
    expect(at(HOUR)).toMatchObject({ daysLeft: 7 });
    expect(at(DAY)).toMatchObject({ daysLeft: 6 });
    expect(at(5 * DAY)).toMatchObject({ daysLeft: 2, endingSoon: true });
    expect(at(TRIAL_MS - 1)).toMatchObject({ kind: 'trial', daysLeft: 1, endingSoon: true });
    expect(canPlay(at(TRIAL_MS - 1))).toBe(true);
  });

  it('ends exactly 7 days after the start', () => {
    const ended = accessState({ now: T0 + TRIAL_MS, trialStartedAt: T0, entitlement: null });
    expect(ended).toEqual({ kind: 'trialEnded', endedAt: T0 + TRIAL_MS });
    expect(canPlay(ended)).toBe(false);
  });

  it(`warns from ${ENDING_SOON_DAYS} days left`, () => {
    const left = (d: number) =>
      accessState({ now: T0 + TRIAL_MS - d * DAY, trialStartedAt: T0, entitlement: null });
    expect(left(3)).toMatchObject({ daysLeft: 3, endingSoon: false });
    expect(left(2)).toMatchObject({ daysLeft: 2, endingSoon: true });
  });

  it('starts only once', () => {
    const started = startTrial(EMPTY_TRIAL, T0);
    expect(started).toEqual({ startedAt: T0, lastSeenAt: T0 });
    expect(startTrial(started, T0 + 5 * DAY)).toBe(started);
  });
});

describe('clock changes', () => {
  it('cannot win days back by moving the clock backwards', () => {
    let record = startTrial(EMPTY_TRIAL, T0);
    record = touchTrial(record, T0 + 8 * DAY); // used the app after the trial
    const rolledBack = accessState({
      now: T0 + DAY,
      trialStartedAt: record.startedAt,
      record,
      entitlement: null,
    });
    expect(rolledBack.kind).toBe('trialEnded');
  });

  it('remembers only the latest time seen', () => {
    const record = touchTrial(EMPTY_TRIAL, T0 + DAY);
    expect(touchTrial(record, T0)).toBe(record);
    expect(touchTrial(record, T0 + 2 * DAY).lastSeenAt).toBe(T0 + 2 * DAY);
  });

  it('starts the trial at the latest time seen, not an earlier clock', () => {
    const seen = touchTrial(EMPTY_TRIAL, T0 + 3 * DAY);
    expect(startTrial(seen, T0).startedAt).toBe(T0 + 3 * DAY);
  });

  it('never gives more than the full trial for a start in the future', () => {
    const early = accessState({ now: T0 - 10 * DAY, trialStartedAt: T0, entitlement: null });
    expect(early).toMatchObject({ kind: 'trial', daysLeft: TRIAL_DAYS });
  });
});

describe('subscription', () => {
  it('wins over the trial in every state', () => {
    for (const trialStartedAt of [null, T0, T0 - 30 * DAY]) {
      const access = accessState({ now: T0, trialStartedAt, entitlement: active });
      expect(access).toEqual({ kind: 'subscribed', expiresAt: active.expiresAt, willRenew: true });
      expect(canPlay(access)).toBe(true);
    }
  });

  it('falls back to the trial state once it lapses', () => {
    const lapsed = { ...active, active: false };
    expect(accessState({ now: T0 + 20 * DAY, trialStartedAt: T0, entitlement: lapsed }).kind).toBe(
      'trialEnded',
    );
  });
});

describe('platform trial source', () => {
  it('uses the App Store purchase date on iOS and the local date on Android', () => {
    expect(resolveTrialStart('ios', T0, T0 + DAY)).toBe(T0);
    expect(resolveTrialStart('ios', null, T0)).toBeNull();
    expect(resolveTrialStart('android', T0, T0 + DAY)).toBe(T0 + DAY);
  });
});

describe('parseTrialRecord', () => {
  it('round-trips and repairs bad data', () => {
    const record = startTrial(EMPTY_TRIAL, T0);
    expect(parseTrialRecord(JSON.parse(JSON.stringify(record)))).toEqual(record);
    expect(parseTrialRecord({ startedAt: 'x', lastSeenAt: -5 })).toEqual(EMPTY_TRIAL);
    expect(parseTrialRecord(null)).toEqual(EMPTY_TRIAL);
  });
});
