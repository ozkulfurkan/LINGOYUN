import type { ErrorEvent } from '@sentry/react-native';

import { buildSentryOptions } from './monitoring';

describe('buildSentryOptions', () => {
  it('is disabled without a DSN', () => {
    for (const dsn of [undefined, '', '   ']) {
      const options = buildSentryOptions({ dsn, isDev: false });
      expect(options.enabled).toBe(false);
      expect(options.dsn).toBeUndefined();
    }
  });

  it('is enabled with a DSN and tags the environment', () => {
    const dev = buildSentryOptions({ dsn: ' https://key@sentry.io/1 ', isDev: true });
    expect(dev.enabled).toBe(true);
    expect(dev.dsn).toBe('https://key@sentry.io/1');
    expect(dev.environment).toBe('development');
    expect(buildSentryOptions({ dsn: 'https://key@sentry.io/1', isDev: false }).environment).toBe(
      'production',
    );
  });

  it('never sends personal data', () => {
    const options = buildSentryOptions({ dsn: 'https://key@sentry.io/1', isDev: false });
    expect(options.sendDefaultPii).toBe(false);
    expect(options.attachScreenshot).toBe(false);
    expect(options.attachViewHierarchy).toBe(false);

    const event = { type: undefined, user: { id: '1', username: 'Zeynep' } } as ErrorEvent;
    const sent = options.beforeSend?.(event, {}) as ErrorEvent;
    expect(sent.user).toBeUndefined();
  });
});
