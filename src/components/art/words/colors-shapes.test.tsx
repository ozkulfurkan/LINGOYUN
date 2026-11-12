import { render } from '@testing-library/react-native';

import { content } from '@/content/bundle';

import { colorShapeArt } from './colors-shapes';

const IDS = [
  'color.red',
  'color.blue',
  'color.yellow',
  'color.green',
  'color.orange',
  'color.purple',
  'color.pink',
  'color.brown',
  'color.black',
  'color.white',
  'color.gray',
  'shape.circle',
  'shape.square',
  'shape.triangle',
  'shape.star',
  'shape.heart',
  'shape.rectangle',
  'shape.oval',
];

describe('colorShapeArt', () => {
  it('has a picture for every image id of the batch, and nothing else', () => {
    expect(IDS).toHaveLength(18);
    expect(Object.keys(colorShapeArt).sort()).toEqual([...IDS].sort());
  });

  it('only uses image ids of mini concepts', () => {
    const miniImages = new Set(
      content.concepts.filter((c) => c.ageGroups.includes('mini')).map((c) => c.image),
    );
    expect(IDS.filter((id) => !miniImages.has(id))).toEqual([]);
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = colorShapeArt[id as keyof typeof colorShapeArt];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
