import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { FALLBACK_UI_LANGUAGE, pickUiLanguage } from './pickUiLanguage';
import { resources } from './resources';

function deviceLanguages(): string[] {
  try {
    return getLocales().map((l) => l.languageTag);
  } catch {
    // Native module unavailable (e.g. some test environments): use fallback.
    return [];
  }
}

// A dedicated instance keeps tests and the app from sharing global state.
const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: pickUiLanguage(deviceLanguages()),
  fallbackLng: FALLBACK_UI_LANGUAGE,
  interpolation: { escapeValue: false }, // React already escapes output
  returnNull: false,
});

export default i18n;
