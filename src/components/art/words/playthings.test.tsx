import { render } from '@testing-library/react-native';

import { playthingArt, puzzlePiecePath, starPath } from './playthings';

const IDS = [
  'toy.doll',
  'toy.teddy_bear',
  'toy.toy_car',
  'toy.toy_train',
  'toy.blocks',
  'toy.puzzle',
  'toy.kite',
  'toy.balloon',
  'toy.drum',
  'toy.robot',
  'toy.yoyo',
  'toy.bubbles',
  'toy.slide',
  'toy.swing',
  'toy.jump_rope',
];

describe('playthingArt', () => {
  it('has a picture for every toy id of batch 7 and nothing else', () => {
    expect(Object.keys(playthingArt).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = playthingArt[id];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('starPath', () => {
  it('has two points per tip and starts at the top', () => {
    const d = starPath(50, 50, 10, 4);
    expect(d.startsWith('M50.0 40.0')).toBe(true);
    expect(d.split('L')).toHaveLength(10);
  });
});

describe('puzzlePiecePath', () => {
  it('is a plain square when all edges are flat', () => {
    expect(puzzlePiecePath(0, 0, 10, [0, 0, 0, 0])).toBe('M0 0 L10 0 L10 10 L0 10 L0 0 Z');
  });

  it('pushes a tab out of the piece and cuts a tab into it', () => {
    const out = puzzlePiecePath(0, 0, 10, [1, 0, 0, 0]);
    const cut = puzzlePiecePath(0, 0, 10, [-1, 0, 0, 0]);
    expect(out).toContain('C2 -4 8 -4');
    expect(cut).toContain('C2 4 8 4');
  });
});
