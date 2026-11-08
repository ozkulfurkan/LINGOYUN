import { content, type Concept, type ContentBundle, type Entry } from '@/content';

import { buildQuestion, generateQuiz } from './generate';
import { seededRng } from './rng';

const words: [id: string, topic: string, en: Entry, tr: Entry][] = [
  ['fruit.apple', 'fruits', { text: 'apple' }, { text: 'elma' }],
  ['fruit.pear', 'fruits', { text: 'pear' }, { text: 'armut' }],
  ['fruit.cherry', 'fruits', { text: 'cherry' }, { text: 'kiraz' }],
  ['fruit.grapes', 'fruits', { text: 'grapes' }, { text: 'üzüm' }],
  ['fruit.watermelon', 'fruits', { text: 'watermelon' }, { text: 'karpuz' }],
  ['animal.cat', 'animals', { text: 'cat' }, { text: 'kedi' }],
  ['animal.dog', 'animals', { text: 'dog' }, { text: 'köpek' }],
  // Synonyms: "reluctant" and "unwilling" are both "isteksiz".
  ['emotion.reluctant', 'emotions', { text: 'reluctant' }, { text: 'isteksiz', alt: ['gönülsüz'] }],
  ['emotion.unwilling', 'emotions', { text: 'unwilling' }, { text: 'gönülsüz' }],
  ['emotion.happy', 'emotions', { text: 'happy' }, { text: 'mutlu' }],
  // Homonym: English "orange" is both the fruit and the colour.
  ['fruit.orange', 'fruits', { text: 'orange' }, { text: 'portakal' }],
  ['color.orange', 'fruits', { text: 'orange' }, { text: 'turuncu' }],
];

function makeBundle(): ContentBundle {
  const concepts: Concept[] = words.map(([id, topic]) => ({
    id,
    topic,
    kind: 'word',
    ageGroups: ['kid'],
    image: id,
  }));
  concepts.push({ id: 'fruit.apple_red', topic: 'fruits', kind: 'sentence', ageGroups: ['kid'] });
  return {
    concepts,
    languages: {
      en: {
        words: Object.fromEntries(words.map(([id, , en]) => [id, en])),
        sentences: { 'fruit.apple_red': { text: 'The apple is red.' } },
      },
      tr: {
        words: Object.fromEntries(words.map(([id, , , tr]) => [id, tr])),
        sentences: { 'fruit.apple_red': { text: 'Elma kırmızı.' } },
      },
    },
    courses: [],
  };
}

const bundle = makeBundle();
const allIds = bundle.concepts.map((c) => c.id);

function question(
  conceptId: string,
  seed = 1,
  direction: 'targetToNative' | 'nativeToTarget' = 'targetToNative',
) {
  const q = buildQuestion({
    bundle,
    courseId: 'tr-en',
    conceptId,
    direction,
    distractorIds: allIds,
    rng: seededRng(seed),
  });
  if (!q) throw new Error('no question');
  return q;
}

