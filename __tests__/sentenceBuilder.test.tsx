import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import SentenceBuilderScreen from '@/app/play/sentence-builder';
import { content } from '@/content/bundle';
import { splitSentence } from '@/features/games/sentence-builder';
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

const ROUTES = { index: HomeScreen, 'play/sentence-builder': SentenceBuilderScreen };

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

/** Words and ending of the English sentence for the Turkish prompt on screen. */
function answer() {
  const prompt = currentPrompt();
  const id = Object.keys(content.languages.tr.sentences).find(
    (k) => content.languages.tr.sentences[k].text === prompt,
  );
  if (!id) throw new Error(`unknown prompt ${prompt}`);
  return splitSentence(content.languages.en.sentences[id].text);
}

async function tapWord(word: string) {
  const free = screen
    .getAllByLabelText(`${word} kelimesi`)
    .find((el) => el.props.accessibilityState?.disabled !== true);
  if (!free) throw new Error(`no free block ${word}`);
  await fireEvent.press(free);
}

async function build(words: string[]) {
  for (const w of words) await tapWord(w);
}

/** The answer's words in a wrong order. */
function wrongOrder(words: string[]): string[] {
  const reversed = [...words].reverse();
  return reversed.join(' ') !== words.join(' ') ? reversed : [...words.slice(1), words[0]];
}

async function openGame() {
  await renderRouter(ROUTES, { initialUrl: '/play/sentence-builder' });
}

describe('sentence builder game', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    jest.clearAllMocks();
  });

  afterEach(() => {
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('is offered to leveled profiles, not to mini', async () => {
    seedProfile('mini');
    await renderRouter(ROUTES, { initialUrl: '/play/sentence-builder' });
    expect(screen.getByText('Yakında')).toBeTruthy();
  });

  it('checks a kid’s sentence as soon as it is complete', async () => {
    const id = seedProfile('kid', 'L1');
    await openGame();
    expect(screen.getByText('İngilizce cümleyi kur')).toBeTruthy();
    const { words, ending } = answer();

    await build(words);

    expect(screen.queryByLabelText('Kontrol et')).toBeNull();
    expect(screen.getByText('Aferin!')).toBeTruthy();
    const sentence = `${words.join(' ')}${ending}`;
    expect(screen.getByLabelText(sentence)).toBeTruthy();
    expect((Speech.speak as jest.Mock).mock.calls.at(-1)?.[0]).toBe(sentence);
    expect(Object.values(loadDeck(id, 'tr-en'))[0].box).toBe(1);
  });

  it('gives adults decoy words and a check button', async () => {
    seedProfile('adult', 'A1');
    await openGame();
    const { words } = answer();
    const blocks = screen.getAllByLabelText(/kelimesi$/);
    expect(blocks).toHaveLength(words.length + 2);

    await build(words);
    expect(screen.queryByText('Doğru')).toBeNull();
    await press('Kontrol et');
    expect(screen.getByText('Doğru')).toBeTruthy();
  });

  it('keeps the right beginning after a wrong try and offers to show the answer', async () => {
    const id = seedProfile('kid', 'L1');
    await openGame();
    const { words, ending } = answer();

    await build(wrongOrder(words));
    expect(screen.getByText('Tekrar dene!')).toBeTruthy();
    expect(Object.keys(loadDeck(id, 'tr-en'))).toHaveLength(0);

    await press('Göster');
    expect(screen.getByText(`Cevap: ${words.join(' ')}${ending}`)).toBeTruthy();
    expect(Object.values(loadDeck(id, 'tr-en'))[0].box).toBe(0);
  });

  it('takes a word back out of the sentence', async () => {
    seedProfile('adult', 'A1');
    await openGame();
    const [first] = answer().words;
    await tapWord(first);
    await press(`1. kelime: ${first}. Çıkarmak için dokun`);
    expect(screen.getByText('Kelimeleri buraya sürükle ya da dokun')).toBeTruthy();
  });

  it('gives rewards at the end of a round of six sentences', async () => {
    const id = seedProfile('kid', 'L1');
    await openGame();
    for (let i = 0; i < 6; i++) {
      await build(answer().words);
      expect(loadProgress(id).xp).toBe(0);
      await press('Devam');
    }
    expect(screen.getByText('Hatasız, Deniz!')).toBeTruthy();
    expect(screen.getByText('6 / 6 doğru')).toBeTruthy();
    expect(loadProgress(id).xp).toBeGreaterThan(0);
  });
});
