import type { ConfigContext, ExpoConfig } from 'expo/config';

// Store identifiers (bundleIdentifier / package) are set in LNG-3 once the
// Apple Developer and Google Play accounts exist. Until then the app runs as a
// development build only.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'LINGOYUN',
  slug: 'lingoyun',
  scheme: 'lingoyun',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Kids profiles use a single light theme; the adult profile follows the
  // system light/dark setting, so the native UI style must be automatic.
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FFE6CF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
});
