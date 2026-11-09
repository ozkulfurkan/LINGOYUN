import type { Theme } from '@/content';

import { DIFFICULTIES, EXAM_STEP, type Difficulty } from './step';

/** Where a profile is on its path in one course. */
export type PathProgress = {
  themeIndex: number;
  /** 0 … EXAM_STEP within the current theme. */
  stepIndex: number;
  /** Missed in the last passed step: asked first in the next one. */
  lastMistakes: string[];
  difficulty: Difficulty;
  /** Steps passed in a row without losing a heart. */
  perfectRun: number;
};

/** Perfect steps in a row that make the content harder. */
export const PERFECT_STEPS_TO_HARDER = 2;

/** The first theme of a band (or the first harder one); 0 when there is none. */
export function firstThemeOfBand(themes: readonly Theme[], scale: readonly string[], band: string) {
  const want = scale.indexOf(band);
  const i = themes.findIndex((t) => scale.indexOf(t.band) >= want);
  return i < 0 ? Math.max(0, themes.length - 1) : i;
}

/** Starting point for a placed learner: the first theme of the band. */
export function startPath(
  themes: readonly Theme[],
  scale: readonly string[],
  band: string,
  difficulty: Difficulty = 1,
): PathProgress {
  return {
    themeIndex: firstThemeOfBand(themes, scale, band),
    stepIndex: 0,
    lastMistakes: [],
    difficulty,
    perfectRun: 0,
  };
}

/**
 * Difficulty from the placement test: how many of the twenty answers were
 * right. Learners who skip the test start easy.
 */
export function difficultyFromPlacement(correct: number, total: number): Difficulty {
  if (total <= 0) return 1;
  const share = correct / total;
  return share >= 0.75 ? 3 : share >= 0.4 ? 2 : 1;
}

/** After a passed step: on to the next step, or the next theme after the exam. */
export function passStep(
  p: PathProgress,
  { mistakes, perfect }: { mistakes: readonly string[]; perfect: boolean },
): PathProgress {
  const perfectRun = perfect ? p.perfectRun + 1 : 0;
  const harder = perfectRun >= PERFECT_STEPS_TO_HARDER;
  const difficulty = harder ? clampDifficulty(p.difficulty + 1) : p.difficulty;
  const examDone = p.stepIndex >= EXAM_STEP;
  return {
    // After the last theme, themeIndex equals the theme count: the path is complete.
    themeIndex: examDone ? p.themeIndex + 1 : p.themeIndex,
    stepIndex: examDone ? 0 : p.stepIndex + 1,
    lastMistakes: examDone ? [] : [...mistakes],
    difficulty,
    perfectRun: harder ? 0 : perfectRun,
  };
}

/** After losing every heart: the same step again, a little easier. */
export function failStep(p: PathProgress): PathProgress {
  return { ...p, difficulty: clampDifficulty(p.difficulty - 1), perfectRun: 0 };
}

/** The learner's own choice in settings. */
export function setDifficulty(p: PathProgress, difficulty: Difficulty): PathProgress {
  return { ...p, difficulty, perfectRun: 0 };
}

/** The whole path is finished: last theme's exam passed. */
export function isPathComplete(p: PathProgress, themeCount: number): boolean {
  return themeCount > 0 && p.themeIndex >= themeCount;
}

function clampDifficulty(n: number): Difficulty {
  return DIFFICULTIES[Math.min(Math.max(n, 1), 3) - 1];
}

/** Rebuilds progress from stored JSON; null when it is missing or malformed. */
export function parsePathProgress(data: unknown): PathProgress | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const int = (v: unknown) => Number.isInteger(v) && (v as number) >= 0;
  if (!int(d.themeIndex) || !int(d.stepIndex) || (d.stepIndex as number) > EXAM_STEP) return null;
  if (!DIFFICULTIES.includes(d.difficulty as Difficulty)) return null;
  return {
    themeIndex: d.themeIndex as number,
    stepIndex: d.stepIndex as number,
    lastMistakes: Array.isArray(d.lastMistakes)
      ? d.lastMistakes.filter((x): x is string => typeof x === 'string')
      : [],
    difficulty: d.difficulty as Difficulty,
    perfectRun: int(d.perfectRun) ? (d.perfectRun as number) : 0,
  };
}
