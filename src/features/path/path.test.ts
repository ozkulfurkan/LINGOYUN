import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { findCourse } from '@/features/languages';
import { seededRng } from '@/features/quiz/rng';
import { recordAnswer, type Deck } from '@/features/srs';

import {
  buildStep,
  difficultyFromPlacement,
  EXAM_SENTENCES,
  EXAM_STEP,
  EXAM_TYPING,
  failStep,
  HEARTS,
  isOutOfHearts,
  isPathComplete,
  isPerfect,
  isRefilled,
  isStepPassed,
  LISTEN_PER_STEP,
  missCurrent,
  nextQuestion,
  parsePathProgress,
  passStep,
  QUESTIONS_PER_STEP,
  refillAnswer,
  SENTENCES_PER_STEP,
  setDifficulty,
  startPath,
  startRefill,
  startStepSession,
  stepWords,
  themeSentences,
  TYPING_PER_STEP,
  type PathProgress,
  type StepItem,
} from '.';

const adult = pathOf(content, 'tr-en', 'adult');
const kid = pathOf(content, 'tr-en', 'kid');
const scale = findCourse('tr-en')!.levels;
const restaurant = adult.find((t) => t.title === 'restaurant')!;

const build = (overrides: Partial<Parameters<typeof buildStep>[0]> = {}) =>
  buildStep({
    bundle: content,
    courseId: 'tr-en',
    profileType: 'adult',
    theme: restaurant,
    stepIndex: 0,
    difficulty: 1,
    mistakes: [],
    rng: seededRng(1),
    ...overrides,
  });
const count = (items: StepItem[], kind: StepItem['kind']) =>
  items.filter((i) => i.kind === kind).length;

describe('learning path content', () => {
  it('orders themes from easy to hard, starting with greetings', () => {
    expect(adult[0].title).toBe('greetings');
    expect(kid[0].title).toBe('kid_greetings');
    for (const [path, levels] of [
      [adult, scale.adult],
      [kid, scale.kid],
    ] as const) {
      const bands = path.map((t) => levels.indexOf(t.band));
      expect(bands).toEqual([...bands].sort((a, b) => a - b));
    }
  });
});

