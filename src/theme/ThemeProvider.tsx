import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ProfileType } from '@/features/profiles/types';

import { selectTheme, type AppearancePreference } from './selectTheme';
import { kidsTheme } from './themes';
import type { Theme } from './types';

const ThemeContext = createContext<Theme>(kidsTheme);

type Props = {
  profileType: ProfileType | null;
  preference?: AppearancePreference;
  children: ReactNode;
};

export function ThemeProvider({ profileType, preference = 'system', children }: Props) {
  const scheme = useColorScheme();
  const theme = useMemo(
    // useColorScheme can return 'unspecified' on some platforms; treat it as unknown.
    () =>
      selectTheme(profileType, scheme === 'dark' || scheme === 'light' ? scheme : null, preference),
    [profileType, scheme, preference],
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** The active theme. Outside a provider this is the kids theme. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
