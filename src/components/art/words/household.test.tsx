import { render } from '@testing-library/react-native';

import { householdArt } from './household';

const BATCH_6 = [
  'home.door',
  'home.window',
  'home.table',
  'home.chair',
  'home.bed',
  'home.sofa',
  'home.lamp',
  'home.clock',
  'home.mirror',
  'home.bathtub',
  'home.toilet',
  'home.sink',
  'home.fridge',
  'home.oven',
  'home.cup',
  'home.glass',
  'home.plate',
  'home.bowl',
  'home.spoon',
  'home.fork',
  'home.pillow',
  'home.blanket',
  'home.towel',
  'home.soap',
  'home.toothbrush',
  'home.key',
  'home.phone',
  'home.television',
  'home.book',
  'home.pencil',
  'home.crayon',
  'home.scissors',
  'home.box',
];

describe('householdArt', () => {
  it('has a picture for every id of batch 6 and nothing else', () => {
    expect(BATCH_6).toHaveLength(33);
    expect(Object.keys(householdArt).sort()).toEqual([...BATCH_6].sort());
  });

  it.each(BATCH_6)('renders %s', async (id) => {
    const Art = householdArt[id];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
