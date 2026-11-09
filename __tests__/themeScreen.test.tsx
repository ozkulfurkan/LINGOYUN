import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import MultipleChoiceScreen from '@/app/play/multiple-choice';
import SentenceBuilderScreen from '@/app/play/sentence-builder';
import ThemeScreen from '@/app/play/theme';
import { themeConcepts } from '@/content';
import { content } from '@/content/bundle';
import {
  addProfile,
  deleteProfile,
  profilesStore,
  setCourseLevel,
  type ProfileType,
} from '@/features/profiles';
import i18n from '@/i18n';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
}));

const ROUTES = {
  index: HomeScreen,
  'play/theme': ThemeScreen,
  'play/multiple-choice': MultipleChoiceScreen,
  'play/sentence-builder': SentenceBuilderScreen,
};

function seedProfile(type: ProfileType, level: string) {
  const added = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type, courseId: 'tr-en' }, d),
  );
  if (!added.ok) throw new Error(added.error);
  const placed = profilesStore.update((s) => setCourseLevel(s, added.value.activeId!, level));
  if (!placed.ok) throw new Error(placed.error);
}

async function press(label: string) {
  await fireEvent.press(screen.getByLabelText(label));
}

const textsOf = (ids: readonly string[], lang: 'en' | 'tr', file: 'words' | 'sentences') =>
  ids.map((id) => content.languages[lang][file][id].text);

describe('restaurant theme screen', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
  });

  afterEach(() => {
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('is offered to adults, not to kids', async () => {
    seedProfile('kid', 'L1');
    await renderRouter(ROUTES);
    expect(screen.queryByLabelText('Durum: Restoranda')).toBeNull();
  });

  it('lists every difficulty', async () => {
    seedProfile('adult', 'A1');
    await renderRouter(ROUTES);
    await press('Durum: Restoranda');
    expect(screen.getByText('Restoranda')).toBeTruthy();
    for (const tier of ['A1', 'A2', 'B1', 'B2', 'C1']) {
      expect(screen.getByLabelText(`${tier} Kelimeler`)).toBeTruthy();
      expect(screen.getByLabelText(`${tier} Cümleler`)).toBeTruthy();
    }
  });

  it('plays the words of the chosen difficulty, whatever the learner level', async () => {
    seedProfile('adult', 'A1');
    await renderRouter(ROUTES);
    await press('Durum: Restoranda');
    await press('C1 Kelimeler');

    const ids = themeConcepts(content, 'tr-en', 'adult', 'restaurant', 'C1', 'vocabulary');
    const allowed = [...textsOf(ids, 'en', 'words'), ...textsOf(ids, 'tr', 'words')];
    expect(allowed).toContain(screen.getByTestId('quiz-prompt').props.children);
  });

  it('plays the long sentences of the chosen difficulty', async () => {
    seedProfile('adult', 'A1');
    await renderRouter(ROUTES);
    await press('Durum: Restoranda');
    await press('C1 Cümleler');

    const ids = themeConcepts(content, 'tr-en', 'adult', 'restaurant', 'C1', 'sentence');
    const prompts = textsOf(ids, 'tr', 'sentences');
    expect(prompts.some((text) => screen.queryByText(text))).toBe(true);
  });
});
