import { canPlay, type Access } from '@/features/subscription';

/**
 * Ages 2–7 see the paywall after their first game (CLAUDE.md): the first
 * session is free; after that the family needs the trial or a subscription.
 */
export function miniCanStart(access: Access, sessionsPlayed: number): boolean {
  return canPlay(access) || sessionsPlayed === 0;
}
