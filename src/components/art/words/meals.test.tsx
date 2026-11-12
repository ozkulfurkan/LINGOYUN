import { render } from '@testing-library/react-native';

import { mealArt } from './meals';

const MEALS = [
  'food.bread',
  'food.cheese',
  'food.egg',
  'food.rice',
  'food.pasta',
  'food.soup',
  'food.meat',
  'food.salad',
  'food.sandwich',
  'food.pizza',
  'food.cake',
  'food.cookie',
  'food.candy',
  'food.ice_cream',
  'food.chocolate',
  'food.honey',
  'food.yogurt',
  'food.butter',
  'food.jam',
  'food.olive',
  'food.popcorn',
];

describe('mealArt', () => {
  it('has a picture for every food word of batch 4, and nothing else', () => {
    expect(Object.keys(mealArt).sort()).toEqual([...MEALS].sort());
  });

  it.each(MEALS)('renders %s', async (id) => {
    const Art = mealArt[id as keyof typeof mealArt];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
