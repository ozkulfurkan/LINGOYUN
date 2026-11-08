import { unitsFor, type ContentBundle } from '@/content';
import { findCourse, getLanguage, type CourseId } from '@/features/languages';
import type { ProfileType } from '@/features/profiles/types';
import { buildQuestion } from '@/features/quiz/generate';
import { shuffle, type Rng } from '@/features/quiz/rng';
import type { Question } from '@/features/quiz/types';

import {
  answerPlacement,
  currentLevel,
  isFinished,
  startPlacement,
  TOTAL_QUESTIONS,
  type PlacementState,
  type SelfAssessment,
} from './placement';
import { placementPool } from './pool';

export type PlacedProfileType = Exclude<ProfileType, 'mini'>;

/**
 * A level needs this many concepts to be tested: the whole test may stay on one
 * level, and no concept is asked twice.
 */
export const MIN_LEVEL_CONCEPTS = TOTAL_QUESTIONS;

/**
 * Levels with enough content to test, lowest first. The test only uses these,
 * because asking about an empty level with easier words would place learners
 * too high. The scale grows on its own as content is added.
 */
export function placeableLevels(
  bundle: ContentBundle,
  courseId: CourseId,
  profileType: PlacedProfileType,
): string[] {
  const levels = findCourse(courseId)?.levels[profileType] ?? [];
  return levels.filter((level) => {
    const concepts = unitsFor(bundle, courseId, profileType, level).flatMap((u) => u.concepts);
    return new Set(concepts).size >= MIN_LEVEL_CONCEPTS;
  });
}

export type SessionContext = {
  bundle: ContentBundle;
  courseId: CourseId;
  profileType: PlacedProfileType;
  rng: Rng;
};

export type PlacementSession = {
  placement: PlacementState;
  /** Concepts asked so far. */
  asked: readonly string[];
  /** Next question; null when the test is over. */
  question: Question | null;
};

/** Starts the test, or returns null when no level has enough content. */
export function startSession(ctx: SessionContext, self: SelfAssessment): PlacementSession | null {
  const scale = placeableLevels(ctx.bundle, ctx.courseId, ctx.profileType);
  if (scale.length === 0) return null;
  const placement = startPlacement(scale, self);
  const question = nextQuestion(ctx, placement, []);
  return { placement, asked: question ? [question.conceptId] : [], question };
}

/**
 * Records an answer and moves on. `optionIndex` is null for "I don't know",
 * which counts as wrong.
 */
export function answerSession(
  ctx: SessionContext,
  session: PlacementSession,
  optionIndex: number | null,
): PlacementSession {
  if (!session.question) return session;
  const placement = answerPlacement(
    session.placement,
    optionIndex === session.question.correctIndex,
  );
  const question = nextQuestion(ctx, placement, session.asked);
  return {
    placement,
    asked: question ? [...session.asked, question.conceptId] : session.asked,
    question,
  };
}

/** The number in a numbered level: "L3" → 3. Null for levels such as "A2". */
export function levelNumber(level: string): number | null {
  const match = /^L(\d+)$/.exec(level);
  return match ? Number(match[1]) : null;
}

function nextQuestion(
  ctx: SessionContext,
  placement: PlacementState,
  asked: readonly string[],
): Question | null {
  if (isFinished(placement)) return null;
  const pool = placementPool(
    ctx.bundle,
    ctx.courseId,
    ctx.profileType,
    placement.scale,
    currentLevel(placement),
  );
  const unasked = pool.filter((id) => !asked.includes(id));
  for (const conceptId of shuffle(unasked, ctx.rng)) {
    const question = buildQuestion({
      bundle: ctx.bundle,
      courseId: ctx.courseId,
      conceptId,
      direction: ctx.rng() < 0.5 ? 'targetToNative' : 'nativeToTarget',
      distractorIds: pool,
      rng: ctx.rng,
    });
    if (question && !givesAnswerAway(question)) return question;
  }
  return null;
}

/** "film" → "film": a word spelled the same in both languages measures nothing. */
function givesAnswerAway(question: Question): boolean {
  const lower = getLanguage(question.answerLang).toLower;
  return lower(question.prompt) === lower(question.options[question.correctIndex].text);
}
