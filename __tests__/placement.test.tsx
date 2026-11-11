import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import SelfAssessmentScreen from '@/app/onboarding/level';
import PlacementScreen from '@/app/placement/index';
import PlacementResultScreen from '@/app/placement/result';
import { content } from '@/content/bundle';
import { addProfile, deleteProfile, profilesStore, type ProfileType } from '@/features/profiles';
import i18n from '@/i18n';
import { startTestTrial } from '../test-support/access';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
}));

const ROUTES = {
  index: HomeScreen,
  'onboarding/level': SelfAssessmentScreen,
  'placement/index': PlacementScreen,
  'placement/result': PlacementResultScreen,
};

function seedProfile(type: ProfileType) {
  const result = profilesStore.update((s, d) =>
    addProfile(s, { nickname: 'Deniz', type, courseId: 'tr-en' }, d),
  );
  if (!result.ok) throw new Error(result.error);
}

const levelOf = () => {
  const { profiles, activeId } = profilesStore.getState();
  const profile = profiles.find((p) => p.id === activeId);
  return profile?.courses[profile.courseId]?.level;
};

async function press(label: string) {
  await fireEvent.press(screen.getByLabelText(label));
}

async function startTest(answer: string) {
  await renderRouter(ROUTES);
  await press(answer);
  await press('Devam');
}

/** Every text that translates the prompt on screen (a prompt can be a homonym). */
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

async function answerCorrectly() {
  const prompt = screen.getByTestId('quiz-prompt').props.children as string;
  const label = translationsOf(prompt).find((text) => screen.queryByLabelText(text));
  if (!label) throw new Error(`no option for "${prompt}"`);
  await press(label);
}

describe('placement test', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
    jest.clearAllMocks();
    startTestTrial();
  });

  afterEach(() => {
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('skips the test for someone who knows nothing', async () => {
    seedProfile('adult');
    await startTest('Hiç bilmiyorum');
    expect(screen.queryByLabelText('Bilmiyorum')).toBeNull();
    expect(levelOf()).toBe('A1');
    expect(screen.getByText('Merhaba Deniz')).toBeTruthy();
  });

  it('stores no level until the test is finished', async () => {
    seedProfile('adult');
    await startTest('Rahatça konuşabiliyorum');
    expect(screen.getByText('1 / 20')).toBeTruthy();
    await press('Bilmiyorum');
    expect(screen.getByText('2 / 20')).toBeTruthy();
    expect(levelOf()).toBeNull();
  });

  it('places at the lowest level when every answer is "I do not know"', async () => {
    seedProfile('adult');
    await startTest('Rahatça konuşabiliyorum');
    for (let i = 0; i < 20; i++) await press('Bilmiyorum');

    expect(levelOf()).toBe('A1');
    expect(screen.getByText('1. temadan başlıyorsun: Selamlaşma')).toBeTruthy();
    expect(screen.getByText('Buradan başlıyoruz, Deniz!')).toBeTruthy();
  });

  it('places at the top when every answer is right, then goes home', async () => {
    seedProfile('kid');
    await startTest('Birkaç kelime biliyorum');
    for (let i = 0; i < 20; i++) await answerCorrectly();

    expect(levelOf()).toBe('L3');
    expect(screen.getByText(/temadan başlıyorsun: Aylar ve hava$/)).toBeTruthy();

    await press('Başla');
    expect(screen.getByText('Merhaba Deniz')).toBeTruthy();
  });

  it('starts over if the app closed during the test', async () => {
    seedProfile('kid');
    await startTest('Çok iyi biliyorum');
    await press('Bilmiyorum');

    await renderRouter(ROUTES);
    expect(screen.getByText('Ne kadar İngilizce biliyorsun?')).toBeTruthy();
  });

  it('reads each question aloud for kids, in the language of the prompt', async () => {
    seedProfile('kid');
    await startTest('Çok iyi biliyorum');
    const prompt = screen.getByTestId('quiz-prompt').props.children as string;
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    const [text, options] = (Speech.speak as jest.Mock).mock.calls[0];
    expect(text).toBe(prompt);
    expect(['tr-TR', 'en-US']).toContain(options.language);
  });

  it('reads aloud for adults only on request', async () => {
    seedProfile('adult');
    await startTest('Rahatça konuşabiliyorum');
    expect(Speech.speak).not.toHaveBeenCalled();
    await press('Sesli oku');
    expect(Speech.speak).toHaveBeenCalledTimes(1);
  });
});
