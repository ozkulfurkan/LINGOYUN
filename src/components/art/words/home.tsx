import { Circle, Path, Rect } from 'react-native-svg';

import { Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

/** House: tiled (kiremit) roof, chimney, door and two windows. */
function House({ size }: WordArtProps) {
  return (
    <WordCanvas
      size={size}
      tones={['tan', 'terracotta', 'brown', 'glass', 'lemon']}
      shadowWidth={38}
    >
      {(fill) => (
        <>
          <Rect x={64} y={18} width={11} height={22} rx={3} fill={fill('terracotta')} />
          <Rect x={18} y={44} width={64} height={48} rx={6} fill={fill('tan')} />
          <Path
            d="M10 51 C7 49 7 45 10 43 L46 15 C48 13 52 13 54 15 L90 43 C93 45 93 49 90 51 Z"
            fill={fill('terracotta')}
          />
          <Circle cx={50} cy={36} r={6} fill={fill('glass')} />
          <Path d="M42 92 L42 72 C42 64 58 64 58 72 L58 92 Z" fill={fill('brown')} />
          <Circle cx={54} cy={80} r={1.8} fill={fill('lemon')} />
          <Rect x={24} y={60} width={13} height={13} rx={3} fill={fill('glass')} />
          <Rect x={63} y={60} width={13} height={13} rx={3} fill={fill('glass')} />
          <Gloss cx={34} cy={30} rx={9} ry={3} rotate={-38} />
        </>
      )}
    </WordCanvas>
  );
}

export const homeArt = {
  'home.house': House,
} satisfies WordArtMap;
