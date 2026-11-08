import { content } from '@/content/bundle';
import { conceptsOf, unitsFor } from '@/content';
import { seededRng } from '@/features/quiz/rng';
import { learnedCount, recordAnswer, type Deck } from '@/features/srs';

import {
  advance,
  currentPick,
  currentQuestion,
  isFinished,
  pickOption,
  planConcepts,
  ROUND_LENGTH,
  roundGrades,
  startRound,
  type Round,
} from './round';

const TODAY = 1000;
const LEVEL = unitsFor(content, 'tr-en', 'kid', 'L1')
  .flatMap((u) => conceptsOf(content, u))
  .map((c) => c.id);

const start = (deck: Deck = {}, seed = 1, levelConcepts: readonly string[] = LEVEL) =>
  startRound({
    bundle: content,
    courseId: 'tr-en',
    deck,
    today: TODAY,
    levelConcepts,
    rng: seededRng(seed),
  });

/** A deck where each concept was answered wrong `daysAgo` days ago: due today. */
function dueDeck(ids: readonly string[], daysAgo = 1): Deck {
  return ids.reduce<Deck>((deck, id) => recordAnswer(deck, id, 'again', TODAY - daysAgo), {});
}

function play(round: Round, right: boolean): Round {
  let r = round;
  while (!isFinished(r)) {
    const q = currentQuestion(r)!;
    r = advance(pickOption(r, right ? q.correctIndex : (q.correctIndex + 1) % q.options.length));
  }
  return r;
}

describe('planConcepts', () => {
  it('starts a new learner on new concepts in course order', () => {
    expect(planConcepts({}, TODAY, LEVEL).slice(0, 3)).toEqual(LEVEL.slice(0, 3));
  });

  it('puts due reviews first, then new concepts', () => {
    const deck = dueDeck(LEVEL.slice(0, 2));
    const plan = planConcepts(deck, TODAY, LEVEL);
    expect(new Set(plan.slice(0, 2))).toEqual(new Set(LEVEL.slice(0, 2)));
    expect(plan[2]).toBe(LEVEL[2]);
  });

  it('keeps room for new concepts when many reviews are due', () => {
    const deck = dueDeck(LEVEL.slice(0, 20));
    const plan = planConcepts(deck, TODAY, LEVEL).slice(0, ROUND_LENGTH);
    expect(plan.filter((id) => id in deck)).toHaveLength(5);
    expect(plan.filter((id) => !(id in deck))).toHaveLength(5);
  });

  it('skips reviews that are not due yet while new concepts remain', () => {
    const deck = recordAnswer({}, LEVEL[0], 'good', TODAY); // due tomorrow
    expect(planConcepts(deck, TODAY, LEVEL)[0]).toBe(LEVEL[1]);
  });

  it('practises the weakest concepts once the level has been seen', () => {
    const ids = LEVEL.slice(0, 3);
    let deck: Deck = {};
    deck = recordAnswer(deck, ids[0], 'good', TODAY);
    deck = recordAnswer(deck, ids[0], 'good', TODAY); // box 2
    deck = recordAnswer(deck, ids[1], 'good', TODAY); // box 1
    deck = recordAnswer(deck, ids[2], 'good', TODAY); // box 1
    deck = recordAnswer(deck, ids[2], 'again', TODAY - 1);
    expect(planConcepts(deck, TODAY, ids)[0]).toBe(ids[2]);
    expect(new Set(planConcepts(deck, TODAY, ids))).toEqual(new Set(ids));
  });

  it('never lists a concept twice', () => {
    const deck = dueDeck(LEVEL.slice(0, 8));
    const plan = planConcepts(deck, TODAY, LEVEL);
    expect(new Set(plan).size).toBe(plan.length);
  });
});

describe('startRound', () => {
  it.each([1, 2, 3])('asks ten different four-option questions (seed %i)', (seed) => {
    const { questions } = start({}, seed);
    expect(questions).toHaveLength(ROUND_LENGTH);
    expect(new Set(questions.map((q) => q.conceptId)).size).toBe(ROUND_LENGTH);
    expect(questions.every((q) => q.options.length === 4)).toBe(true);
  });

  it('asks in both directions', () => {
    const directions = new Set(start().questions.map((q) => q.direction));
    expect(directions).toEqual(new Set(['targetToNative', 'nativeToTarget']));
  });

  it('skips reviews of concepts no longer in the content', () => {
    const deck = dueDeck(['gone.word']);
    const { questions } = start(deck);
    expect(questions).toHaveLength(ROUND_LENGTH);
    expect(questions.some((q) => q.conceptId === 'gone.word')).toBe(false);
  });

  it('has no questions without content', () => {
    const round = start({}, 1, []);
    expect(round.questions).toEqual([]);
    expect(isFinished(round)).toBe(true);
    expect(currentQuestion(round)).toBeNull();
  });
});

describe('playing a round', () => {
  it('answers a question only once', () => {
    const first = pickOption(start(), 2);
    expect(currentPick(first)).toBe(2);
    expect(pickOption(first, 1)).toBe(first);
  });

  it('does not move on before an answer', () => {
    const round = start();
    expect(advance(round)).toBe(round);
  });

  it('grades right and wrong answers', () => {
    expect(roundGrades(play(start(), true))).toEqual(Array(ROUND_LENGTH).fill('good'));
    expect(roundGrades(play(start(), false))).toEqual(Array(ROUND_LENGTH).fill('again'));
  });

  it('finishes after the last question and then ignores input', () => {
    const done = play(start(), true);
    expect(isFinished(done)).toBe(true);
    expect(pickOption(done, 0)).toBe(done);
    expect(advance(done)).toBe(done);
  });
});

describe('learnedCount', () => {
  it('counts cards in box 3 or higher', () => {
    let deck: Deck = {};
    for (let i = 0; i < 3; i++) deck = recordAnswer(deck, 'a.a', 'good', TODAY);
    deck = recordAnswer(deck, 'a.b', 'good', TODAY);
    expect(learnedCount(deck)).toBe(1);
  });
});
