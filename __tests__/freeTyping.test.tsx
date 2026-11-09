import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import FreeTypingScreen from '@/app/play/free-typing';
import { content } from '@/content/bundle';
import {
  addProfile,
  deleteProfile,
  profilesStore,
  setCourseLevel,
  type ProfileType,
} from '@/features/profiles';
import i18n from '@/i18n';
import { loadDeck } from '@/storage/srs';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

const ROUTES = { index: HomeScreen, 'play/free-typing': FreeTypingScreen };

function seed(type: ProfileType, level: string): string {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type, courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  const id = added.value.activeId!;
  profilesStore.update((s) => setCourseLevel(s, id, level));
  return id;
}

/** The English answer for the Turkish prompt on screen. */
function expected(): string {
  const prompt = screen.getByTestId('quiz-prompt').props.children as string;
  for (const file of ['words', 'sentences'] as const) {
    const id = Object.keys(content.languages.tr[file]).find(
      (k) => content.languages.tr[file][k].text === prompt,
    );
    if (id) return content.languages.en[file][id].text;
  }
  throw new Error(`unknown prompt ${prompt}`);
}

async function answer(text: string) {
  await fireEvent.changeText(screen.getByLabelText('Cevabın'), text);
  await fireEvent.press(screen.getByLabelText('Kontrol et'));
}

async function open() {
  await renderRouter(ROUTES, { initialUrl: '/play/free-typing' });
}

describe('free typing game', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
  });

  afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

  it('is offered to adults only', async () => {
    seed('kid', 'L1');
    await renderRouter(ROUTES, { initialUrl: '/play/free-typing' });
    expect(screen.queryByLabelText('Cevabın')).toBeNull();
  });

  it('accepts the right answer whatever the case and punctuation', async () => {
    const id = seed('adult', 'A1');
    await open();
    const right = expected();
    await answer(`  ${right.toUpperCase()}  `);
    expect(screen.getByText('Doğru')).toBeTruthy();
    expect(Object.values(loadDeck(id, 'tr-en'))[0].box).toBe(1);
  });

  it('shows the right answer after a wrong one', async () => {
    seed('adult', 'A1');
    await open();
    const right = expected();
    await answer('qqqqqqqq');
    expect(screen.getByText(`Doğrusu: ${right}`)).toBeTruthy();
  });

  it('shows the answer for "I don\'t know" and grades it again', async () => {
    const id = seed('adult', 'A1');
    await open();
    const right = expected();
    await fireEvent.press(screen.getByLabelText('Bilmiyorum'));
    expect(screen.getByText(`Doğrusu: ${right}`)).toBeTruthy();
    expect(Object.values(loadDeck(id, 'tr-en'))[0].box).toBe(0);
  });

  it('gives rewards at the end of a round of eight', async () => {
    seed('adult', 'A1');
    await open();
    for (let i = 0; i < 8; i++) {
      await answer(expected());
      await fireEvent.press(screen.getByLabelText('Devam'));
    }
    expect(screen.getByText('Hatasız, Deniz!')).toBeTruthy();
    expect(screen.getByText('8 / 8 doğru')).toBeTruthy();
  });
});
