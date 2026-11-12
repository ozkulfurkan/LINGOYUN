import { render } from '@testing-library/react-native';

import { animalSmallArt, mirrorPath } from './animals-small';

const BATCH_1 = [
  'animal.bird',
  'animal.horse',
  'animal.cow',
  'animal.sheep',
  'animal.goat',
  'animal.chicken',
  'animal.rooster',
  'animal.duck',
  'animal.donkey',
  'animal.rabbit',
  'animal.mouse',
  'animal.frog',
  'animal.turtle',
  'animal.bee',
  'animal.butterfly',
  'animal.ant',
  'animal.spider',
  'animal.snail',
  'animal.ladybug',
  'animal.worm',
  'animal.squirrel',
  'animal.hedgehog',
  'animal.deer',
  'animal.owl',
  'animal.parrot',
];

describe('animalSmallArt', () => {
  it('has a picture for every id of batch 1 and nothing else', () => {
    expect(Object.keys(animalSmallArt).sort()).toEqual([...BATCH_1].sort());
  });

  it.each(BATCH_1)('renders %s', async (id) => {
    const Art = animalSmallArt[id];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('mirrorPath', () => {
  it('mirrors x around 50 and keeps y', () => {
    expect(mirrorPath('M10 20 C30 40 45.5 60 50 70 L0 1 Z')).toBe(
      'M90 20 C70 40 54.5 60 50 70 L100 1 Z',
    );
  });
});
