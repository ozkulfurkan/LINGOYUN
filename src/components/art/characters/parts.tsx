import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette, type ArtToneName } from '@/theme/artPalette';

import type { ClayFill } from '../clay';
import type { CharacterPart, CharacterProps, Expression, Point } from './types';

// Shared pieces of the three characters: the same face, arms and shoes, so
// they read as one family and only the silhouette features differ.

/** The Rive artboard ratio from docs/characters.md (512 × 640); feet ~32 px above the bottom. */
export const CHARACTER_BOX = { width: 200, height: 250 } as const;
export const FEET_Y = 237;
export const DEFAULT_CHARACTER_SIZE = 240;

const { ink, mouth: mouthColor, tongue, cheek, gloss } = artPalette;

/** Renders a part inside its wrapper (for animation) or a plain group. */
export function Part({
  name,
  parts,
  children,
}: {
  name: CharacterPart;
  parts: CharacterProps['parts'];
  children: ReactNode;
}) {
  const Wrapper = parts?.[name];
  const group = <G>{children}</G>;
  return Wrapper ? <Wrapper>{group}</Wrapper> : group;
}

const PORTRAIT_SIZE = 108;

/** Square crop around the head for `framing="portrait"`; undefined for the full figure. */
export function portraitCrop(props: CharacterProps, head: Point) {
  if (props.framing !== 'portrait') return undefined;
  return {
    x: head.x - PORTRAIT_SIZE / 2,
    y: head.y - 64,
    width: PORTRAIT_SIZE,
    height: PORTRAIT_SIZE,
  };
}

/** Arm angles per expression (degrees outwards from hanging down). */
export const ARM_POSES: Record<Expression, { left: number; right: number }> = {
  idle: { left: 14, right: 14 },
  happy: { left: 145, right: 145 },
  sad: { left: 4, right: 4 },
  talking: { left: 14, right: 120 },
};

export function armAngles(props: CharacterProps) {
  return props.armAngles ?? ARM_POSES[props.expression ?? 'idle'];
}

type ArmProps = {
  side: 'left' | 'right';
  shoulder: Point;
  angle: number;
  length: number;
  skin: ArtToneName;
  sleeve: ArtToneName;
  fill: ClayFill;
};

/** Skin-coloured arm with a round hand and a sleeve cap, drawn hanging down and rotated at the shoulder. */
export function Arm({ side, shoulder, angle, length, skin, sleeve, fill }: ArmProps) {
  const { x, y } = shoulder;
  const rotation = side === 'left' ? angle : -angle;
  return (
    <G transform={`rotate(${rotation} ${x} ${y})`}>
      {/* Rects, not stroked lines: a gradient on a straight line has a zero-width box and disappears. */}
      <Rect x={x - 5.5} y={y} width={11} height={length} rx={5.5} fill={fill(skin)} />
      <Circle cx={x} cy={y + length} r={7.5} fill={fill(skin)} />
      <Circle cx={x} cy={y + 3} r={9.5} fill={fill(sleeve)} />
    </G>
  );
}

type FaceProps = {
  /** Face centre. */
  cx: number;
  cy: number;
  expression: Expression;
  skin: ArtToneName;
  parts: CharacterProps['parts'];
};

const EYE_DX = 14;
const EYE_DY = 2;
const MOUTH_DY = 19;

export function faceRig(cx: number, cy: number) {
  return { eyes: { x: cx, y: cy + EYE_DY }, mouth: { x: cx, y: cy + MOUTH_DY } };
}

