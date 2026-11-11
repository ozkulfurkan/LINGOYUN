import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import MultipleChoiceScreen from '@/app/play/multiple-choice';
import { content } from '@/content/bundle';
import { dailyReviewConcepts } from '@/features/games/multiple-choice/round';
import { addProfile, deleteProfile, profilesStore, setCourseLevel } from '@/features/profiles';
import { localDay, recordAnswer, type Deck } from '@/features/srs';
import i18n from '@/i18n';
import { saveDeck } from '@/storage/srs';
import { startTestTrial } from '../test-support/access';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

const ROUTES = { index: HomeScreen, 'play/multiple-choice': MultipleChoiceScreen };

function seed(): string {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type: 'adult', courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  const id = added.value.activeId!;
  profilesStore.update((s) => setCourseLevel(s, id, 'A1'));
  return id;
}

const today = () => localDay(new Date());

/** Every word text in both languages: the labels of answer options. */
const WORD_TEXTS = new Set(
  (['en', 'tr'] as const).flatMap((l) =>
    Object.values(content.languages[l].words).map((e) => e.text),
  ),
);

describe('dailyReviewConcepts', () => {
  it('lists due concepts, most overdue first, and drops unknown ones', () => {
    let deck: Deck = recordAnswer({}, 'fruit.apple', 'again', 10);
    deck = recordAnswer(deck, 'fruit.pear', 'again', 5);
    deck = recordAnswer(deck, 'fruit.cherry', 'good', 10); // due on day 11
    deck = recordAnswer(deck, 'gone.word', 'again', 1);
    expect(dailyReviewConcepts(content, deck, 10)).toEqual(['fruit.pear', 'fruit.apple']);
    expect(dailyReviewConcepts(content, deck, 11)).toContain('fruit.cherry');
  });
});

describe('daily review', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    startTestTrial();
  });

  afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

  it('says when there is nothing to review', async () => {
    seed();
    await renderRouter(ROUTES);
    expect(screen.getByText('Bugün tekrar yok, harika!')).toBeTruthy();
    expect(screen.queryByLabelText('Tekrar et')).toBeNull();
  });

  it('asks only the words due today', async () => {
    const id = seed();
    // Two missed words from a higher level, one word not due yet.
    let deck: Deck = recordAnswer({}, 'false_friend.magazine', 'again', today());
    deck = recordAnswer(deck, 'false_friend.fabric', 'again', today());
    deck = recordAnswer(deck, 'fruit.apple', 'good', today());
    saveDeck(id, 'tr-en', deck);

    await renderRouter(ROUTES);
    expect(screen.getByText('Bugün 2 kelime tekrar bekliyor')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Tekrar et'));

    expect(screen.getByLabelText('Soru 1 / 2')).toBeTruthy();
    const prompts = new Set<string>();
    for (let i = 0; i < 2; i++) {
      prompts.add(screen.getByTestId('quiz-prompt').props.children as string);
      // Any option ends the question; the review only needs to run.
      const option = screen
        .getAllByRole('button')
        .find((b) => WORD_TEXTS.has(b.props.accessibilityLabel));
      await fireEvent.press(option!);
      await fireEvent.press(screen.getByLabelText('Devam'));
    }
    const asked = [...prompts].map((p) => p.toLowerCase());
    for (const p of asked) {
      expect(['magazine', 'dergi', 'fabric', 'kumaş']).toContain(p);
    }
    expect(screen.getByText(/Deniz!$/)).toBeTruthy();
  });
});
