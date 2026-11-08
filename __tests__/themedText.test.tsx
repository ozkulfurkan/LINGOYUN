import '@/i18n';

import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '@/components/ThemedText';
import i18n from '@/i18n';
import { ThemeProvider } from '@/theme';

describe('ThemedText', () => {
  it('uppercases adult labels with Turkish rules', async () => {
    await i18n.changeLanguage('tr');
    await render(
      <ThemeProvider profileType="adult">
        <ThemedText variant="label">seviye</ThemedText>
      </ThemeProvider>,
    );
    expect(screen.getByText('SEVİYE')).toBeTruthy();
  });

  it('leaves text alone in styles that do not uppercase', async () => {
    await render(
      <ThemeProvider profileType="kid">
        <ThemedText variant="label">seviye</ThemedText>
      </ThemeProvider>,
    );
    expect(screen.getByText('seviye')).toBeTruthy();
  });
});
