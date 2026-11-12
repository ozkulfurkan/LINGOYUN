import { render } from '@testing-library/react-native';

import { content } from '@/content/bundle';

import { WORD_ART_IDS, wordArt } from './index';

const PILOT = [
  'fruit.apple',
  'fruit.banana',
  'animal.cat',
  'animal.dog',
  'animal.elephant',
  'animal.fish',
  'vehicle.car',
  'vehicle.bus',
  'toy.ball',
  'clothes.shoes',
  'nature.sun',
  'home.house',
];

describe('wordArt', () => {
  it('returns a picture for every pilot image id', () => {
    for (const id of PILOT) expect(wordArt(id)).not.toBeNull();
  });

  it('returns null for unknown or missing ids', () => {
    expect(wordArt('animal.unicorn')).toBeNull();
    expect(wordArt('toString')).toBeNull();
    expect(wordArt('')).toBeNull();
    expect(wordArt(undefined)).toBeNull();
    expect(wordArt(null)).toBeNull();
  });

  it('only registers image ids that mini concepts use (no typos)', () => {
    const miniImages = new Set(
      content.concepts.filter((c) => c.ageGroups.includes('mini')).map((c) => c.image),
    );
    expect(WORD_ART_IDS.filter((id) => !miniImages.has(id))).toEqual([]);
  });

  it('has a picture for every word of ages 2–7', () => {
    const missing = content.concepts
      .filter((c) => c.ageGroups.includes('mini') && c.image)
      .map((c) => c.image!)
      .filter((image) => wordArt(image) === null);
    expect(missing).toEqual([]);
  });

  it.each(WORD_ART_IDS)('renders %s', async (id) => {
    const Art = wordArt(id)!;
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
