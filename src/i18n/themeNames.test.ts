import { pathOf } from '@/content';
import { content } from '@/content/bundle';
import { LANGUAGE_CODES } from '@/features/languages';

import { resources } from './resources';

describe('theme names', () => {
  const titles = (['kid', 'adult'] as const).flatMap((type) =>
    pathOf(content, 'tr-en', type).map((t) => t.title),
  );

  it.each(LANGUAGE_CODES)('%s names every theme of the path', (code) => {
    const names = resources[code].translation.themes.names as Record<string, string>;
    expect(titles.filter((title) => !names[title]?.trim())).toEqual([]);
  });
});
