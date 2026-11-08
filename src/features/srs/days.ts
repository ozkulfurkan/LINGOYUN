const MS_PER_DAY = 86_400_000;

/**
 * Local calendar day number (days since 1970-01-01 in the device's time zone).
 * Scheduling works in whole days so "tomorrow" starts at local midnight,
 * independent of the hour the word was reviewed.
 */
export function localDay(date: Date): number {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / MS_PER_DAY);
}
