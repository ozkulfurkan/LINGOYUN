import { render } from '@testing-library/react-native';

import { content } from '@/content/bundle';

import { outdoorArt } from './outdoors';

const IDS = [
  'nature.moon',
  'nature.cloud',
  'nature.rain',
  'nature.snow',
  'nature.ice',
  'nature.wind',
  'nature.lightning',
  'nature.rainbow',
  'nature.sky',
  'nature.tree',
  'nature.flower',
  'nature.leaf',
  'nature.grass',
  'nature.forest',
  'nature.mountain',
  'nature.volcano',
  'nature.river',
  'nature.lake',
  'nature.sea',
  'nature.island',
  'nature.beach',
  'nature.sand',
  'nature.rock',
  'nature.fire',
];

describe('outdoorArt', () => {
  it('has a picture for every image id of the batch, and nothing else', () => {
    expect(IDS).toHaveLength(24);
    expect(Object.keys(outdoorArt).sort()).toEqual([...IDS].sort());
  });

  it('only uses image ids of mini concepts', () => {
    const miniImages = new Set(
      content.concepts.filter((c) => c.ageGroups.includes('mini')).map((c) => c.image),
    );
    expect(IDS.filter((id) => !miniImages.has(id))).toEqual([]);
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = outdoorArt[id as keyof typeof outdoorArt];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
