import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import MultipleChoiceScreen from '@/app/play/multiple-choice';
import { content } from '@/content/bundle';
import {
  addProfile,
  deleteProfile,
  profilesStore,
  setCourseLevel,
  type ProfileType,
} from '@/features/profiles';
import i18n from '@/i18n';
import { loadProgress } from '@/storage/progress';
import { loadDeck } from '@/storage/srs';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
}));

const ROUTES = {
  index: HomeScreen,
  'play/multiple-choice': MultipleChoiceScreen,
};

function seedProfile(type: ProfileType, level?: string): string {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type, courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  const id = added.value.activeId!;
  if (level) {
    const placed = profilesStore.update((s) => setCourseLevel(s, id, level));
    if (!placed.ok) throw new Error(placed.error);
  }
  return id;
}

async function press(label: string) {
  await fireEvent.press(screen.getByLabelText(label));
}

const currentPrompt = () => screen.getByTestId('quiz-prompt').props.children as string;

/** Every text that translates the prompt (a prompt can be a homonym). */
function translationsOf(prompt: string): string[] {
  const out: string[] = [];
  for (const [from, to] of [
    [content.languages.en, content.languages.tr],
    [content.languages.tr, content.languages.en],
  ]) {
    for (const file of ['words', 'sentences'] as const) {
      for (const [id, entry] of Object.entries(from[file])) {
        if (entry.text === prompt && to[file][id]) out.push(to[file][id].text);
      }
    }
  }
  return out;
}

const rightOption = () => {
  const label = translationsOf(currentPrompt()).find((t) => screen.queryByLabelText(t));
  if (!label) throw new Error(`no option for "${currentPrompt()}"`);
  return label;
};

async function openGame() {
  await renderRouter(ROUTES);
  await press('Oyna');
}

describe('multiple choice game', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    jest.clearAllMocks();
  });

  afterEach(() => {
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('is offered to leveled profiles, not to mini', async () => {
    seedProfile('mini');
    await renderRouter(ROUTES);
    expect(screen.queryByLabelText('Oyna')).toBeNull();
    expect(screen.getByText('Yakında')).toBeTruthy();
  });

  it('praises a right answer and waits for the learner', async () => {
    seedProfile('kid', 'L1');
    await openGame();
    expect(screen.queryByLabelText('Devam')).toBeNull();

    await press(rightOption());
    expect(screen.getByText('Aferin!')).toBeTruthy();
    expect(screen.getByLabelText('Devam')).toBeTruthy();
  });

  it('shows the right answer after a wrong one, and records it', async () => {
    const id = seedProfile('adult', 'A1');
    await openGame();
    const right = rightOption();
    const wrong = screen
      .getAllByRole('button')
      .map((b) => b.props.accessibilityLabel as string)
      .find((label) => label && !['Sesli oku', 'Oyundan çık', right].includes(label));

    await press(wrong!);

    expect(screen.getByText(`Doğrusu: ${right}`)).toBeTruthy();
    const cards = Object.values(loadDeck(id, 'tr-en'));
    expect(cards).toHaveLength(1);
    expect(cards[0].box).toBe(0);
  });

  it('takes one answer per question', async () => {
    const id = seedProfile('adult', 'A1');
    await openGame();
    const right = rightOption();
    await press(right);
    await press(right);
    expect(Object.values(loadDeck(id, 'tr-en'))[0].reviews).toBe(1);
  });

  it('gives rewards only at the end of a finished round', async () => {
    const id = seedProfile('kid', 'L1');
    await openGame();
    for (let i = 0; i < 9; i++) {
      await press(rightOption());
      await press('Devam');
    }
    expect(loadProgress(id).xp).toBe(0);
    await press(rightOption());
    await press('Devam');

    expect(screen.getByText('Hatasız, Deniz!')).toBeTruthy();
    expect(screen.getByText('10 / 10 doğru')).toBeTruthy();
    const progress = loadProgress(id);
    // 100 for answers, 5 + 10 + 20 for runs of 3, 5, 10, 20 + 10 for a perfect round.
    expect(progress.xp).toBe(165);
    expect(progress.gems).toBe(15);
    expect(progress.streak.count).toBe(1);
    expect(screen.getByText('+165 XP')).toBeTruthy();
    expect(Object.keys(loadDeck(id, 'tr-en'))).toHaveLength(10);
  });

  it('keeps practice but gives no reward when leaving mid-round', async () => {
    const id = seedProfile('kid', 'L1');
    await openGame();
    await press(rightOption());
    await press('Oyundan çık');

    expect(screen.getByLabelText('Oyna')).toBeTruthy();
    expect(Object.keys(loadDeck(id, 'tr-en'))).toHaveLength(1);
    expect(loadProgress(id).xp).toBe(0);
  });

  it('starts another round with new words from the stored deck', async () => {
    const id = seedProfile('kid', 'L1');
    await openGame();
    for (let i = 0; i < 10; i++) {
      await press(rightOption());
      await press('Devam');
    }
    const firstRound = Object.keys(loadDeck(id, 'tr-en'));

    await press('Bir tur daha');
    await press(rightOption());
    await press('Devam');

    const after = Object.keys(loadDeck(id, 'tr-en'));
    expect(after).toHaveLength(11);
    expect(after).toEqual(expect.arrayContaining(firstRound));
  });

  it('adds up gems as answers are right', async () => {
    seedProfile('kid', 'L1');
    await openGame();
    expect(screen.getByLabelText('0 taş')).toBeTruthy();
    await press(rightOption());
    expect(screen.getByLabelText('1 taş')).toBeTruthy();
  });

  it('reads questions aloud for kids only', async () => {
    seedProfile('kid', 'L1');
    await openGame();
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    expect((Speech.speak as jest.Mock).mock.calls[0][0]).toBe(currentPrompt());
  });

  it('stays silent for adults until asked', async () => {
    seedProfile('adult', 'A1');
    await openGame();
    expect(Speech.speak).not.toHaveBeenCalled();
    await press('Sesli oku');
    expect(Speech.speak).toHaveBeenCalledTimes(1);
  });
});