function Eyes({ cx, cy, expression }: { cx: number; cy: number; expression: Expression }) {
  const y = cy + EYE_DY;
  if (expression === 'happy') {
    // Closed, smiling eyes.
    return (
      <G>
        {[-1, 1].map((s) => (
          <Path
            key={s}
            d={`M${cx + s * EYE_DX - 6} ${y + 2} Q${cx + s * EYE_DX} ${y - 6} ${cx + s * EYE_DX + 6} ${y + 2}`}
            stroke={ink}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </G>
    );
  }
  // Sad looks down a little; the eyebrows do most of the work.
  const look = expression === 'sad' ? 2 : 0;
  return (
    <G>
      {[-1, 1].map((s) => (
        <G key={s}>
          <Ellipse cx={cx + s * EYE_DX} cy={y + look} rx={4.6} ry={5.4} fill={ink} />
          <Circle cx={cx + s * EYE_DX - 1.5} cy={y + look - 2} r={1.7} fill={gloss} />
        </G>
      ))}
    </G>
  );
}

function Mouth({ cx, cy, expression }: { cx: number; cy: number; expression: Expression }) {
  const y = cy + MOUTH_DY;
  switch (expression) {
    case 'happy':
      return (
        <G>
          <Path
            d={`M${cx - 11} ${y - 3} Q${cx} ${y - 1} ${cx + 11} ${y - 3} Q${cx + 9} ${y + 11} ${cx} ${y + 11} Q${cx - 9} ${y + 11} ${cx - 11} ${y - 3} Z`}
            fill={mouthColor}
          />
          <Ellipse cx={cx} cy={y + 7.5} rx={5.5} ry={3} fill={tongue} />
        </G>
      );
    case 'talking':
      return (
        <G>
          <Ellipse cx={cx} cy={y + 2} rx={6} ry={7} fill={mouthColor} />
          <Ellipse cx={cx} cy={y + 6} rx={3.8} ry={2.4} fill={tongue} />
        </G>
      );
    case 'sad':
      return (
        <Path
          d={`M${cx - 6} ${y + 4} Q${cx} ${y - 1} ${cx + 6} ${y + 4}`}
          stroke={mouthColor}
          strokeWidth={3.2}
          strokeLinecap="round"
          fill="none"
        />
      );
    default:
      return (
        <Path
          d={`M${cx - 9} ${y - 1} Q${cx} ${y + 8} ${cx + 9} ${y - 1}`}
          stroke={mouthColor}
          strokeWidth={3.4}
          strokeLinecap="round"
          fill="none"
        />
      );
  }
}

/** Eyes, brows (sad only), nose shading, cheeks and mouth, the same on all three. */
export function Face({ cx, cy, expression, skin, parts }: FaceProps) {
  const shade = artPalette.tones[skin].shade;
  return (
    <G>
      {expression === 'sad' ? (
        <Path
          d={`M${cx - EYE_DX - 6} ${cy - 8} L${cx - EYE_DX + 5} ${cy - 11} M${cx + EYE_DX + 6} ${cy - 8} L${cx + EYE_DX - 5} ${cy - 11}`}
          stroke={ink}
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={0.75}
        />
      ) : null}
      <Part name="eyes" parts={parts}>
        <Eyes cx={cx} cy={cy} expression={expression} />
      </Part>
      <Ellipse cx={cx} cy={cy + 10} rx={3.4} ry={2.2} fill={shade} opacity={0.45} />
      <G opacity={0.55}>
        <Ellipse cx={cx - 23} cy={cy + 12} rx={6.5} ry={4} fill={cheek} />
        <Ellipse cx={cx + 23} cy={cy + 12} rx={6.5} ry={4} fill={cheek} />
      </G>
      <Part name="mouth" parts={parts}>
        <Mouth cx={cx} cy={cy} expression={expression} />
      </Part>
    </G>
  );
}

/** Rounded shoe seen from the front. */
export function Shoe({ cx, tone, fill }: { cx: number; tone: ArtToneName; fill: ClayFill }) {
  return <Ellipse cx={cx} cy={FEET_Y - 6} rx={11} ry={7} fill={fill(tone)} />;
}

/** Short skin-coloured leg from the hem down to the shoe. */
export function Leg({
  cx,
  top,
  skin,
  fill,
}: {
  cx: number;
  top: number;
  skin: ArtToneName;
  fill: ClayFill;
}) {
  return <Rect x={cx - 5} y={top} width={10} height={FEET_Y - 8 - top} rx={5} fill={fill(skin)} />;
}