describe('buildQuestion', () => {
  it('asks EN → TR with the correct answer among 4 options', () => {
    const q = question('fruit.apple');
    expect(q).toMatchObject({
      prompt: 'apple',
      promptLang: 'en',
      answerLang: 'tr',
      image: 'fruit.apple',
    });
    expect(q.options).toHaveLength(4);
    expect(q.options[q.correctIndex]).toEqual({
      conceptId: 'fruit.apple',
      text: 'elma',
      image: 'fruit.apple',
    });
  });

  it('asks TR → EN', () => {
    const q = question('fruit.apple', 1, 'nativeToTarget');
    expect(q).toMatchObject({ prompt: 'elma', promptLang: 'tr', answerLang: 'en' });
    expect(q.options[q.correctIndex].text).toBe('apple');
  });

  it('prefers wrong options from the same topic', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const q = question('fruit.apple', seed);
      expect(q.options.every((o) => o.conceptId.startsWith('fruit.'))).toBe(true);
    }
  });

  it('never mixes sentences with words', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(
        question('fruit.apple', seed).options.some((o) => o.conceptId === 'fruit.apple_red'),
      ).toBe(false);
    }
  });

  it('never offers a second correct answer (synonyms)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const q = question('emotion.reluctant', seed);
      expect(q.options.map((o) => o.text)).not.toContain('gönülsüz');
      expect(q.options.filter((o) => o.text === 'isteksiz')).toHaveLength(1);
    }
  });

  it('never offers the other meaning of a homonym', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(question('fruit.orange', seed).options.map((o) => o.text)).not.toContain('turuncu');
      // TR → EN: "portakal" asked; "orange" is the answer, the colour can't appear as a second "orange".
      const q = question('fruit.orange', seed, 'nativeToTarget');
      expect(q.options.filter((o) => o.text === 'orange')).toHaveLength(1);
    }
  });

  it('has unique options and a valid correct index', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const id of ['fruit.pear', 'animal.cat', 'emotion.happy']) {
        const q = question(id, seed);
        expect(new Set(q.options.map((o) => o.text)).size).toBe(q.options.length);
        expect(q.options[q.correctIndex].conceptId).toBe(id);
      }
    }
  });

  it('places the correct answer in different positions', () => {
    const positions = new Set(
      Array.from({ length: 40 }, (_, i) => question('fruit.apple', i + 1).correctIndex),
    );
    expect(positions.size).toBe(4);
  });

  it('is reproducible with the same seed', () => {
    expect(question('fruit.pear', 9)).toEqual(question('fruit.pear', 9));
  });

  it('returns fewer options when the pool is small, and null with none', () => {
    const two = buildQuestion({
      bundle,
      courseId: 'tr-en',
      conceptId: 'animal.cat',
      direction: 'targetToNative',
      distractorIds: ['animal.cat', 'animal.dog'],
      rng: seededRng(1),
    });
    expect(two?.options.map((o) => o.text).sort()).toEqual(['kedi', 'köpek']);
    expect(
      buildQuestion({
        bundle,
        courseId: 'tr-en',
        conceptId: 'animal.cat',
        direction: 'targetToNative',
        distractorIds: ['animal.cat'],
        rng: seededRng(1),
      }),
    ).toBeNull();
  });

  it('returns null for unknown concepts or courses', () => {
    expect(
      buildQuestion({
        bundle,
        courseId: 'tr-en',
        conceptId: 'fruit.kiwi',
        direction: 'targetToNative',
        distractorIds: allIds,
        rng: seededRng(1),
      }),
    ).toBeNull();
    expect(
      buildQuestion({
        bundle,
        courseId: 'en-tr',
        conceptId: 'fruit.apple',
        direction: 'targetToNative',
        distractorIds: allIds,
        rng: seededRng(1),
      }),
    ).toBeNull();
  });
});

describe('generateQuiz', () => {
  const fruits = allIds.filter(
    (id) => id.startsWith('fruit.') && !['fruit.apple_red', 'fruit.orange'].includes(id),
  );

  it('asks each concept once when the pool is large enough', () => {
    const quiz = generateQuiz({
      bundle,
      courseId: 'tr-en',
      conceptIds: fruits,
      count: 5,
      directions: 'targetToNative',
      rng: seededRng(3),
    });
    expect(quiz.map((q) => q.conceptId).sort()).toEqual([...fruits].sort());
  });

  it('repeats concepts for longer rounds but never twice in a row', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const quiz = generateQuiz({
        bundle,
        courseId: 'tr-en',
        conceptIds: fruits,
        count: 12,
        directions: 'mixed',
        rng: seededRng(seed),
      });
      expect(quiz).toHaveLength(12);
      quiz.slice(1).forEach((q, i) => expect(q.conceptId).not.toBe(quiz[i].conceptId));
    }
  });

  it('mixes both directions in mixed mode', () => {
    const quiz = generateQuiz({
      bundle,
      courseId: 'tr-en',
      conceptIds: fruits,
      count: 20,
      directions: 'mixed',
      rng: seededRng(5),
    });
    expect(new Set(quiz.map((q) => q.direction))).toEqual(
      new Set(['targetToNative', 'nativeToTarget']),
    );
  });

  it('is reproducible and handles empty or unusable pools', () => {
    const args = {
      bundle,
      courseId: 'tr-en' as const,
      conceptIds: fruits,
      count: 6,
      directions: 'mixed' as const,
    };
    expect(generateQuiz({ ...args, rng: seededRng(11) })).toEqual(
      generateQuiz({ ...args, rng: seededRng(11) }),
    );
    expect(generateQuiz({ ...args, conceptIds: [], rng: seededRng(1) })).toEqual([]);
    expect(
      generateQuiz({
        ...args,
        conceptIds: ['animal.cat'],
        distractorIds: ['animal.cat'],
        rng: seededRng(1),
      }),
    ).toEqual([]);
  });

  it('works on the shipped content', () => {
    const quiz = generateQuiz({
      bundle: content,
      courseId: 'tr-en',
      conceptIds: ['fruit.apple', 'fruit.pear', 'fruit.cherry', 'fruit.grapes'],
      count: 4,
      directions: 'mixed',
      rng: seededRng(1),
    });
    expect(quiz).toHaveLength(4);
    quiz.forEach((q) => expect(q.options).toHaveLength(4));
  });
});
