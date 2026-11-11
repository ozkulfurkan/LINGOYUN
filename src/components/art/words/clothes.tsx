import { G, Path } from 'react-native-svg';

import { type ClayFill, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

/** One sneaker from the side, toe to the right; (x, y) moves it. */
function Sneaker({ x, y, fill }: { x: number; y: number; fill: ClayFill }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path
        d="M6 40 C6 24 10 12 20 10 C28 9 32 18 40 22 C52 28 68 28 74 36 C78 41 77 48 72 48 L10 48 C7 48 6 45 6 40 Z"
        fill={fill('berry')}
      />
      <Path d="M5 42 L77 42 C77 47 74 51 70 51 L10 51 C7 51 5 48 5 42 Z" fill={fill('cream')} />
      <Path
        d="M28 18 L34 24 M33 15 L39 21 M38 13 L44 19"
        stroke={fill('cream')}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <Gloss cx={16} cy={20} rx={4} ry={6} rotate={15} />
    </G>
  );
}

/** A pair of sneakers, one a little behind the other. */
function Shoes({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['berry', 'cream']} shadowWidth={40}>
      {(fill) => (
        <>
          <Sneaker x={18} y={28} fill={fill} />
          <Sneaker x={4} y={41} fill={fill} />
        </>
      )}
    </WordCanvas>
  );
}

export const clothesArt = {
  'clothes.shoes': Shoes,
} satisfies WordArtMap;
