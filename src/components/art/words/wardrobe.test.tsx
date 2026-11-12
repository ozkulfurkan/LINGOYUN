import { render } from '@testing-library/react-native';

import { mirrorPath, wardrobeArt, wardrobeTones } from './wardrobe';

const IDS = [
  'clothes.shirt',
  'clothes.tshirt',
  'clothes.pants',
  'clothes.shorts',
  'clothes.skirt',
  'clothes.dress',
  'clothes.coat',
  'clothes.jacket',
  'clothes.sweater',
  'clothes.pajamas',
  'clothes.swimsuit',
  'clothes.raincoat',
  'clothes.boots',
  'clothes.slippers',
  'clothes.socks',
  'clothes.hat',
  'clothes.scarf',
  'clothes.gloves',
  'clothes.belt',
  'clothes.glasses',
  'clothes.bag',
  'clothes.umbrella',
  'clothes.button',
  'clothes.zipper',
] as const;

describe('wardrobeArt', () => {
  it('has a picture for exactly the 24 clothing words of the batch', () => {
    expect(IDS).toHaveLength(24);
    expect(Object.keys(wardrobeArt).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = wardrobeArt[id];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('wardrobe helpers', () => {
  it('mirrors x across the middle and keeps y', () => {
    expect(mirrorPath('M10 20 L30 40 C0 1 2 3 4 5 Z')).toBe('M 90 20 L 70 40 C 100 1 98 3 96 5 Z');
    expect(mirrorPath('M-15 -2 L5 4', 0)).toBe('M 15 -2 L -5 4');
  });

  it('refuses commands it cannot mirror', () => {
    expect(() => mirrorPath('M0 0 A5 5 0 0 0 10 10')).toThrow();
  });

  it('derives only valid hex colours', () => {
    for (const tone of Object.values(wardrobeTones)) {
      for (const stop of Object.values(tone)) expect(stop).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
