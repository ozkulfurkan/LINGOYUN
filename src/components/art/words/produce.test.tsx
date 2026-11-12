import { render } from '@testing-library/react-native';

import { mixColor, produceArt, produceTones, shiftColor } from './produce';

const IDS = [
  'fruit.pear',
  'fruit.cherry',
  'fruit.grapes',
  'fruit.orange',
  'fruit.strawberry',
  'fruit.watermelon',
  'fruit.lemon',
  'fruit.peach',
  'fruit.apricot',
  'fruit.fig',
  'fruit.plum',
  'fruit.pineapple',
  'fruit.hazelnut',
  'vegetable.carrot',
  'vegetable.tomato',
  'vegetable.potato',
  'vegetable.cucumber',
  'vegetable.onion',
  'vegetable.pepper',
  'vegetable.corn',
  'vegetable.peas',
  'vegetable.mushroom',
  'vegetable.pumpkin',
  'drink.milk',
  'drink.water',
  'drink.juice',
  'drink.tea',
] as const;

describe('produceArt', () => {
  it('has a picture for every fruit, vegetable and drink of the batch', () => {
    expect(Object.keys(produceArt).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = produceArt[id];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('produce tones', () => {
  it('mixes colours channel by channel', () => {
    expect(mixColor('#000000', '#FFFFFF', 0)).toBe('#000000');
    expect(mixColor('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
    expect(mixColor('#000000', '#FF8800', 0.5)).toBe('#804400');
  });

  it('turns the hue and keeps a colour without shift', () => {
    expect(shiftColor('#FF0000', 120)).toBe('#00FF00');
    expect(shiftColor('#FF0000', -120)).toBe('#0000FF');
    expect(shiftColor('#4CC9A0', 0)).toBe('#4CC9A0');
  });

  it('derives only valid hex colours', () => {
    for (const tone of Object.values(produceTones)) {
      for (const stop of Object.values(tone)) expect(stop).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
