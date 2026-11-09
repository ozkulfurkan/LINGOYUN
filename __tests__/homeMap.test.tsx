import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import LetterOrderScreen from '@/app/play/letter-order';
import { content } from '@/content/bundle';
import { levelConcepts, LEVEL_DONE_MASTERY } from '@/features/map';
import {
  addProfile,
  deleteProfile,
  profilesStore,
  setCourseLevel,
  type ProfileType,
} from '@/features/profiles';
import { completeSession, EMPTY_PROGRESS } from '@/features/progress';
import { localDay, recordAnswer, type Deck } from '@/features/srs';
import i18n from '@/i18n';
import { saveProgress } from '@/storage/progress';
import { saveDeck } from '@/storage/srs';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

function seedProfile(type: ProfileType, level?: string): string {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type, courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  const id = added.value.activeId!;
  if (level) profilesStore.update((s) => setCourseLevel(s, id, level));
  return id;
}

/** Spells the English word for the Turkish prompt on the letter game screen. */
async function spellCurrentWord() {
  const prompt = screen.getByTestId('quiz-prompt').props.children as string;
  const id = Object.keys(content.languages.tr.words).find(
    (k) => content.languages.tr.words[k].text === prompt,
  )!;
  for (const ch of content.languages.en.words[id].text.toLowerCase()) {
    if (!/\p{L}/u.test(ch)) continue;
    const free = screen
      .getAllByLabelText(`${ch} harfi`)
      .find((el) => el.props.accessibilityState?.disabled !== true)!;
    await fireEvent.press(free);
  }
}

describe('river map home', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
  });

  afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

  it('shows every kid level with its state', async () => {
    seedProfile('kid', 'L2');
    await renderRouter({ index: HomeScreen });
    expect(screen.getByLabelText('L1: tamamlandı')).toBeTruthy();
    expect(screen.getByLabelText('L2: şu anki seviye, %0 öğrenildi')).toBeTruthy();
    expect(screen.getByLabelText('L3: kilitli')).toBeTruthy();
    // Levels whose words are not written yet.
    expect(screen.getByLabelText('L10: yakında')).toBeTruthy();
    expect(screen.getByLabelText('Oyna')).toBeTruthy();
    expect(screen.getByLabelText('Harf dizme')).toBeTruthy();
    expect(screen.getByLabelText('Cümle kurma')).toBeTruthy();
  });

  it('shows adult levels A1–C1 and how much of the current one is learned', async () => {
    const id = seedProfile('adult', 'A1');
    const a1 = levelConcepts(content, 'tr-en', 'adult', 'A1');
    let deck: Deck = {};
    for (const c of a1.slice(0, Math.round(a1.length / 4))) {
      for (let i = 0; i < 3; i++) deck = recordAnswer(deck, c, 'good', i * 30);
    }
    saveDeck(id, 'tr-en', deck);
    await renderRouter({ index: HomeScreen });
    const percent = Math.round((Math.round(a1.length / 4) / a1.length) * 100);
    expect(screen.getByLabelText(`A1: şu anki seviye, %${percent} öğrenildi`)).toBeTruthy();
    expect(screen.getByLabelText('C1: yakında')).toBeTruthy();
  });

  it('shows gems and the streak', async () => {
    const id = seedProfile('kid', 'L1');
    const today = localDay(new Date());
    saveProgress(
      id,
      completeSession(EMPTY_PROGRESS, { grades: ['good'], today, wordsLearned: 0 }).progress,
    );
    await renderRouter({ index: HomeScreen });
    expect(screen.getByText('6 taş · 1 günlük seri')).toBeTruthy();
  });

  it('keeps the placeholder for mini profiles', async () => {
    seedProfile('mini');
    await renderRouter({ index: HomeScreen });
    expect(screen.getByText('Yakında')).toBeTruthy();
    expect(screen.queryByLabelText('Oyna')).toBeNull();
  });

  it('moves up a level after a round once the level is mastered', async () => {
    const id = seedProfile('kid', 'L1');
    const l1 = levelConcepts(content, 'tr-en', 'kid', 'L1');
    let deck: Deck = {};
    for (const c of l1.slice(0, Math.ceil(l1.length * LEVEL_DONE_MASTERY))) {
      for (let i = 0; i < 3; i++) deck = recordAnswer(deck, c, 'good', i * 30);
    }
    saveDeck(id, 'tr-en', deck);
    await renderRouter({ index: HomeScreen, 'play/letter-order': LetterOrderScreen });

    await fireEvent.press(screen.getByLabelText('Harf dizme'));
    for (let i = 0; i < 8; i++) {
      await spellCurrentWord();
      await fireEvent.press(screen.getByLabelText('Devam'));
    }
    expect(screen.getByText('Yeni seviye açıldı: L2!')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Bitir'));
    expect(screen.getByLabelText('L1: tamamlandı')).toBeTruthy();
    expect(screen.getByLabelText('L2: şu anki seviye, %0 öğrenildi')).toBeTruthy();
  });
});
