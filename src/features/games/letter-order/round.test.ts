import { unitsFor } from '@/content';
import { content } from '@/content/bundle';
import { seededRng } from '@/features/quiz/rng';
import { recordAnswer } from '@/features/srs';

import { buildPuzzle, checkPuzzle, placeTile, revealPuzzle, type Puzzle } from './puzzle';
import {
  currentPuzzle,
  isRoundFinished,
  LETTER_ROUND_LENGTH,
  letterRoundGrades,
  nextPuzzle,
  startLetterRound,
  updateCurrent,
} from './round';

const l1 = unitsFor(content, 'tr-en', 'kid', 'L1').flatMap((u) => u.concepts);

function start(seed = 1, deck = {}) {
  return startLetterRound({
    bundle: content,
    courseId: 'tr-en',
    deck,
    today: 100,
    levelConcepts: l1,
    rng: seededRng(seed),
  });
}

function solve(p: Puzzle): Puzzle {
  let out = p;
  const used = new Set<number>();
  for (const s of p.slots) {
    if (s.kind !== 'letter') continue;
    const tile = out.tiles.find((t) => t.letter === s.letter && !used.has(t.id))!;
    used.add(tile.id);
    out = placeTile(out, tile.id);
  }
  return checkPuzzle(out).puzzle;
}

describe('letter round', () => {
  it(`has ${LETTER_ROUND_LENGTH} different words from the level`, () => {
    const round = start();
    expect(l1.length).toBeGreaterThan(0);
    expect(round.puzzles).toHaveLength(LETTER_ROUND_LENGTH);
    expect(new Set(round.puzzles.map((p) => p.conceptId)).size).toBe(LETTER_ROUND_LENGTH);
    expect(round.puzzles.every((p) => l1.includes(p.conceptId))).toBe(true);
  });

  it('starts with due reviews', () => {
    const inRound = new Set(start().puzzles.map((p) => p.conceptId));
    const due = l1.find(
      (id) =>
        !inRound.has(id) &&
        buildPuzzle({ bundle: content, courseId: 'tr-en', conceptId: id, rng: seededRng(1) }),
    );
    expect(due).toBeDefined();
    const deck = recordAnswer({}, due!, 'again', 100);
    expect(start(1, deck).puzzles.map((p) => p.conceptId)).toContain(due);
  });

  it('moves on only after the puzzle is done, and grades each puzzle', () => {
    let round = start();
    expect(nextPuzzle(round)).toBe(round);
    round = nextPuzzle(updateCurrent(round, solve(currentPuzzle(round)!)));
    round = nextPuzzle(updateCurrent(round, revealPuzzle(currentPuzzle(round)!)));
    expect(round.index).toBe(2);
    expect(letterRoundGrades(round)).toEqual(['good', 'again']);
    while (!isRoundFinished(round))
      round = nextPuzzle(updateCurrent(round, solve(currentPuzzle(round)!)));
    expect(currentPuzzle(round)).toBeNull();
    expect(letterRoundGrades(round)).toHaveLength(LETTER_ROUND_LENGTH);
    expect(updateCurrent(round, solve(round.puzzles[0]))).toBe(round);
  });

  it('is empty when the level has no fitting words', () => {
    const round = startLetterRound({
      bundle: content,
      courseId: 'tr-en',
      deck: {},
      today: 1,
      levelConcepts: ['emotion.reluctant_leave'],
      rng: seededRng(1),
    });
    expect(round.puzzles).toEqual([]);
    expect(isRoundFinished(round)).toBe(true);
  });
});
