import { findCourse } from '@/features/languages';
import { seededRng, type Rng } from '@/features/quiz';

import {
  answeredCount,
  answerPlacement,
  currentLevel,
  isFinished,
  placementResult,
  startingLevelIndex,
  startPlacement,
  TOTAL_QUESTIONS,
  type PlacementState,
  type SelfAssessment,
} from './placement';

const course = findCourse('tr-en')!;
const KID = course.levels.kid; // L1 … L10
const ADULT = course.levels.adult; // A1 … C1

/** Answers a whole block: `correct` right answers, then wrong ones. */
function block(state: PlacementState, correct: number): PlacementState {
  let s = state;
  for (let i = 0; i < 4; i++) s = answerPlacement(s, i < correct);
  return s;
}

function run(scale: readonly string[], self: SelfAssessment, scores: number[]) {
  return scores.reduce(block, startPlacement(scale, self));
}

describe('starting level', () => {
  it('follows the self-assessment', () => {
    expect(
      ['none', 'some', 'mid', 'good'].map(
        (s) => ADULT[startingLevelIndex(ADULT, s as SelfAssessment)],
      ),
    ).toEqual(['A1', 'A2', 'B1', 'B2']);
    expect(KID[startingLevelIndex(KID, 'none')]).toBe('L1');
    expect(KID[startingLevelIndex(KID, 'good')]).toBe('L8');
  });

  it('rejects an empty scale', () => {
    expect(() => startPlacement([], 'none')).toThrow();
  });
});

describe('block rules', () => {
  it('moves up on 3 or 4, stays on 2, moves down on 0 or 1', () => {
    const start = startPlacement(ADULT, 'mid'); // B1
    expect(currentLevel(block(start, 4))).toBe('B2');
    expect(currentLevel(block(start, 3))).toBe('B2');
    expect(currentLevel(block(start, 2))).toBe('B1');
    expect(currentLevel(block(start, 1))).toBe('A2');
    expect(currentLevel(block(start, 0))).toBe('A2');
  });

  it('stays inside the scale', () => {
    expect(currentLevel(run(ADULT, 'none', [0, 0]))).toBe('A1');
    expect(currentLevel(run(ADULT, 'good', [4, 4, 4]))).toBe('C1');
  });

  it('only changes level after a full block', () => {
    let s = startPlacement(ADULT, 'mid');
    for (let i = 0; i < 3; i++) {
      s = answerPlacement(s, true);
      expect(currentLevel(s)).toBe('B1');
    }
  });

  it('ends after 20 answers and ignores extra ones', () => {
    let s = startPlacement(KID, 'some');
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      expect(isFinished(s)).toBe(false);
      expect(answeredCount(s)).toBe(i);
      s = answerPlacement(s, i % 2 === 0);
    }
    expect(isFinished(s)).toBe(true);
    expect(answeredCount(s)).toBe(TOTAL_QUESTIONS);
    expect(answerPlacement(s, true)).toBe(s);
  });
});

describe('result', () => {
  it('is the highest level passed with 3/4', () => {
    // B1 pass → B2 fail → B1 pass → B2 two → B2 pass
    expect(placementResult(run(ADULT, 'mid', [3, 1, 4, 2, 3]))).toBe('B2');
    // A2 pass → B1 two → B1 two → B1 one → A2 pass
    expect(placementResult(run(ADULT, 'some', [4, 2, 2, 1, 3]))).toBe('A2');
  });

  it('is the lowest level when nothing was passed', () => {
    expect(placementResult(run(ADULT, 'good', [2, 2, 1, 0, 2]))).toBe('A1');
    // "I don't know" everywhere.
    expect(placementResult(run(KID, 'none', [0, 0, 0, 0, 0]))).toBe('L1');
  });

  it('reaches the top for a perfect run', () => {
    expect(placementResult(run(ADULT, 'none', [4, 4, 4, 4, 4]))).toBe('C1');
    // From L1, five passed blocks can reach at most L5.
    expect(placementResult(run(KID, 'none', [4, 4, 4, 4, 4]))).toBe('L5');
  });
});

/**
 * Simulation: 1000 virtual learners with a known true level. A learner
 * answers questions at or below their level 90% right, one level above 40%
 * and further above 20% (guessing among 4 options, or "I don't know").
 */
function simulate(scale: readonly string[], rng: Rng) {
  const selfs: SelfAssessment[] = ['none', 'some', 'mid', 'good'];
  const errors: number[] = [];
  for (let i = 0; i < 1000; i++) {
    const trueIndex = Math.floor(rng() * scale.length);
    // Self-assessment is roughly right: the closest option, sometimes one off.
    const ideal = Math.round((trueIndex / (scale.length - 1)) * 3);
    const self =
      selfs[Math.min(3, Math.max(0, ideal + (rng() < 0.3 ? (rng() < 0.5 ? -1 : 1) : 0)))];
    let s = startPlacement(scale, self);
    while (!isFinished(s)) {
      const diff = s.levelIndex - trueIndex;
      const p = diff <= 0 ? 0.9 : diff === 1 ? 0.4 : 0.2;
      s = answerPlacement(s, rng() < p);
    }
    errors.push(scale.indexOf(placementResult(s)) - trueIndex);
  }
  const share = (f: (e: number) => boolean) => errors.filter(f).length / errors.length;
  return {
    exact: share((e) => e === 0),
    withinOne: share((e) => Math.abs(e) <= 1),
    over: share((e) => e > 1),
  };
}

describe('simulation (1000 learners)', () => {
  it.each([
    ['adult A1–C1', ADULT],
    ['kid L1–L10', KID],
  ])('%s: mostly placed within one level, rarely too high', (_name, scale) => {
    const result = simulate(scale, seededRng(2026));
    // Logged so changes to the algorithm can be compared.
    console.log(_name, JSON.stringify(result));
    expect(result.withinOne).toBeGreaterThanOrEqual(0.75);
    expect(result.over).toBeLessThanOrEqual(0.05);
  });
});
