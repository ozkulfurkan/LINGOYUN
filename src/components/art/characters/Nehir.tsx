import { Circle, Ellipse, Path, Rect } from 'react-native-svg';

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
  Part,
  portraitCrop,
  Shoe,
} from './parts';
import type { CharacterProps, CharacterRig } from './types';

// Nehir (5–6, 2.9 heads): two round buns high on the head, sky blue t-shirt,
// mint overalls with a white river wave. Silhouette: the two buns.

const HEAD = { x: 100, y: 106 };

export const NEHIR_RIG: CharacterRig = {
  feet: { x: 100, y: FEET_Y },
  neck: { x: 100, y: 142 },
  shoulderLeft: { x: 73, y: 152 },
  shoulderRight: { x: 127, y: 152 },
  ...faceRig(HEAD.x, HEAD.y),
};

export function Nehir(props: CharacterProps) {
  const { expression = 'idle', size = DEFAULT_CHARACTER_SIZE, parts } = props;
  const arms = armAngles(props);
  return (
    <ClayCanvas
      box={CHARACTER_BOX}
      height={size}
      crop={portraitCrop(props, HEAD)}
      tones={['nehirSkin', 'nehirHair', 'sky', 'mint', 'charcoal']}
      shadow={{ cx: 100, cy: FEET_Y, rx: 42, ry: 6 }}
    >
      {(fill) => (
        <Part name="figure" parts={parts}>
          <Shoe cx={87} tone="charcoal" fill={fill} />
          <Shoe cx={113} tone="charcoal" fill={fill} />
          {/* T-shirt. */}
          <Path
            d="M84 140 C72 140 67 146 67 156 L67 196 L133 196 L133 156 C133 146 128 140 116 140 Z"
            fill={fill('sky')}
          />
          {/* Overalls: bib, straps and short trouser legs. */}
          <Path
            d="M80 164 C80 161 82 159 85 159 L115 159 C118 159 120 161 120 164 L120 182 L132 184 L134 222 C134 228 131 230 125 230 L106 230 C103 230 102 228 102 225 L101 212 L99 212 L98 225 C98 228 97 230 94 230 L75 230 C69 230 66 228 66 222 L68 184 L80 182 Z"
            fill={fill('mint')}
          />
          <Path
            d="M80 162 L76 143 M120 162 L124 143"
            stroke={artPalette.tones.mint.face}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <Path
            d="M70 198 C78 192 86 204 94 198 C102 192 110 204 118 198 C124 194 128 196 131 199"
            stroke={artPalette.tones.cream.face}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={80} cy={166} r={2.6} fill={artPalette.tones.lemon.face} />
          <Circle cx={120} cy={166} r={2.6} fill={artPalette.tones.lemon.face} />
          <Gloss cx={84} cy={150} rx={6} ry={3} rotate={-20} opacity={0.4} />
          <Part name="armLeft" parts={parts}>
            <Arm
              side="left"
              shoulder={NEHIR_RIG.shoulderLeft}
              angle={arms.left}
              length={36}
              skin="nehirSkin"
              sleeve="sky"
              fill={fill}
            />
          </Part>
          <Part name="armRight" parts={parts}>
            <Arm
              side="right"
              shoulder={NEHIR_RIG.shoulderRight}
              angle={arms.right}
              length={36}
              skin="nehirSkin"
              sleeve="sky"
              fill={fill}
            />
          </Part>
          <Part name="head" parts={parts}>
            <Part name="accessory" parts={parts}>
              <Circle cx={69} cy={70} r={18} fill={fill('nehirHair')} />
              <Circle cx={131} cy={70} r={18} fill={fill('nehirHair')} />
              <Rect
                x={73}
                y={81}
                width={12}
                height={6}
                rx={3}
                fill={artPalette.tones.mint.face}
                transform="rotate(35 79 84)"
              />
              <Rect
                x={115}
                y={81}
                width={12}
                height={6}
                rx={3}
                fill={artPalette.tones.mint.face}
                transform="rotate(-35 121 84)"
              />
            </Part>
            <Circle cx={63} cy={112} r={7} fill={fill('nehirSkin')} />
            <Circle cx={137} cy={112} r={7} fill={fill('nehirSkin')} />
            <Ellipse cx={HEAD.x} cy={HEAD.y} rx={38} ry={36} fill={fill('nehirSkin')} />
            <Face cx={HEAD.x} cy={HEAD.y} expression={expression} skin="nehirSkin" parts={parts} />
            {/* Hair pulled up, parted in the middle. */}
            <Path
              d="M62 106 C58 80 76 68 100 68 C124 68 142 80 138 106 C130 92 116 84 100 88 C84 84 70 92 62 106 Z"
              fill={fill('nehirHair')}
            />
            <Gloss cx={62} cy={63} rx={6} ry={3.5} opacity={0.3} />
            <Gloss cx={124} cy={63} rx={6} ry={3.5} opacity={0.3} />
          </Part>
        </Part>
      )}
    </ClayCanvas>
  );
}
