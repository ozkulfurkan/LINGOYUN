import '@/i18n';

import { screen } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';

import HomeScreen from '@/app/index';
import { addProfile, deleteProfile, profilesStore } from '@/features/profiles';
import i18n from '@/i18n';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    const result = profilesStore.update((s, d) =>
      addProfile(s, { nickname: 'Deniz', type: 'mini', courseId: 'tr-en' }, d),
    );
    if (!result.ok) throw new Error(result.error);
  });

  afterEach(() => {
    profilesStore.getState().profiles.forEach((p) => deleteProfile(p.id));
  });

  it('greets a child of ages 2–7 in the active language', async () => {
    await i18n.changeLanguage('tr');
    await renderRouter({ index: HomeScreen }, { initialUrl: '/' });
    expect(screen.getByText('Merhaba Deniz! Hangi dünyaya gidelim?')).toBeTruthy();
    screen.unmount();

    await i18n.changeLanguage('en');
    await renderRouter({ index: HomeScreen }, { initialUrl: '/' });
    expect(screen.getByText('Hello Deniz! Which world shall we visit?')).toBeTruthy();
    await i18n.changeLanguage('tr');
  });
});
