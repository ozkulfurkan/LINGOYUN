import { render } from '@testing-library/react-native';

import { content } from '@/content/bundle';

import { animalWildArt } from './animals-wild';

const IDS = [
  'animal.lion',
  'animal.tiger',
  'animal.monkey',
  'animal.giraffe',
  'animal.zebra',
  'animal.bear',
  'animal.wolf',
  'animal.fox',
  'animal.snake',
  'animal.penguin',
  'animal.dolphin',
  'animal.whale',
  'animal.shark',
  'animal.crab',
  'animal.octopus',
  'animal.camel',
  'animal.kangaroo',
  'animal.panda',
  'animal.eagle',
  'animal.crocodile',
  'animal.hippo',
];

describe('animalWildArt', () => {
  it('has a picture for every image id of the batch, and nothing else', () => {
    expect(Object.keys(animalWildArt).sort()).toEqual([...IDS].sort());
  });

  it('only uses image ids of mini concepts', () => {
    const miniImages = new Set(
      content.concepts.filter((c) => c.ageGroups.includes('mini')).map((c) => c.image),
    );
    expect(IDS.filter((id) => !miniImages.has(id))).toEqual([]);
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = animalWildArt[id as keyof typeof animalWildArt];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
