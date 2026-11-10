import { foldAnswer, normalizeAnswer, type LanguageDef } from '@/features/languages';

/**
 * correct  – matches an accepted answer (case, punctuation, spacing and a
 *            leading article ignored).
 * nearMiss – differs only by special letters (kisi ↔ kişi): show the right spelling.
 * typo     – one small slip (or two in long answers): show the right spelling.
 * otherWord – the answer of another concept with the same prompt ("hiç" can
 *            be "ever" or "never"): right idea, but show the one asked for.
 * wrong    – anything else.
 * Whether nearMiss/typo/otherWord earn points is a game decision, not made here.
 */
export type Verdict = 'correct' | 'nearMiss' | 'typo' | 'otherWord' | 'wrong';

export type CheckResult = {
  verdict: Verdict;
  /** The accepted answer the input was matched against (or the main one if wrong). */
  expected: string;
};

/** Edits tolerated as a typo, by answer length: short words must be exact. */
export function typoAllowance(length: number): number {
  if (length >= 9) return 2;
  if (length >= 5) return 1;
  return 0;
}

/** Edit distance counting a swap of two neighbouring letters as one edit. */
export function editDistance(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  const d: number[][] = Array.from({ length: x.length + 1 }, (_, i) =>
    Array.from({ length: y.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[x.length][y.length];
}

function stripArticle(lang: LanguageDef, normalized: string): string {
  for (const article of lang.articles) {
    const prefix = `${normalizeAnswer(lang, article)} `;
    if (normalized.startsWith(prefix)) return normalized.slice(prefix.length);
  }
  return normalized;
}

/** Comparable form: normalized, without a leading article. */
export function canonical(lang: LanguageDef, s: string): string {
  return stripArticle(lang, normalizeAnswer(lang, s));
}

/**
 * Checks a typed answer against the accepted answers (main text first, then
 * alternatives) in the answer language.
 */
export function checkAnswer(
  lang: LanguageDef,
  given: string,
  accepted: readonly string[],
  /**
   * Canonical forms of every word the content knows in this language. A typed
   * real word ("horse" for "house") is a different word, never a typo.
   */
  knownForms: ReadonlySet<string> = new Set(),
): CheckResult {
  const main = accepted[0] ?? '';
  const input = canonical(lang, given);
  if (!input || accepted.length === 0) return { verdict: 'wrong', expected: main };

  const targets = accepted.map((text) => ({ text, form: canonical(lang, text) }));

  const exact = targets.find((t) => t.form === input);
  if (exact) return { verdict: 'correct', expected: exact.text };

  const folded = foldAnswer(lang, input);
  const near = targets.find((t) => foldAnswer(lang, t.form) === folded);
  if (near) return { verdict: 'nearMiss', expected: near.text };

  if (knownForms.has(input)) return { verdict: 'wrong', expected: main };

  let best: { text: string; distance: number } | null = null;
  for (const t of targets) {
    // Compare folded forms so a missing ş does not use up the typo allowance.
    const distance = editDistance(folded, foldAnswer(lang, t.form));
    if (distance <= typoAllowance([...t.form].length) && (!best || distance < best.distance)) {
      best = { text: t.text, distance };
    }
  }
  if (best) return { verdict: 'typo', expected: best.text };

  return { verdict: 'wrong', expected: main };
}

/**
 * Like checkAnswer, but a wrong answer that another concept with the same
 * prompt accepts (`otherAnswers`) is `otherWord` instead of `wrong`.
 */
export function checkAnswerWithTwins(
  lang: LanguageDef,
  given: string,
  accepted: readonly string[],
  otherAnswers: readonly string[],
  knownForms: ReadonlySet<string> = new Set(),
): CheckResult {
  const result = checkAnswer(lang, given, accepted, knownForms);
  if (result.verdict !== 'wrong') return result;
  const input = canonical(lang, given);
  if (input && otherAnswers.some((a) => canonical(lang, a) === input)) {
    return { verdict: 'otherWord', expected: accepted[0] ?? '' };
  }
  return result;
}
