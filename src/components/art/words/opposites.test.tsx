import { render } from '@testing-library/react-native';

import {
  FOCUS_GROW,
  MUTED_OPACITY,
  OppositePair,
  oppositeArt,
  pairSlots,
  type OppositeItem,
} from './opposites';

const IDS = [
  'opposite.big',
  'opposite.small',
  'opposite.long',
  'opposite.short',
  'opposite.hot',
  'opposite.cold',
  'opposite.up',
  'opposite.down',
  'opposite.happy',
  'opposite.sad',
  'opposite.fast',
  'opposite.slow',
];

const item: OppositeItem = { draw: () => null };

describe('oppositeArt', () => {
  it('has a picture for every opposite id of batch 7 and nothing else', () => {
    expect(Object.keys(oppositeArt).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = oppositeArt[id];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('pairSlots', () => {
  it('mutes only the side that is not asked', () => {
    const left = pairSlots('left', item, item);
    expect(left.left.muted).toBe(false);
    expect(left.right.muted).toBe(true);
    const right = pairSlots('right', item, item);
    expect(right.left.muted).toBe(true);
    expect(right.right.muted).toBe(false);
  });

  it('makes the asked side a little bigger', () => {
    const slots = pairSlots('right', item, item);
    expect(slots.right.scale).toBeCloseTo(slots.left.scale * FOCUS_GROW);
  });

  it('keeps sizes when the size itself is the answer', () => {
    const big = { ...item, scale: 0.7 };
    const small = { ...item, scale: 0.3 };
    const slots = pairSlots('right', big, small, 'side', false);
    expect(slots.left.scale).toBe(0.7);
    expect(slots.right.scale).toBe(0.3);
  });

  it('puts the left item on top in the stacked layout', () => {
    const slots = pairSlots('left', item, item, 'stack');
    expect(slots.left.y).toBeLessThan(slots.right.y);
  });
});

describe('OppositePair', () => {
  it.each(['left', 'right'] as const)('highlights the %s side', async (focus) => {
    const { getByTestId } = await render(
      <OppositePair tones={['lemon']} left={item} right={item} focus={focus} />,
    );
    const other = focus === 'left' ? 'right' : 'left';
    expect(getByTestId(`opposite-${focus}`).props.opacity ?? 1).toBe(1);
    expect(getByTestId(`opposite-${other}`).props.opacity).toBe(MUTED_OPACITY);
  });
});