describe('buildStep', () => {
  it.each([0, 1, 2, 3])(
    'step %i has 18 questions: 10 words, 3 typed, 3 listening, 2 sentences',
    (step) => {
      const items = build({ stepIndex: step });
      expect(items).toHaveLength(QUESTIONS_PER_STEP);
      expect(QUESTIONS_PER_STEP).toBe(18);
      expect(count(items, 'choice')).toBe(10);
      expect(count(items, 'typing')).toBe(TYPING_PER_STEP);
      expect(count(items, 'listen')).toBe(LISTEN_PER_STEP);
      expect(count(items, 'sentence')).toBe(SENTENCES_PER_STEP);
    },
  );

  it('types only words met earlier in the same step, in English', () => {
    const items = build({ stepIndex: 1 });
    const firstTyped = items.findIndex((i) => i.kind === 'typing');
    for (const [i, item] of items.entries()) {
      if (item.kind !== 'typing') continue;
      expect(stepWords(restaurant, 1)).toContain(item.conceptId);
      expect(
        items.slice(0, i).some((x) => x.kind === 'choice' && x.conceptId === item.conceptId),
      ).toBe(true);
      expect(item.item.answerLang).toBe('en');
    }
    expect(firstTyped).toBeGreaterThan(0);
  });

  it('spells the typed words with letter tiles for kids', () => {
    const items = build({ theme: kid[2], profileType: 'kid', stepIndex: 0 });
    expect(count(items, 'typing')).toBe(0);
    expect(count(items, 'letters')).toBeGreaterThan(0);
    expect(items).toHaveLength(QUESTIONS_PER_STEP);
  });

  it('teaches ten new words per step, in theme order', () => {
    const items = build({ stepIndex: 1 });
    const asked = items.filter((i) => i.kind === 'choice').map((i) => i.conceptId);
    expect(asked).toEqual(stepWords(restaurant, 1));
  });

  it('listens only to words of the step, asked English → Turkish', () => {
    const items = build({ stepIndex: 2 });
    const words = new Set(stepWords(restaurant, 2));
    for (const item of items.filter((i) => i.kind === 'listen')) {
      expect(words.has(item.conceptId)).toBe(true);
      if (item.kind === 'listen') expect(item.question.direction).toBe('targetToNative');
    }
  });

  it('asks the previous mistakes first, without growing the step', () => {
    const mistakes = [stepWords(restaurant, 0)[3], restaurant.sentences['1']![0]];
    const items = build({ stepIndex: 1, mistakes });
    expect(items.slice(0, 2).map((i) => i.conceptId)).toEqual(mistakes);
    expect(items).toHaveLength(QUESTIONS_PER_STEP);
    // The missed word takes a listening slot, the missed sentence a sentence slot.
    expect(count(items, 'listen')).toBe(LISTEN_PER_STEP - 1);
    expect(count(items, 'sentence')).toBe(SENTENCES_PER_STEP);
  });

  it('builds an exam from every taught word, with letter tiles and typing', () => {
    const items = build({ stepIndex: EXAM_STEP });
    expect(items).toHaveLength(QUESTIONS_PER_STEP);
    expect(count(items, 'letters')).toBeGreaterThan(0);
    expect(count(items, 'typing')).toBe(EXAM_TYPING);
    expect(count(items, 'sentence')).toBe(EXAM_SENTENCES);
    const taught = new Set(restaurant.words);
    for (const i of items.filter((x) => x.kind !== 'sentence')) {
      expect(taught.has(i.conceptId)).toBe(true);
    }
  });

  it('asks the weakest words in the exam first', () => {
    let deck: Deck = {};
    for (const id of restaurant.words) {
      for (let n = 0; n < 4; n++) deck = recordAnswer(deck, id, 'good', 1);
    }
    const weak = restaurant.words[7];
    deck = recordAnswer(deck, weak, 'again', 2);
    const asked = build({ stepIndex: EXAM_STEP, deck }).map((i) => i.conceptId);
    expect(asked).toContain(weak);
  });

  it('uses harder sentences at a higher difficulty', () => {
    const words = (items: StepItem[]) =>
      items
        .filter((i) => i.kind === 'sentence')
        .map((i) => (i.kind === 'sentence' ? i.puzzle.words.length : 0));
    const easy = Math.max(...words(build({ difficulty: 1 })));
    const hard = Math.min(...words(build({ difficulty: 3 })));
    expect(hard).toBeGreaterThan(easy);
  });

  it('falls back to an easier tier, then to other themes of the band', () => {
    const greetings = adult[0];
    expect(themeSentences(greetings, 3)).toEqual(greetings.sentences['1']);
    const empty = { ...greetings, sentences: {} };
    const extra = adult[1].sentences['1']!;
    const items = build({ theme: empty, extraSentences: extra });
    expect(count(items, 'sentence')).toBe(SENTENCES_PER_STEP);
  });

  it('works for every theme of both paths', () => {
    for (const [path, profileType] of [
      [adult, 'adult'],
      [kid, 'kid'],
    ] as const) {
      for (const theme of path) {
        const band = path.filter((t) => t.band === theme.band);
        const extra = band.flatMap((t) => t.sentences['1'] ?? []);
        for (const stepIndex of [0, EXAM_STEP]) {
          const items = build({ theme, stepIndex, profileType, extraSentences: extra });
          expect({ theme: theme.id, stepIndex, n: items.length }).toEqual({
            theme: theme.id,
            stepIndex,
            n: QUESTIONS_PER_STEP,
          });
        }
      }
    }
  });
});

