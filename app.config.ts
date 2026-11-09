import type { ConfigContext, ExpoConfig } from 'expo/config';

// Store identity (LNG-3). Never change BUNDLE_ID once the app is in a store.
const BUNDLE_ID = 'com.ozkulfurkan.lingoyun';
const EAS_PROJECT_ID = '3fa95618-9566-4b1b-bd92-6b7d09a0c320';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'LINGOYUN',
  slug: 'lingoyun',
  owner: 'ozkulfurkan',
  scheme: 'lingoyun',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Kids profiles use a single light theme; the adult profile follows the
  // system light/dark setting, so the native UI style must be automatic.
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#FFE6CF',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    // Uploads source maps on EAS builds; the token comes from SENTRY_AUTH_TOKEN.
    ['@sentry/react-native/expo', { organization: 'ozkulfurkan', project: 'lingoyun' }],
    [
      'expo-splash-screen',
      {
        // Clay peach of the kids theme, the first thing every family sees.
        backgroundColor: '#FFE6CF',
        image: './assets/splash-icon.png',
        imageWidth: 200,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    ...config.extra,
    eas: { projectId: EAS_PROJECT_ID },
  },
});
