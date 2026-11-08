import {
  BOX_INTERVAL_DAYS,
  dueCards,
  gradeFromVerdict,
  LAST_BOX,
  masteryOf,
  newCard,
  parseDeck,
  practiceQueue,
  recordAnswer,
  reviewCard,
  type Deck,
} from './srs';

const DAY = 20_000;

describe('gradeFromVerdict', () => {
  it('maps answer verdicts to grades', () => {
    expect(gradeFromVerdict('correct')).toBe('good');
    expect(gradeFromVerdict('nearMiss')).toBe('hard');
    expect(gradeFromVerdict('typo')).toBe('hard');
    expect(gradeFromVerdict('wrong')).toBe('again');
  });
});

describe('reviewCard', () => {
  it('climbs one box per correct answer with growing intervals', () => {
    let card = newCard('fruit.apple', DAY);
    let day = DAY;
    const intervals: number[] = [];
    for (let i = 0; i < 6; i++) {
      card = reviewCard(card, 'good', day);
      intervals.push(card.dueDay - day);
      day = card.dueDay;
    }
    expect(intervals).toEqual([1, 3, 7, 14, 14, 14]);
    expect(card.box).toBe(LAST_BOX);
    expect(card.reviews).toBe(6);
  });

  it('keeps the box on a hard answer', () => {
    const card = { ...newCard('a', DAY), box: 2 };
    const next = reviewCard(card, 'hard', DAY + 5);
    expect(next.box).toBe(2);
    expect(next.dueDay).toBe(DAY + 5 + BOX_INTERVAL_DAYS[2]);
  });

  it('drops to box 0, due today, on a wrong answer and counts a lapse', () => {
    const card = { ...newCard('a', DAY), box: 3 };
    const next = reviewCard(card, 'again', DAY + 9);
    expect(next).toMatchObject({ box: 0, dueDay: DAY + 9, lastDay: DAY + 9, lapses: 1 });
    // Missing a brand-new word is not a lapse.
    expect(reviewCard(newCard('b', DAY), 'again', DAY).lapses).toBe(0);
  });

  it('does not mutate the input', () => {
    const card = newCard('a', DAY);
    reviewCard(card, 'good', DAY);
    expect(card).toEqual(newCard('a', DAY));
  });
});

describe('deck', () => {
  it('creates a card on first answer', () => {
    const deck = recordAnswer({}, 'fruit.apple', 'good', DAY);
    expect(deck['fruit.apple']).toMatchObject({ box: 1, dueDay: DAY + 1, reviews: 1 });
  });

  it('lists due cards, most overdue then lowest box first', () => {
    const deck: Deck = {
      a: { ...newCard('a', DAY), box: 2, dueDay: DAY - 1 },
      b: { ...newCard('b', DAY), box: 0, dueDay: DAY },
      c: { ...newCard('c', DAY), box: 1, dueDay: DAY - 3 },
      d: { ...newCard('d', DAY), box: 3, dueDay: DAY + 2 },
      e: { ...newCard('e', DAY), box: 1, dueDay: DAY },
    };
    expect(dueCards(deck, DAY).map((c) => c.conceptId)).toEqual(['c', 'a', 'b', 'e']);
    expect(dueCards(deck, DAY + 2).map((c) => c.conceptId)).toContain('d');
  });

  it("builds today's queue: due reviews, then new concepts in course order", () => {
    const deck: Deck = {
      a: { ...newCard('a', DAY), dueDay: DAY - 1 },
      b: { ...newCard('b', DAY), box: 2, dueDay: DAY + 3 },
    };
    const queue = practiceQueue(deck, DAY, {
      candidates: ['a', 'b', 'c', 'd', 'e'],
      maxReviews: 10,
      maxNew: 2,
    });
    expect(queue).toEqual(['a', 'c', 'd']);
    expect(practiceQueue({}, DAY, { candidates: ['x'], maxReviews: 5, maxNew: 0 })).toEqual([]);
  });

  it('measures mastery of a unit', () => {
    const deck: Deck = {
      a: { ...newCard('a', DAY), box: 3 },
      b: { ...newCard('b', DAY), box: 4 },
      c: newCard('c', DAY),
    };
    expect(masteryOf(deck, ['a', 'b', 'c', 'd'])).toBe(0.5);
    expect(masteryOf(deck, [])).toBe(0);
  });
});

describe('parseDeck', () => {
  it('round-trips and drops malformed cards', () => {
    const good = newCard('a', DAY);
    const data = JSON.parse(
      JSON.stringify({
        a: good,
        b: { ...newCard('b', DAY), box: 9 },
        c: { ...newCard('x', DAY) },
        d: 'nope',
      }),
    );
    expect(parseDeck(data)).toEqual({ a: good });
    expect(parseDeck(null)).toEqual({});
    expect(parseDeck([1])).toEqual({});
  });
});
