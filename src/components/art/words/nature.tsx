import { Circle, Rect } from 'react-native-svg';

import { Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

const RAYS = 8;

/** Sun: a clay disc with chubby rounded rays. */
function Sun({ size }: WordArtProps) {
  const cx = 50;
  const cy = 48;
  return (
    <WordCanvas size={size} tones={['lemon', 'orange']} shadowWidth={22}>
      {(fill) => (
        <>
          {/* Chubby rounded rays, long and short in turn. */}
          {Array.from({ length: RAYS }, (_, i) => {
            const length = i % 2 === 0 ? 17 : 13;
            return (
              <Rect
                key={i}
                x={cx - 7}
                y={cy - 30 - length}
                width={14}
                height={length + 6}
                rx={7}
                fill={fill('orange')}
                transform={`rotate(${(360 / RAYS) * i} ${cx} ${cy})`}
              />
            );
          })}
          <Circle cx={cx} cy={cy} r={28} fill={fill('lemon')} />
          <Gloss cx={38} cy={36} rx={9} ry={5.5} />
        </>
      )}
    </WordCanvas>
  );
}

export const natureArt = {
  'nature.sun': Sun,
} satisfies WordArtMap;
