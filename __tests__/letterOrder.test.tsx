import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import LetterOrderScreen from '@/app/play/letter-order';
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

const ROUTES = { index: HomeScreen, 'play/letter-order': LetterOrderScreen };

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

/** The English word for the Turkish prompt on screen, lower-cased like the tiles. */
function answer(): string {
  const prompt = currentPrompt();
  const id = Object.keys(content.languages.tr.words).find(
    (k) => content.languages.tr.words[k].text === prompt,
  );
  if (!id) throw new Error(`unknown prompt ${prompt}`);
  return content.languages.en.words[id].text.toLowerCase();
}

/** Presses a free tile with this letter. */
async function tap(letter: string) {
  const free = screen
    .getAllByLabelText(`${letter} harfi`)
    .find((el) => el.props.accessibilityState?.disabled !== true);
  if (!free) throw new Error(`no free tile ${letter}`);
  await fireEvent.press(free);
}

async function spell(word: string) {
  for (const ch of word) if (/\p{L}/u.test(ch)) await tap(ch);
}

/** A wrong order of the answer's letters (reversed, or rotated for palindromes). */
function wrongOrder(word: string): string {
  const letters = [...word].filter((c) => /\p{L}/u.test(c));
  const reversed = [...letters].reverse().join('');
  return reversed !== letters.join('') ? reversed : [...letters.slice(1), letters[0]].join('');
}

async function openGame() {
  await renderRouter(ROUTES, { initialUrl: '/play/letter-order' });
}

describe('letter order game', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    jest.clearAllMocks();
  });

  afterEach(() => {
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('is offered to leveled profiles, not to mini', async () => {
    seedProfile('mini');
    await renderRouter(ROUTES, { initialUrl: '/play/letter-order' });
    expect(screen.getByText('Yakında')).toBeTruthy();
  });

  it('solves a word spelled in order and praises it', async () => {
    const id = seedProfile('kid', 'L1');
    await openGame();
    expect(screen.getByText('İngilizcesini harflerle diz')).toBeTruthy();
    const word = answer();

    await spell(word);

    expect(screen.getByText('Aferin!')).toBeTruthy();
    expect(screen.getByLabelText(word)).toBeTruthy();
    // The English word is read out once solved.
    expect((Speech.speak as jest.Mock).mock.calls.at(-1)?.[0]).toBe(word);
    const cards = Object.values(loadDeck(id, 'tr-en'));
    expect(cards).toHaveLength(1);
    expect(cards[0].box).toBe(1);
    expect(screen.getByLabelText('1 taş')).toBeTruthy();
  });

  it('asks to try again after a wrong order and then offers to show the answer', async () => {
    const id = seedProfile('adult', 'A1');
    await openGame();
    const word = answer();
    expect(screen.queryByLabelText('Göster')).toBeNull();

    await spell(wrongOrder(word));
    expect(screen.getByText('Tekrar dene!')).toBeTruthy();
    expect(Object.keys(loadDeck(id, 'tr-en'))).toHaveLength(0);

    await press('Göster');
    expect(screen.getByText(`Cevap: ${word}`)).toBeTruthy();
    const [card] = Object.values(loadDeck(id, 'tr-en'));
    expect(card.box).toBe(0);
  });

  it('takes a letter back out of its box', async () => {
    seedProfile('kid', 'L1');
    await openGame();
    const first = [...answer()].find((c) => /\p{L}/u.test(c))!;
    await tap(first);
    expect(screen.getByLabelText(`1. kutu: ${first}`)).toBeTruthy();
    await press(`1. kutu: ${first}`);
    expect(screen.getByLabelText('1. kutu boş')).toBeTruthy();
  });

  it('gives rewards at the end of a round of eight words', async () => {
    const id = seedProfile('kid', 'L1');
    await openGame();
    for (let i = 0; i < 8; i++) {
      await spell(answer());
      expect(loadProgress(id).xp).toBe(0);
      await press('Devam');
    }
    expect(screen.getByText('Hatasız, Deniz!')).toBeTruthy();
    expect(screen.getByText('8 / 8 doğru')).toBeTruthy();
    expect(loadProgress(id).xp).toBeGreaterThan(0);
    expect(Object.keys(loadDeck(id, 'tr-en'))).toHaveLength(8);
  });

  it('reads the prompt aloud for kids only', async () => {
    seedProfile('kid', 'L1');
    await openGame();
    expect((Speech.speak as jest.Mock).mock.calls[0][0]).toBe(currentPrompt());
  });

  it('stays silent for adults until asked', async () => {
    seedProfile('adult', 'A1');
    await openGame();
    expect(Speech.speak).not.toHaveBeenCalled();
  });
});
