import { content } from '@/content/bundle';
import type { ContentBundle } from '@/content/types';
import { getLanguage } from '@/features/languages';
import { seededRng } from '@/features/quiz/rng';

import {
  currentLevel,
  isFinished,
  placementResult,
  SELF_ASSESSMENTS,
  TOTAL_QUESTIONS,
} from './placement';
import {
  answerSession,
  levelNumber,
  placeableLevels,
  startSession,
  type PlacedProfileType,
  type PlacementSession,
  type SessionContext,
} from './session';

const context = (profileType: PlacedProfileType, seed = 1): SessionContext => ({
  bundle: content,
  courseId: 'tr-en',
  profileType,
  rng: seededRng(seed),
});

function run(ctx: SessionContext, start: PlacementSession, right: boolean | null) {
  const asked = [];
  let session = start;
  while (session.question) {
    asked.push(session.question);
    const { correctIndex } = session.question;
    const pick = right === null ? null : right ? correctIndex : (correctIndex + 1) % 4;
    session = answerSession(ctx, session, pick);
  }
  return { session, asked };
}

function started(ctx: SessionContext, self: (typeof SELF_ASSESSMENTS)[number]) {
  const session = startSession(ctx, self);
  if (!session) throw new Error('no session');
  return session;
}

describe('placeableLevels', () => {
  it('uses only levels with enough content', () => {
    expect(placeableLevels(content, 'tr-en', 'adult')).toEqual(['A1', 'A2']);
    expect(placeableLevels(content, 'tr-en', 'kid')).toEqual(['L1', 'L2', 'L3']);
  });

  it('is empty when the course has no such content', () => {
    const empty: ContentBundle = { ...content, courses: [{ id: 'tr-en', units: [] }] };
    expect(placeableLevels(empty, 'tr-en', 'adult')).toEqual([]);
    expect(startSession({ ...context('adult'), bundle: empty }, 'mid')).toBeNull();
  });
});

describe.each(['kid', 'adult'] as const)('a %s test', (profileType) => {
  const top = profileType === 'kid' ? 'L3' : 'A2';
  const bottom = profileType === 'kid' ? 'L1' : 'A1';

  it.each([1, 2, 3, 4, 5])('asks 20 different four-option questions (seed %i)', (seed) => {
    const ctx = context(profileType, seed);
    const { session, asked } = run(ctx, started(ctx, 'mid'), true);
    expect(asked).toHaveLength(TOTAL_QUESTIONS);
    expect(new Set(asked.map((q) => q.conceptId)).size).toBe(TOTAL_QUESTIONS);
    expect(asked.every((q) => q.options.length === 4)).toBe(true);
    expect(isFinished(session.placement)).toBe(true);
  });

  it('never asks a word spelled the same in both languages', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const ctx = context(profileType, seed);
      for (const q of run(ctx, started(ctx, 'some'), true).asked) {
        const lower = getLanguage(q.answerLang).toLower;
        expect(lower(q.prompt)).not.toBe(lower(q.options[q.correctIndex].text));
      }
    }
  });

  it('places at the top when every answer is right', () => {
    const ctx = context(profileType);
    expect(placementResult(run(ctx, started(ctx, 'some'), true).session.placement)).toBe(top);
  });

  it('counts "I do not know" as wrong and places at the bottom', () => {
    const ctx = context(profileType);
    const { session, asked } = run(ctx, started(ctx, 'good'), null);
    expect(asked).toHaveLength(TOTAL_QUESTIONS);
    expect(placementResult(session.placement)).toBe(bottom);
  });

  it('places at the bottom when every answer is wrong', () => {
    const ctx = context(profileType);
    expect(placementResult(run(ctx, started(ctx, 'good'), false).session.placement)).toBe(bottom);
  });

  it('starts high for a confident learner', () => {
    expect(currentLevel(started(context(profileType), 'good').placement)).toBe(top);
  });

  it('gives the same test for the same seed', () => {
    const a = context(profileType, 7);
    const b = context(profileType, 7);
    expect(run(a, started(a, 'mid'), true).asked).toEqual(run(b, started(b, 'mid'), true).asked);
  });
});

describe('answerSession', () => {
  it('leaves a finished session alone', () => {
    const ctx = context('adult');
    const { session } = run(ctx, started(ctx, 'mid'), true);
    expect(answerSession(ctx, session, 0)).toBe(session);
  });
});

describe('levelNumber', () => {
  it('reads numbered levels only', () => {
    expect(levelNumber('L3')).toBe(3);
    expect(levelNumber('L10')).toBe(10);
    expect(levelNumber('A2')).toBeNull();
  });
});
