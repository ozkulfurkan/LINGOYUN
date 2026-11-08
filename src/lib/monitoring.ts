import type { ReactNativeOptions } from '@sentry/react-native';

type Env = {
  dsn: string | undefined;
  isDev: boolean;
};

/**
 * Sentry options for this build. Without a DSN (local dev without .env, tests)
 * the SDK is disabled entirely, so nothing is sent and nothing breaks.
 *
 * Children use this app: no PII, no screenshots or view hierarchy (they could
 * show a child's nickname), and no user is ever attached to events.
 */
export function buildSentryOptions({ dsn, isDev }: Env): ReactNativeOptions {
  const trimmedDsn = dsn?.trim() || undefined;
  return {
    dsn: trimmedDsn,
    enabled: trimmedDsn !== undefined,
    environment: isDev ? 'development' : 'production',
    // Full tracing while developing; sample in release to stay within quota.
    tracesSampleRate: isDev ? 1 : 0.2,
    attachScreenshot: false,
    attachViewHierarchy: false,
    sendDefaultPii: false,
    beforeSend: (event) => {
      delete event.user;
      return event;
    },
  };
}
