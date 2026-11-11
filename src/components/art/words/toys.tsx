import { useId } from 'react';
import { Circle, ClipPath, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { artPalette } from '@/theme/artPalette';

import { Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

/** Beach ball: coloured segments under one clay shading layer. */
function Ball({ size }: WordArtProps) {
  const id = `b${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <WordCanvas size={size} tones={['berry', 'lemon', 'sky', 'cream']} shadowWidth={30}>
      {(fill) => (
        <>
          <Defs>
            <ClipPath id={`${id}-clip`}>
              <Circle cx={50} cy={54} r={38} />
            </ClipPath>
            {/* Shading over all segments, so the ball reads as one round thing. */}
            <RadialGradient id={`${id}-shade`} cx="35%" cy="30%" r="75%">
              <Stop offset="0" stopColor={artPalette.gloss} stopOpacity={0.35} />
              <Stop offset="0.5" stopColor={artPalette.shadow} stopOpacity={0} />
              <Stop offset="1" stopColor={artPalette.shadow} stopOpacity={0.35} />
            </RadialGradient>
          </Defs>
          <G clipPath={`url(#${id}-clip)`}>
            <Circle cx={50} cy={54} r={38} fill={fill('cream')} />
            {/* Segments meet at a pole near the top, like a real beach ball. */}
            <Path d="M42 20 C14 34 18 76 58 92 L0 100 L0 0 Z" fill={artPalette.tones.sky.face} />
            <Path
              d="M42 20 C14 34 18 76 58 92 C40 72 34 42 42 20 Z"
              fill={artPalette.tones.berry.face}
            />
            <Path
              d="M42 20 C60 38 66 66 58 92 C96 72 92 30 42 20 Z"
              fill={artPalette.tones.lemon.face}
            />
            <Circle cx={50} cy={54} r={38} fill={`url(#${id}-shade)`} />
          </G>
          <Circle cx={42} cy={20} r={5} fill={fill('cream')} />
          <Gloss cx={30} cy={36} rx={9} ry={5} />
        </>
      )}
    </WordCanvas>
  );
}

export const toyArt = {
  'toy.ball': Ball,
} satisfies WordArtMap;
