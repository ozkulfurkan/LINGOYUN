import '@/i18n';

import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import i18n from '@/i18n';

describe('HomeScreen', () => {
  it('shows the app name', async () => {
    await render(<HomeScreen />);
    expect(screen.getByText('LINGOYUN')).toBeTruthy();
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
