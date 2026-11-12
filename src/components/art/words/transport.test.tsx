import { render } from '@testing-library/react-native';

import { content } from '@/content/bundle';

import { transportArt } from './transport';

const IDS = [
  'vehicle.truck',
  'vehicle.train',
  'vehicle.plane',
  'vehicle.helicopter',
  'vehicle.boat',
  'vehicle.ship',
  'vehicle.bicycle',
  'vehicle.motorcycle',
  'vehicle.taxi',
  'vehicle.ambulance',
  'vehicle.fire_truck',
  'vehicle.police_car',
  'vehicle.tractor',
  'vehicle.rocket',
  'vehicle.submarine',
  'vehicle.tram',
  'vehicle.subway',
  'vehicle.hot_air_balloon',
  'vehicle.sled',
  'vehicle.skateboard',
  'vehicle.wheel',
  'vehicle.road',
  'vehicle.traffic_light',
];

describe('transportArt', () => {
  it('has a picture for every image id of the batch, and nothing else', () => {
    expect(IDS).toHaveLength(23);
    expect(Object.keys(transportArt).sort()).toEqual([...IDS].sort());
  });

  it('only uses image ids of mini concepts', () => {
    const miniImages = new Set(
      content.concepts.filter((c) => c.ageGroups.includes('mini')).map((c) => c.image),
    );
    expect(IDS.filter((id) => !miniImages.has(id))).toEqual([]);
  });

  it.each(IDS)('renders %s', async (id) => {
    const Art = transportArt[id as keyof typeof transportArt];
    const { toJSON } = await render(<Art size={64} />);
    expect(toJSON()).toBeTruthy();
  });
});
