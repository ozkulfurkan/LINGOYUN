/**
 * Short random id for local records (profiles etc.). Not cryptographically
 * strong; only unique enough on one device.
 */
export function createId(now: number = Date.now(), random: () => number = Math.random): string {
  const time = now.toString(36);
  const rand = Math.floor(random() * 36 ** 8)
    .toString(36)
    .padStart(8, '0');
  return `${time}${rand}`;
}
