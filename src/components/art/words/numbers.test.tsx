import { render } from '@testing-library/react-native';

import { content } from '@/content/bundle';

import { numberArt } from './numbers';

const IDS = [
  'number.one',
  'number.two',
  'number.three',
  'number.four',
  'number.five',
  'number.six',
  'number.seven',
  'number.eight',
  'number.nine',
  'number.ten',
  'number.eleven',
  'number.twelve',
  'number.thirteen',
  'number.fourteen',
  'number.fifteen',
  'number.sixteen',
  'number.seventeen',
  'number.eighteen',
  'number.nineteen',
  'number.twenty',
];

describe('numberArt', () => {
  it('has a picture for every image id of the batch, and nothing else', () => {
    expect(IDS).toHaveLength(20);
    expect(Object.keys(numberArt).sort()).toEqual([...IDS].sort());
  });

  it('only uses image ids of mini concepts', () => {
    const miniImages = new Set(
      content.concepts.filter((c) => c.ageGroups.includes('mini')).map((c) => c.image),
    );
    expect(IDS.filter((id) => !miniImages.has(id))).toEqual([]);
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = numberArt[id as keyof typeof numberArt];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
