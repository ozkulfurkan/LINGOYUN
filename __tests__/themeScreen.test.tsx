import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import StepScreen from '@/app/play/step';
import { content } from '@/content/bundle';
import {
  addProfile,
  deleteProfile,
  profilesStore,
  setCourseLevel,
  type Profile,
  type ProfileType,
} from '@/features/profiles';
import i18n from '@/i18n';
import { loadPath } from '@/storage/path';
import { loadProgress } from '@/storage/progress';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

const ROUTES = { index: HomeScreen, 'play/step': StepScreen };
const speakMock = Speech.speak as jest.Mock;

function seedProfile(type: ProfileType, level: string): Profile {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type, courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  const id = added.value.activeId!;
  profilesStore.update((s) => setCourseLevel(s, id, level));
  return profilesStore.getState().profiles.find((p) => p.id === id)!;
}

async function press(label: string | RegExp) {
  await fireEvent.press(screen.getByLabelText(label));
}

/** The prompt on screen, or for a listening question the word last spoken. */
function currentPrompt(): string {
  const shown = screen.queryByTestId('quiz-prompt');
  if (shown) return shown.props.children as string;
  return speakMock.mock.calls.at(-1)![0] as string;
}

/** Every text translating the prompt (it may be a homonym). */
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

const isSentence = () => screen.queryByTestId('sentence-answer') !== null;
const isTyping = () => screen.queryByLabelText('Cevabın') !== null;
const isLetters = () => screen.queryByTestId('letter-slots') !== null;

/** The English text for the Turkish prompt of a typing question. */
function englishFor(prompt: string): string {
  const id = Object.keys(content.languages.tr.words).find(
    (k) => content.languages.tr.words[k].text === prompt,
  )!;
  return content.languages.en.words[id].text;
}

async function answerRight() {
  if (isLetters()) {
    for (const ch of englishFor(currentPrompt()).toLowerCase()) {
      if (!/\p{L}/u.test(ch)) continue;
      const free = screen
        .getAllByLabelText(`${ch} harfi`)
        .find((el) => el.props.accessibilityState?.disabled !== true)!;
      await fireEvent.press(free);
    }
    return;
  }
  if (isTyping()) {
    await fireEvent.changeText(screen.getByLabelText('Cevabın'), englishFor(currentPrompt()));
    await press('Kontrol et');
    return;
  }
  if (isSentence()) {
    const prompt = currentPrompt();
    const id = Object.keys(content.languages.tr.sentences).find(
      (k) => content.languages.tr.sentences[k].text === prompt,
    )!;
    const words = content.languages.en.sentences[id].text.replace(/[.!?…]+$/u, '').split(/\s+/);
    for (const word of words) {
      const free = screen
        .getAllByLabelText(`${word} kelimesi`)
        .find((el) => el.props.accessibilityState?.disabled !== true)!;
      await fireEvent.press(free);
    }
    // Adults check the sentence themselves; kids' sentences are checked when full.
    if (screen.queryByLabelText('Kontrol et')) await press('Kontrol et');
    return;
  }
  const label = translationsOf(currentPrompt()).find((t) => screen.queryByLabelText(t));
  if (!label) throw new Error(`no option for "${currentPrompt()}"`);
  await press(label);
}

/** A wrong answer: "I don't know" when typing, otherwise a wrong option. */
async function answerWrong() {
  if (isTyping()) {
    await press('Bilmiyorum');
    return;
  }
  const right = new Set(translationsOf(currentPrompt()));
  const option = screen
    .getAllByRole('button')
    .map((b) => b.props.accessibilityLabel as string | undefined)
    .find(
      (label) =>
        label && !right.has(label) && !['Sesli oku', 'Yavaş dinle', 'Oyundan çık'].includes(label),
    );
  await press(option!);
}

/** Moves past sentence and letter questions so a wrong pick is always possible. */
async function skipToChoice() {
  while (isSentence() || isLetters()) {
    await answerRight();
    await press('Devam');
  }
}

describe('theme step', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    jest.clearAllMocks();
  });

  afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

  it('passes a step after eighteen questions and moves to the next one', async () => {
    const profile = seedProfile('kid', 'L1');
    await renderRouter(ROUTES, { initialUrl: '/play/step?theme=0&step=0' });
    for (let i = 0; i < 18; i++) {
      await answerRight();
      await press('Devam');
    }
    expect(screen.getByText('Geçtin, Deniz!')).toBeTruthy();
    expect(screen.getByText('0 hata')).toBeTruthy();
    expect(loadPath(profile)).toMatchObject({ themeIndex: 0, stepIndex: 1 });
    expect(loadProgress(profile.id).xp).toBeGreaterThan(0);
  });

  it('plays listening questions without showing the word', async () => {
    seedProfile('adult', 'A1');
    await renderRouter(ROUTES, { initialUrl: '/play/step?theme=0&step=0' });
    let listened = 0;
    for (let i = 0; i < 18; i++) {
      if (screen.queryByText('Dinle ve anlamını seç')) {
        listened++;
        expect(screen.queryByTestId('quiz-prompt')).toBeNull();
        await press('Yavaş dinle');
        expect(speakMock.mock.calls.at(-1)![1]).toMatchObject({ rate: 0.5 });
      }
      await answerRight();
      await press('Devam');
    }
    expect(listened).toBe(3);
  });

  it('loses a life per mistake and stops at the third', async () => {
    const profile = seedProfile('adult', 'A1');
    await renderRouter(ROUTES, { initialUrl: '/play/step?theme=0&step=0' });
    for (const left of [2, 1]) {
      await skipToChoice();
      await answerWrong();
      expect(screen.getByLabelText(`${left} can kaldı`)).toBeTruthy();
      await press('Devam');
    }
    await skipToChoice();
    await answerWrong();
    await press('Devam');
    expect(screen.getByText('Canların bitti')).toBeTruthy();
    expect(loadPath(profile).stepIndex).toBe(0);
  });

  it('earns lives back with the missed words, then starts the step again', async () => {
    seedProfile('adult', 'A1');
    await renderRouter(ROUTES, { initialUrl: '/play/step?theme=0&step=0' });
    for (let i = 0; i < 3; i++) {
      await skipToChoice();
      await answerWrong();
      await press('Devam');
    }
    await press('Hatalarını tekrar et');
    expect(screen.getByText('Can kazan')).toBeTruthy();
    expect(screen.getByLabelText('0 can kaldı')).toBeTruthy();
    for (let i = 0; i < 3; i++) {
      await answerRight();
      await press('Devam');
    }
    expect(screen.getByLabelText('3 can kaldı')).toBeTruthy();
    expect(screen.getByLabelText('Soru 1 / 18')).toBeTruthy();
  });
});