describe('hearts', () => {
  it('passes a step with two mistakes', () => {
    let s = startStepSession(15);
    s = missCurrent(s, 'a');
    s = nextQuestion(s);
    s = missCurrent(s, 'b');
    for (let i = 0; i < 15; i++) s = nextQuestion(s);
    expect(s.hearts).toBe(HEARTS - 2);
    expect(isStepPassed(s)).toBe(true);
    expect(isPerfect(s)).toBe(false);
    expect(s.mistakes).toEqual(['a', 'b']);
  });

  it('stops at the third mistake', () => {
    let s = startStepSession(15);
    for (const id of ['a', 'b', 'c']) s = nextQuestion(missCurrent(s, id));
    expect(isOutOfHearts(s)).toBe(true);
    expect(isStepPassed(s)).toBe(false);
    expect(nextQuestion(s)).toBe(s);
  });

  it('charges one heart per question, even after several wrong tries', () => {
    let s = startStepSession(15);
    s = missCurrent(missCurrent(s, 'a'), 'a');
    expect(s.hearts).toBe(HEARTS - 1);
  });

  it('counts a step without mistakes as perfect', () => {
    let s = startStepSession(2);
    s = nextQuestion(nextQuestion(s));
    expect(isPerfect(s)).toBe(true);
  });
});

describe('earning hearts back', () => {
  it('gives a heart per right answer and repeats missed words', () => {
    let r = startRefill(['a', 'b', 'c']);
    r = refillAnswer(r, true);
    r = refillAnswer(r, false);
    expect(r).toEqual({ queue: ['c', 'a', 'b'], hearts: 1 });
    r = refillAnswer(refillAnswer(r, true), true);
    expect(r.hearts).toBe(HEARTS);
    expect(isRefilled(r)).toBe(true);
    expect(refillAnswer(r, true).hearts).toBe(HEARTS);
  });
});

describe('path progress', () => {
  const start: PathProgress = startPath(adult, scale.adult, 'A1');

  it('starts placed learners at the first theme of their band', () => {
    expect(start.themeIndex).toBe(0);
    const a2 = startPath(adult, scale.adult, 'A2', 2);
    expect(adult[a2.themeIndex].band).toBe('A2');
    expect(adult[a2.themeIndex - 1].band).toBe('A1');
    expect(a2.difficulty).toBe(2);
  });

  it('moves step by step, then to the next theme after the exam', () => {
    let p = passStep(start, { mistakes: ['x'], perfect: false });
    expect(p).toMatchObject({ themeIndex: 0, stepIndex: 1, lastMistakes: ['x'] });
    p = { ...p, stepIndex: EXAM_STEP };
    p = passStep(p, { mistakes: ['y'], perfect: false });
    expect(p).toMatchObject({ themeIndex: 1, stepIndex: 0, lastMistakes: [] });
  });

  it('completes the path after the last exam', () => {
    const last = { ...start, themeIndex: adult.length - 1, stepIndex: EXAM_STEP };
    expect(isPathComplete(passStep(last, { mistakes: [], perfect: true }), adult.length)).toBe(
      true,
    );
  });

  it('gets harder after two perfect steps, easier after losing all hearts', () => {
    let p = passStep(start, { mistakes: [], perfect: true });
    expect(p.difficulty).toBe(1);
    p = passStep(p, { mistakes: [], perfect: true });
    expect(p.difficulty).toBe(2);
    expect(failStep(p).difficulty).toBe(1);
    expect(failStep(failStep(p)).difficulty).toBe(1);
    let top = setDifficulty(p, 3);
    for (let i = 0; i < 4; i++) top = passStep(top, { mistakes: [], perfect: true });
    expect(top.difficulty).toBe(3);
  });

  it('resets the perfect run after a step with mistakes', () => {
    let p = passStep(start, { mistakes: [], perfect: true });
    p = passStep(p, { mistakes: ['a'], perfect: false });
    p = passStep(p, { mistakes: [], perfect: true });
    expect(p.difficulty).toBe(1);
  });

  it('maps placement scores to a difficulty', () => {
    expect(difficultyFromPlacement(18, 20)).toBe(3);
    expect(difficultyFromPlacement(10, 20)).toBe(2);
    expect(difficultyFromPlacement(3, 20)).toBe(1);
    expect(difficultyFromPlacement(0, 0)).toBe(1);
  });

  it('reads stored progress and rejects broken data', () => {
    expect(parsePathProgress(JSON.parse(JSON.stringify(start)))).toEqual(start);
    expect(parsePathProgress({ ...start, stepIndex: 9 })).toBeNull();
    expect(parsePathProgress({ ...start, difficulty: 5 })).toBeNull();
    expect(parsePathProgress('x')).toBeNull();
  });
});
