import { render } from '@testing-library/react-native';

import { content } from '@/content/bundle';

import { bodyArt } from './body';

const IDS = [
  'body.head',
  'body.neck',
  'body.shoulder',
  'body.arm',
  'body.elbow',
  'body.hand',
  'body.tummy',
  'body.leg',
  'body.knee',
  'body.foot',
  'body.hair',
  'body.face',
  'body.eye',
  'body.eyebrow',
  'body.ear',
  'body.nose',
  'body.cheek',
  'body.mouth',
  'body.lips',
  'body.chin',
  'body.finger',
  'body.toe',
  'body.tooth',
  'body.tongue',
  'body.back',
];

describe('bodyArt', () => {
  it('has a picture for every image id of the batch, and nothing else', () => {
    expect(IDS).toHaveLength(25);
    expect(Object.keys(bodyArt).sort()).toEqual([...IDS].sort());
  });

  it('only uses image ids of mini concepts', () => {
    const miniImages = new Set(
      content.concepts.filter((c) => c.ageGroups.includes('mini')).map((c) => c.image),
    );
    expect(IDS.filter((id) => !miniImages.has(id))).toEqual([]);
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = bodyArt[id as keyof typeof bodyArt];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
