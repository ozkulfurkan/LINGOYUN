import 'i18next';

import type tr from './tr.json';

// Typed translation keys: t('home.missing') is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof tr };
  }
}
