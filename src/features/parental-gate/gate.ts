import type { ProfileType } from '@/features/profiles/types';
import type { Rng } from '@/features/quiz/rng';

/**
 * A grown-up check (kids-ux skill, Apple and Google family rules): a
 * multiplication written out in words, answered with digits. Pre-readers can
 * neither read the question nor guess a fixed answer.
 */
export type Challenge = { a: number; b: number };

/** Factors stay between 3 and 9 so the product always has two digits or more. */
export const MIN_FACTOR = 3;
export const MAX_FACTOR = 9;
/** How long a passed gate stays open for the screen behind it. */
export const GATE_OPEN_MS = 60_000;

export function createChallenge(rng: Rng, previous?: Challenge): Challenge {
  const pick = () => MIN_FACTOR + Math.floor(rng() * (MAX_FACTOR - MIN_FACTOR + 1));
  let challenge = { a: pick(), b: pick() };
  // A new challenge after a wrong answer must really be new.
  while (previous && challenge.a * challenge.b === previous.a * previous.b) {
    challenge = { a: pick(), b: pick() };
  }
  return challenge;
}

export function answerOf(challenge: Challenge): number {
  return challenge.a * challenge.b;
}

/** Digits typed so far; anything else is ignored. */
export function isGateAnswer(challenge: Challenge, typed: string): boolean {
  const digits = typed.replace(/\D/g, '');
  return digits !== '' && Number(digits) === answerOf(challenge);
}

/** Keeps the typed answer short: never more digits than the answer needs. */
export function appendDigit(challenge: Challenge, typed: string, digit: string): string {
  if (!/^\d$/.test(digit)) return typed;
  const max = String(answerOf(challenge)).length;
  return typed.length >= max ? typed : typed + digit;
}

// In memory only: a passed gate is never remembered across launches.
let openedAt: number | null = null;

export function markGatePassed(now: number = Date.now()): void {
  openedAt = now;
}

/** True right after the gate was passed, so the screen behind it may open. */
export function isGateOpen(now: number = Date.now()): boolean {
  return openedAt !== null && now - openedAt >= 0 && now - openedAt < GATE_OPEN_MS;
}

export function closeGate(): void {
  openedAt = null;
}

/**
 * Settings, new profiles and purchases sit behind the gate only while a child
 * plays (2–7 or 7–12). A grown-up's own profile opens them directly (Furkan,
 * 2026-11-13). No profile yet: ask, to be safe.
 */
export function needsParentGate(profileType: ProfileType | null): boolean {
  return profileType !== 'adult';
}
