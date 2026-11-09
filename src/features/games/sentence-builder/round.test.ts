import { content } from '@/content/bundle';
import { seededRng } from '@/features/quiz/rng';

import { levelSentences, revealSentence } from './puzzle';
import {
  currentSentence,
  isSentenceRoundFinished,
  nextSentence,
  SENTENCE_ROUND_LENGTH,
  sentenceRoundGrades,
  startSentenceRound,
  updateSentence,
} from './round';

function start(profileType: 'kid' | 'adult', level: string) {
  return startSentenceRound({
    bundle: content,
    courseId: 'tr-en',
    deck: {},
    today: 1,
    sentences: levelSentences(content, 'tr-en', profileType, level),
    profileType,
    rng: seededRng(4),
  });
}

describe('sentence round', () => {
  it.each([
    ['kid', 'L1', 0],
    ['adult', 'A1', 2],
  ] as const)('%s %s: %i decoys per sentence', (type, level, decoys) => {
    const round = start(type, level);
    expect(round.puzzles).toHaveLength(SENTENCE_ROUND_LENGTH);
    for (const p of round.puzzles) expect(p.blocks.length - p.words.length).toBe(decoys);
  });

  it('moves on only after a sentence is done', () => {
    let round = start('kid', 'L1');
    expect(nextSentence(round)).toBe(round);
    while (!isSentenceRoundFinished(round)) {
      round = nextSentence(updateSentence(round, revealSentence(currentSentence(round)!)));
    }
    expect(sentenceRoundGrades(round)).toEqual(Array(SENTENCE_ROUND_LENGTH).fill('again'));
    expect(currentSentence(round)).toBeNull();
  });

  it('is empty without sentences', () => {
    const round = startSentenceRound({
      bundle: content,
      courseId: 'tr-en',
      deck: {},
      today: 1,
      sentences: [],
      profileType: 'kid',
      rng: seededRng(1),
    });
    expect(isSentenceRoundFinished(round)).toBe(true);
  });
});
