import '@/i18n';

import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import { addProfile, deleteProfile, profilesStore } from '@/features/profiles';
import i18n from '@/i18n';

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

  it('shows the app name and greets the profile', async () => {
    await i18n.changeLanguage('tr');
    await render(<HomeScreen />);
    expect(screen.getByText('LINGOYUN')).toBeTruthy();
    expect(screen.getByText('Merhaba Deniz')).toBeTruthy();
  });

  it('shows UI text in the active language', async () => {
    await i18n.changeLanguage('tr');
    await render(<HomeScreen />);
    expect(screen.getByText('Yakında')).toBeTruthy();

    await i18n.changeLanguage('en');
    await render(<HomeScreen />);
    expect(screen.getByText('Coming soon')).toBeTruthy();
  });
});
