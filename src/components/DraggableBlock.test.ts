import { DROP_TOLERANCE, isInZone } from './DraggableBlock';

describe('isInZone', () => {
  const zone = { x: 100, y: 200, width: 150, height: 60 };

  it('accepts points inside the zone', () => {
    expect(isInZone(zone, 120, 230)).toBe(true);
  });

  it('accepts near misses within the magnet tolerance', () => {
    expect(isInZone(zone, 100 - DROP_TOLERANCE, 200 - DROP_TOLERANCE)).toBe(true);
    expect(isInZone(zone, 250 + DROP_TOLERANCE, 260 + DROP_TOLERANCE)).toBe(true);
  });

  it('rejects drops further away, or without a zone', () => {
    expect(isInZone(zone, 100 - DROP_TOLERANCE - 1, 230)).toBe(false);
    expect(isInZone(zone, 120, 260 + DROP_TOLERANCE + 1)).toBe(false);
    expect(isInZone(null, 120, 230)).toBe(false);
  });
});
