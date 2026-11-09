import '@/i18n';

import { fireEvent, screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import StepScreen from '@/app/play/step';
import ThemeScreen from '@/app/play/theme';
import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { startPath } from '@/features/path';
import {
  addProfile,
  deleteProfile,
  profilesStore,
  setCourseLevel,
  type Profile,
  type ProfileType,
} from '@/features/profiles';
import i18n from '@/i18n';
import { loadPath, savePath } from '@/storage/path';

jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

const ROUTES = { index: HomeScreen, 'play/theme': ThemeScreen, 'play/step': StepScreen };

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

describe('learning path home', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr');
  });

  afterEach(() => profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id)));

  it('numbers themes from 1 and never shows a level name', async () => {
    seedProfile('adult', 'A1');
    await renderRouter(ROUTES);
    expect(screen.getByLabelText(/^1\. Selamlaşma: şu anki seviye/)).toBeTruthy();
    expect(screen.getByLabelText('2. Kişiler ve aile: kilitli')).toBeTruthy();
    for (const level of ['A1', 'A2', 'B1', 'L1']) expect(screen.queryByText(level)).toBeNull();
  });

  it('shows a theme name when its stone is tapped', async () => {
    seedProfile('kid', 'L1');
    await renderRouter(ROUTES);
    await press('2. Renkler ve şekiller: kilitli');
    expect(screen.getByTestId('theme-card-name').props.children).toBe('2. Renkler ve şekiller');
    expect(screen.getByText('Bu temaya henüz gelmedin.')).toBeTruthy();
    expect(screen.queryByLabelText('Temayı aç')).toBeNull();
  });

  it('opens a reached theme with its five steps', async () => {
    const profile = seedProfile('adult', 'A1');
    savePath(profile.id, 'tr-en', { ...loadPath(profile), themeIndex: 1, stepIndex: 2 });
    await renderRouter(ROUTES);
    await press(/^2\. Kişiler ve aile: şu anki seviye/);
    await press('Temayı aç');
    expect(screen.getByLabelText('1. basamak: tamamlandı')).toBeTruthy();
    expect(screen.getByLabelText('3. basamak: sıradaki')).toBeTruthy();
    expect(screen.getByLabelText('Sınav: kilitli')).toBeTruthy();
  });

  it('continues at the current step with three lives', async () => {
    const profile = seedProfile('adult', 'A2');
    await renderRouter(ROUTES);
    await press('Devam et');
    const themes = pathOf(content, 'tr-en', 'adult');
    const start = startPath(themes, ['A1', 'A2', 'B1', 'B2', 'C1'], 'A2');
    expect(loadPath(profile).themeIndex).toBe(start.themeIndex);
    expect(screen.getByLabelText('3 can kaldı')).toBeTruthy();
    expect(screen.getByLabelText('Soru 1 / 18')).toBeTruthy();
  });

  it('keeps mini profiles off the path', async () => {
    seedProfile('mini', 'L1');
    await renderRouter(ROUTES, { initialUrl: '/play/step?theme=0&step=0' });
    expect(screen.getByText('Yakında')).toBeTruthy();
  });

  it('does not open a step not reached yet', async () => {
    seedProfile('adult', 'A1');
    await renderRouter(ROUTES, { initialUrl: '/play/step?theme=3&step=0' });
    expect(screen.queryByTestId('hearts')).toBeNull();
    expect(screen.getByLabelText('Devam et')).toBeTruthy();
  });
});
