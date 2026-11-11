import { Ellipse, Path } from 'react-native-svg';

import { artPalette } from '@/theme/artPalette';

import { Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

function Apple({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['red', 'mint', 'brown']}>
      {(fill) => (
        <>
          <Path
            d="M50 30 C37 21 9 23 9 55 C9 82 27 92 39 92 C44 92 46 89 50 89 C54 89 56 92 61 92 C73 92 91 82 91 55 C91 23 63 21 50 30 Z"
            fill={fill('red')}
          />
          <Path
            d="M50 31 C50 21 52 15 57 9"
            stroke={fill('brown')}
            strokeWidth={6.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M56 19 C64 8 78 9 83 14 C77 24 63 25 56 19 Z" fill={fill('mint')} />
          <Gloss cx={28} cy={47} rx={7} ry={12} rotate={20} />
        </>
      )}
    </WordCanvas>
  );
}

function Banana({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['lemon', 'brown']} shadowWidth={34}>
      {(fill) => (
        <>
          {/* One plump banana lying on its back, stem up on the right. */}
          <Path
            d="M72 14 C88 26 94 50 83 69 C71 89 42 95 19 88 C9 85 7 78 12 75 C16 72 24 75 32 74 C53 70 64 56 66 38 C67 28 65 22 62 17 Z"
            fill={fill('lemon')}
          />
          <Path
            d="M72 26 C78 48 70 70 42 82"
            stroke={artPalette.tones.lemon.shade}
            strokeOpacity={0.45}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M62 17 L61 8 C61 5 67 4 69 6 L71 15 Z" fill={fill('brown')} />
          <Ellipse cx={11} cy={80} rx={3.5} ry={3} fill={fill('brown')} />
          <Gloss cx={52} cy={70} rx={13} ry={3.5} rotate={-28} />
        </>
      )}
    </WordCanvas>
  );
}

export const foodArt = {
  'fruit.apple': Apple,
  'fruit.banana': Banana,
} satisfies WordArtMap;
