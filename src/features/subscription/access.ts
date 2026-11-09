/** Free trial length (CLAUDE.md: 7 days, no card). */
export const TRIAL_DAYS = 7;
const DAY_MS = 86_400_000;
export const TRIAL_MS = TRIAL_DAYS * DAY_MS;
/** From this many days left, the app reminds the family the trial is ending. */
export const ENDING_SOON_DAYS = 2;
/** RevenueCat entitlement that unlocks the app for the whole family. */
export const ENTITLEMENT_ID = 'family';

/** The family subscription as RevenueCat reports it (entitlement "family"). */
export type Entitlement = {
  active: boolean;
  /** Epoch ms; null for lifetime or unknown. */
  expiresAt: number | null;
  willRenew: boolean;
};

/** Device-wide trial record (Android keeps it locally; see resolveTrialStart). */
export type TrialRecord = {
  startedAt: number | null;
  /**
   * Latest time the app has seen. Time never runs backwards for the trial, so
   * moving the phone's clock back does not buy extra days.
   */
  lastSeenAt: number | null;
};

export const EMPTY_TRIAL: TrialRecord = { startedAt: null, lastSeenAt: null };

export type Access =
  | { kind: 'subscribed'; expiresAt: number | null; willRenew: boolean }
  | { kind: 'trial'; endsAt: number; daysLeft: number; endingSoon: boolean }
  | { kind: 'trialEnded'; endedAt: number }
  | { kind: 'notStarted' };

/** Wall-clock time as the trial sees it: never earlier than anything seen before. */
export function effectiveNow(now: number, record: TrialRecord): number {
  return Math.max(now, record.lastSeenAt ?? now);
}

/** Records that the app ran at `now` (call on every launch and foreground). */
export function touchTrial(record: TrialRecord, now: number): TrialRecord {
  const lastSeenAt = effectiveNow(now, record);
  return lastSeenAt === record.lastSeenAt ? record : { ...record, lastSeenAt };
}

/** Starts the trial once; a second call keeps the first start. */
export function startTrial(record: TrialRecord, now: number): TrialRecord {
  if (record.startedAt !== null) return record;
  const at = effectiveNow(now, record);
  return { startedAt: at, lastSeenAt: at };
}

/**
 * Where the trial start comes from differs per platform:
 * - iOS: the purchase date of the free "7-day trial" non-consumable (App Review
 *   3.1.1). It belongs to the Apple ID, so reinstalling cannot restart it.
 * - Android: Google Play has no free products, so the app keeps the date
 *   itself; reinstalling can reset it (accepted, CLAUDE.md).
 */
export function resolveTrialStart(
  platform: 'ios' | 'android',
  storePurchaseAt: number | null,
  localStartedAt: number | null,
): number | null {
  return platform === 'ios' ? storePurchaseAt : localStartedAt;
}

/** What the family may use right now. A live subscription always wins. */
export function accessState({
  now,
  trialStartedAt,
  record = EMPTY_TRIAL,
  entitlement,
}: {
  now: number;
  trialStartedAt: number | null;
  record?: TrialRecord;
  entitlement: Entitlement | null;
}): Access {
  if (entitlement?.active) {
    return {
      kind: 'subscribed',
      expiresAt: entitlement.expiresAt,
      willRenew: entitlement.willRenew,
    };
  }
  if (trialStartedAt === null) return { kind: 'notStarted' };

  const endsAt = trialStartedAt + TRIAL_MS;
  const at = effectiveNow(now, record);
  if (at >= endsAt) return { kind: 'trialEnded', endedAt: endsAt };

  // A start in the "future" (clock moved back before the record existed)
  // never gives more than the full trial.
  const remaining = Math.min(endsAt - at, TRIAL_MS);
  const daysLeft = Math.ceil(remaining / DAY_MS);
  return { kind: 'trial', endsAt, daysLeft, endingSoon: daysLeft <= ENDING_SOON_DAYS };
}

/** Games are open during the trial and with a subscription. */
export function canPlay(access: Access): boolean {
  return access.kind === 'subscribed' || access.kind === 'trial';
}

/**
 * Rebuilds the trial record from storage. Anything malformed is treated as
 * "never started" only if there was no valid start; a valid start is kept.
 */
export function parseTrialRecord(data: unknown): TrialRecord {
  if (typeof data !== 'object' || data === null) return EMPTY_TRIAL;
  const d = data as Record<string, unknown>;
  const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
  return { startedAt: time(d.startedAt), lastSeenAt: time(d.lastSeenAt) };
}
