import { Circle, Ellipse, G, Path } from 'react-native-svg';

import { artPalette } from '@/theme/artPalette';

import { ClayCanvas, Gloss } from '../clay';
import {
  Arm,
  armAngles,
  CHARACTER_BOX,
  DEFAULT_CHARACTER_SIZE,
  Face,
  faceRig,
  FEET_Y,
  Leg,
  Part,
  portraitCrop,
  Shoe,
} from './parts';
import type { CharacterProps, CharacterRig } from './types';

// Kerem (4, the smallest, 2.6 heads): backwards raspberry cap, round glasses,
// short curly black hair, raspberry t-shirt, blue shorts, white sneakers.
// Silhouette: the cap with its peak sticking out behind.

const HEAD = { x: 100, y: 124 };

export const KEREM_RIG: CharacterRig = {
  feet: { x: 100, y: FEET_Y },
  neck: { x: 100, y: 158 },
  shoulderLeft: { x: 75, y: 168 },
  shoulderRight: { x: 125, y: 168 },
  ...faceRig(HEAD.x, HEAD.y),
};

// Short curls peeking out under the cap band, above the temples.
const CURLS = [
  { x: 68, y: 110 },
  { x: 77, y: 107 },
  { x: 66, y: 119 },
  { x: 132, y: 110 },
  { x: 123, y: 107 },
  { x: 134, y: 119 },
  { x: 88, y: 109 },
  { x: 100, y: 110 },
  { x: 112, y: 109 },
];

export function Kerem(props: CharacterProps) {
  const { expression = 'idle', size = DEFAULT_CHARACTER_SIZE, parts } = props;
  const arms = armAngles(props);
  const { ink, gloss } = artPalette;
  const eyeY = KEREM_RIG.eyes.y;
  return (
    <ClayCanvas
      box={CHARACTER_BOX}
      height={size}
      crop={portraitCrop(props, HEAD)}
      tones={['keremSkin', 'keremHair', 'berry', 'sky', 'cream']}
      shadow={{ cx: 100, cy: FEET_Y, rx: 40, ry: 6 }}
    >
      {(fill) => (
        <Part name="figure" parts={parts}>
          <Leg cx={89} top={208} skin="keremSkin" fill={fill} />
          <Leg cx={111} top={208} skin="keremSkin" fill={fill} />
          <Shoe cx={88} tone="cream" fill={fill} />
          <Shoe cx={112} tone="cream" fill={fill} />
          {/* Shorts, then the t-shirt over their waistband. */}
          <Path
            d="M72 192 L128 192 L131 210 C131 214 128 216 124 216 L105 216 L100 206 L95 216 L76 216 C72 216 69 214 69 210 Z"
            fill={fill('sky')}
          />
          <Path
            d="M84 156 C74 156 70 162 70 172 L71 198 L129 198 L130 172 C130 162 126 156 116 156 Z"
            fill={fill('berry')}
          />
          <Gloss cx={84} cy={166} rx={6} ry={3} rotate={-20} opacity={0.4} />
          <Part name="armLeft" parts={parts}>
            <Arm
              side="left"
              shoulder={KEREM_RIG.shoulderLeft}
              angle={arms.left}
              length={30}
              skin="keremSkin"
              sleeve="berry"
              fill={fill}
            />
          </Part>
          <Part name="armRight" parts={parts}>
            <Arm
              side="right"
              shoulder={KEREM_RIG.shoulderRight}
              angle={arms.right}
              length={30}
              skin="keremSkin"
              sleeve="berry"
              fill={fill}
            />
          </Part>
          <Part name="head" parts={parts}>
            <Circle cx={63} cy={130} r={7} fill={fill('keremSkin')} />
            <Circle cx={137} cy={130} r={7} fill={fill('keremSkin')} />
            <Ellipse cx={HEAD.x} cy={HEAD.y} rx={36} ry={34} fill={fill('keremSkin')} />
            {CURLS.map((c) => (
              <Circle key={`${c.x}-${c.y}`} cx={c.x} cy={c.y} r={5.5} fill={fill('keremHair')} />
            ))}
            <Face cx={HEAD.x} cy={HEAD.y} expression={expression} skin="keremSkin" parts={parts} />
            {/* Glasses sit over the eyes. */}
            <G>
              <Circle cx={86} cy={eyeY} r={10.5} fill={gloss} opacity={0.18} />
              <Circle cx={114} cy={eyeY} r={10.5} fill={gloss} opacity={0.18} />
              <Circle cx={86} cy={eyeY} r={10.5} fill="none" stroke={ink} strokeWidth={3} />
              <Circle cx={114} cy={eyeY} r={10.5} fill="none" stroke={ink} strokeWidth={3} />
              <Path
                d={`M96 ${eyeY - 1} Q100 ${eyeY - 4} 104 ${eyeY - 1}`}
                stroke={ink}
                strokeWidth={3}
                fill="none"
              />
            </G>
            <Part name="accessory" parts={parts}>
              {/* Peak worn backwards: it sticks out behind the head. */}
              <Path
                d="M72 104 C58 100 44 104 36 112 C48 116 62 114 74 112 Z"
                fill={fill('berry')}
              />
              <Path
                d="M64 114 C62 88 80 78 100 78 C122 78 140 88 136 114 C124 106 76 106 64 114 Z"
                fill={fill('berry')}
              />
              <Circle cx={100} cy={79} r={3.5} fill={fill('berry')} />
              <Gloss cx={84} cy={88} rx={9} ry={4} rotate={-18} />
            </Part>
          </Part>
        </Part>
      )}
    </ClayCanvas>
  );
}
