import type { LanguageCode } from '@/features/languages';

/** Apple's standard licence agreement (EULA), used as the terms of use. */
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

/**
 * The privacy policy from docs/privacy, published with GitHub Pages
 * (store/README.md). The Turkish page is tr.html; every other language gets
 * the English one.
 */
const PRIVACY_BASE = 'https://ozkulfurkan.github.io/LINGOYUN/privacy/';
const PRIVACY_PAGES: Partial<Record<LanguageCode, string>> = { tr: 'tr.html' };

/** `uiLanguage` as i18next reports it ("tr", "en-US"…). */
export function privacyUrl(uiLanguage: string): string {
  const code = uiLanguage.split('-')[0] as LanguageCode;
  return PRIVACY_BASE + (PRIVACY_PAGES[code] ?? 'index.html');
}
