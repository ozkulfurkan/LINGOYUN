import { levelConcepts } from '@/features/map';
import { content } from '@/content/bundle';
import { seededRng } from '@/features/quiz/rng';

import {
  answerTyping,
  buildTypingItem,
  checkTyping,
  currentItem,
  isTypingFinished,
  startTypingRound,
  TYPING_ROUND_LENGTH,
  typingGrades,
  type TypingRound,
} from './round';

const A1 = levelConcepts(content, 'tr-en', 'adult', 'A1');

function start(seed = 1) {
  return startTypingRound({
    bundle: content,
    courseId: 'tr-en',
    deck: {},
    today: 1,
    levelConcepts: A1,
    rng: seededRng(seed),
  });
}

describe('buildTypingItem', () => {
  it('asks to type the English for a Turkish prompt', () => {
    expect(buildTypingItem(content, 'tr-en', 'fruit.apple')).toEqual({
      conceptId: 'fruit.apple',
      prompt: 'elma',
      promptLang: 'tr',
      answerLang: 'en',
      accepted: ['apple'],
      otherAnswers: [],
      isSentence: false,
    });
  });

  it('accepts the answer of a concept with the same prompt as a near answer', () => {
    const item = buildTypingItem(content, 'tr-en', 'time_links.ever')!;
    expect(checkTyping(content, item, 'never').verdict).toBe('otherWord');
    expect(checkTyping(content, item, '').verdict).toBe('wrong');
  });

  it('keeps alternatives and marks sentences', () => {
    const item = buildTypingItem(content, 'tr-en', 'emotion.reluctant_leave');
    expect(item?.isSentence).toBe(true);
    expect(buildTypingItem(content, 'tr-en', 'emotion.reluctant')?.accepted).toEqual([
      'reluctant',
      'unwilling',
    ]);
    expect(buildTypingItem(content, 'tr-en', 'nope')).toBeNull();
  });
});

describe('typing round', () => {
  it(`has ${TYPING_ROUND_LENGTH} items of the level`, () => {
    const round = start();
    expect(round.items).toHaveLength(TYPING_ROUND_LENGTH);
    expect(round.items.every((i) => A1.includes(i.conceptId))).toBe(true);
  });

  it('grades right, near-miss, typo, wrong and "I don\'t know" answers', () => {
    let round: TypingRound = {
      items: [
        'fruit.apple',
        'fruit.watermelon',
        'emotion.reluctant',
        'fruit.pear',
        'fruit.cherry',
      ].map((id) => buildTypingItem(content, 'tr-en', id)!),
      results: [],
    };
    round = answerTyping(content, round, 'An Apple!');
    round = answerTyping(content, round, 'watermelom');
    round = answerTyping(content, round, 'unwilling');
    round = answerTyping(content, round, 'apple'); // a real, different word
    round = answerTyping(content, round, '   ');
    expect(round.results.map((r) => r.verdict)).toEqual([
      'correct',
      'typo',
      'correct',
      'wrong',
      'wrong',
    ]);
    expect(round.results[1].expected).toBe('watermelon');
    expect(round.results[4]).toEqual({ verdict: 'wrong', expected: 'cherry', typed: '' });
    expect(typingGrades(round)).toEqual(['good', 'hard', 'good', 'again', 'again']);
    expect(isTypingFinished(round)).toBe(true);
    expect(currentItem(round)).toBeNull();
    expect(answerTyping(content, round, 'x')).toBe(round);
  });
});
