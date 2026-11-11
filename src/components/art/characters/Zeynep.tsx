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
  Leg,
  Part,
  portraitCrop,
  Shoe,
} from './parts';
import type { CharacterProps, CharacterRig } from './types';

// Zeynep (7, the tallest, 3.2 heads): long wavy brown hair past the shoulders
// with a flower clip, lemon dress with a pocket. Silhouette: the long hair.

const HEAD = { x: 100, y: 80 };

export const ZEYNEP_RIG: CharacterRig = {
  feet: { x: 100, y: FEET_Y },
  neck: { x: 100, y: 118 },
  shoulderLeft: { x: 73, y: 128 },
  shoulderRight: { x: 127, y: 128 },
  ...faceRig(HEAD.x, HEAD.y),
};

export function Zeynep(props: CharacterProps) {
  const { expression = 'idle', size = DEFAULT_CHARACTER_SIZE, parts } = props;
  const arms = armAngles(props);
  return (
    <ClayCanvas
      box={CHARACTER_BOX}
      height={size}
      crop={portraitCrop(props, HEAD)}
      tones={['zeynepSkin', 'zeynepHair', 'lemon', 'berry', 'brown']}
      shadow={{ cx: 100, cy: FEET_Y, rx: 46, ry: 6 }}
    >
      {(fill) => (
        <Part name="figure" parts={parts}>
          {/* Long hair behind the body, with a wavy hem. */}
          <Path
            d="M100 36 C62 36 50 62 53 92 C55 108 47 118 50 130 C52 140 45 148 50 156 C54 162 62 161 66 156 C70 162 79 161 82 154 L118 154 C121 161 130 162 134 156 C138 161 146 162 150 156 C155 148 148 140 150 130 C153 118 145 108 147 92 C150 62 138 36 100 36 Z"
            fill={fill('zeynepHair')}
          />
          <Leg cx={89} top={206} skin="zeynepSkin" fill={fill} />
          <Leg cx={111} top={206} skin="zeynepSkin" fill={fill} />
          <Shoe cx={88} tone="brown" fill={fill} />
          <Shoe cx={112} tone="brown" fill={fill} />
          <Path
            d="M84 116 C72 116 67 122 66 132 L57 204 C56 212 61 216 69 216 L131 216 C139 216 144 212 143 204 L134 132 C133 122 128 116 116 116 Z"
            fill={fill('lemon')}
          />
          <Rect
            x={87}
            y={176}
            width={26}
            height={18}
            rx={7}
            fill={artPalette.tones.lemon.light}
            opacity={0.8}
          />
          <Gloss cx={82} cy={136} rx={7} ry={12} rotate={8} opacity={0.4} />
          <Part name="armLeft" parts={parts}>
            <Arm
              side="left"
              shoulder={ZEYNEP_RIG.shoulderLeft}
              angle={arms.left}
              length={42}
              skin="zeynepSkin"
              sleeve="lemon"
              fill={fill}
            />
          </Part>
          <Part name="armRight" parts={parts}>
            <Arm
              side="right"
              shoulder={ZEYNEP_RIG.shoulderRight}
              angle={arms.right}
              length={42}
              skin="zeynepSkin"
              sleeve="lemon"
              fill={fill}
            />
          </Part>
          <Part name="head" parts={parts}>
            <Ellipse cx={HEAD.x} cy={HEAD.y} rx={39} ry={37} fill={fill('zeynepSkin')} />
            <Face cx={HEAD.x} cy={HEAD.y} expression={expression} skin="zeynepSkin" parts={parts} />
            {/* Side-swept fringe. */}
            <Path
              d="M60 84 C56 54 76 40 100 40 C126 40 144 54 140 84 C136 70 126 60 112 56 C102 66 82 74 60 84 Z"
              fill={fill('zeynepHair')}
            />
            <Gloss cx={86} cy={50} rx={11} ry={4} rotate={-18} opacity={0.35} />
            <Part name="accessory" parts={parts}>
              {[0, 72, 144, 216, 288].map((a) => (
                <Circle
                  key={a}
                  cx={130 + 6.5 * Math.cos((a * Math.PI) / 180)}
                  cy={52 + 6.5 * Math.sin((a * Math.PI) / 180)}
                  r={5.2}
                  fill={fill('berry')}
                />
              ))}
              <Circle cx={130} cy={52} r={4} fill={fill('lemon')} />
            </Part>
          </Part>
        </Part>
      )}
    </ClayCanvas>
  );
}
