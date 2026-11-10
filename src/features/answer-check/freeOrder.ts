/** More items would give too many orders to list (5! = 120 is the most). */
export const MAX_FREE_ITEMS = 5;

/**
 * Splits `text` around `items`, which must appear in this order as whole
 * words: ["We need ", ", ", " and ", " from the market."]. Null when an item is
 * missing.
 */
export function splitAroundItems(text: string, items: readonly string[]): string[] | null {
  const gaps: string[] = [];
  let from = 0;
  for (const item of items) {
    let at = text.indexOf(item, from);
    // Whole words only: "egg" must not match inside "eggs".
    while (at >= 0 && !isWordAt(text, at, item.length)) at = text.indexOf(item, at + 1);
    if (at < 0) return null;
    gaps.push(text.slice(from, at));
    from = at + item.length;
  }
  gaps.push(text.slice(from));
  return gaps;
}

function isWordAt(text: string, at: number, length: number): boolean {
  const letter = /[\p{L}\p{N}]/u;
  return !letter.test(text[at - 1] ?? '') && !letter.test(text[at + length] ?? '');
}

function permutations<T>(list: readonly T[]): T[][] {
  if (list.length <= 1) return [[...list]];
  return list.flatMap((first, i) =>
    permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [first, ...rest]),
  );
}

/**
 * The texts plus every order of the free items in each text that contains
 * them all ("eggs, milk and bread" → "milk, bread and eggs", …). The given
 * texts keep their places first; nothing changes without items.
 */
export function withFreeOrders(
  texts: readonly string[],
  items: readonly string[] | undefined,
): string[] {
  if (!items || items.length < 2 || items.length > MAX_FREE_ITEMS) return [...texts];
  const out = new Set(texts);
  for (const text of texts) {
    const gaps = splitAroundItems(text, items);
    if (!gaps) continue;
    for (const order of permutations(items)) {
      out.add(gaps.map((gap, i) => gap + (order[i] ?? '')).join(''));
    }
  }
  return [...out];
}
