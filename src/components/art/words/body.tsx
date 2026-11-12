import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette } from '@/theme/artPalette';

import { Gloss } from '../clay';
import { CHARACTER_BOX, Nehir, type Expression } from '../characters';
import { NEHIR_RIG } from '../characters/Nehir';
import { WORD_ART_SIZE, WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Body words (2–7). Decision (LNG-31): a body part is shown on Nehir with a
// highlight ring, so children see it on a whole person. Parts that are too
// small on the figure or hidden (fingers, toes inside shoes, teeth, tongue,
// the back) get their own clay close-up instead.

const { ink, mouth: mouthColor, tongue: tongueColor } = artPalette;
const RING = artPalette.tones.berry.face;
const RING_EDGE = artPalette.tones.cream.light;

/** The head-and-shoulders crop of Nehir (same square as `framing="portrait"`). */
const PORTRAIT = { x: 46, y: 42, width: 108, height: 108 };
const FULL = { x: 0, y: 0, ...CHARACTER_BOX };

type Ring = { cx: number; cy: number; rx: number; ry?: number; rotate?: number };

type OnNehirProps = {
  size: number;
  framing: 'full' | 'portrait';
  expression?: Expression;
  ring: Ring;
  /** Drawn under the ring, in Nehir's coordinates (e.g. eyebrows). */
  extra?: (strokeWidth: number) => ReactNode;
};

/** Nehir with a ring around one body part, centred in a square word card. */
function OnNehir({ size, framing, expression = 'idle', ring, extra }: OnNehirProps) {
  const view = framing === 'portrait' ? PORTRAIT : FULL;
  const width = (size * view.width) / view.height;
  // Stroke widths follow the zoom so the ring looks the same in both framings.
  const stroke = view.height * 0.024;
  const { cx, cy, rx, ry = rx, rotate = 0 } = ring;
  return (
    <View style={[styles.square, { width: size, height: size }]}>
      <View style={{ width, height: size }}>
        <Nehir size={size} framing={framing} expression={expression} />
        <Svg
          style={StyleSheet.absoluteFill}
          width={width}
          height={size}
          viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          accessible={false}
          pointerEvents="none"
        >
          {extra?.(stroke)}
          <G transform={`rotate(${rotate} ${cx} ${cy})`}>
            <Ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={RING_EDGE}
              strokeWidth={stroke * 2}
            />
            <Ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="none"
              stroke={RING}
              strokeWidth={stroke}
            />
          </G>
        </Svg>
      </View>
    </View>
  );
}

const { neck, shoulderRight } = NEHIR_RIG;
// Right arm (viewer's right) hangs 14° outwards from the shoulder (ARM_POSES.idle).
const ARM_TILT = -14;
const elbow = { x: shoulderRight.x + 4.4, y: shoulderRight.y + 17.5 };
const hand = { x: shoulderRight.x + 8.7, y: shoulderRight.y + 35 };

function onNehir(
  framing: 'full' | 'portrait',
  ring: Ring,
  options: { expression?: Expression; extra?: OnNehirProps['extra'] } = {},
) {
  function BodyPart({ size = WORD_ART_SIZE }: WordArtProps) {
    return <OnNehir size={size} framing={framing} ring={ring} {...options} />;
  }
  return BodyPart;
}

/** Calm eyebrows (the character drawing has them only when sad). */
function Brows({ strokeWidth }: { strokeWidth: number }) {
  return (
    <Path
      d="M79 97 Q86 93 93 97 M107 97 Q114 93 121 97"
      stroke={ink}
      strokeWidth={strokeWidth * 1.3}
      strokeLinecap="round"
      fill="none"
    />
  );
}

/** Open hand, palm towards us; the index finger is ringed. */
function Finger({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['nehirSkin']} shadowWidth={22}>
      {(fill) => (
        <G>
          {/* Thumb, then four fingers, then the palm on top so the joins are hidden. */}
          <Rect
            x={18}
            y={48}
            width={11}
            height={26}
            rx={5.5}
            fill={fill('nehirSkin')}
            transform="rotate(-40 23 66)"
          />
          <Rect x={30} y={22} width={11} height={36} rx={5.5} fill={fill('nehirSkin')} />
          <Rect x={43} y={16} width={11} height={40} rx={5.5} fill={fill('nehirSkin')} />
          <Rect x={56} y={20} width={11} height={36} rx={5.5} fill={fill('nehirSkin')} />
          <Rect x={68} y={30} width={10} height={30} rx={5} fill={fill('nehirSkin')} />
          <Path
            d="M28 52 C28 46 34 44 50 44 C66 44 78 46 78 54 L78 72 C78 84 68 90 52 90 C36 90 28 84 28 72 Z"
            fill={fill('nehirSkin')}
          />
          <Gloss cx={38} cy={58} rx={6} ry={3.5} />
          <Gloss cx={34} cy={28} rx={3} ry={2} rotate={-60} />
          <Ellipse
            cx={35.5}
            cy={36}
            rx={10}
            ry={17}
            fill="none"
            stroke={RING_EDGE}
            strokeWidth={4.4}
          />
          <Ellipse cx={35.5} cy={36} rx={10} ry={17} fill="none" stroke={RING} strokeWidth={2.2} />
        </G>
      )}
    </WordCanvas>
  );
}

/** Bare foot seen from above; the big toe is ringed. */
function Toe({ size }: WordArtProps) {
  const toes = [
    { cx: 38, cy: 26, r: 8 },
    { cx: 50, cy: 22, r: 5.6 },
    { cx: 60, cy: 24, r: 5 },
    { cx: 68, cy: 29, r: 4.4 },
    { cx: 74, cy: 36, r: 4 },
  ];
  return (
    <WordCanvas size={size} tones={['nehirSkin']} shadowWidth={24}>
      {(fill) => (
        <G>
          <Path
            d="M30 40 C30 28 44 26 58 28 C72 30 80 38 78 52 C76 64 70 70 68 80 C66 88 60 92 52 92 C40 92 34 84 34 72 C34 60 30 52 30 40 Z"
            fill={fill('nehirSkin')}
          />
          {toes.map((t) => (
            <Circle key={t.cx} cx={t.cx} cy={t.cy} r={t.r} fill={fill('nehirSkin')} />
          ))}
          <Gloss cx={42} cy={50} rx={6} ry={3.5} />
          <Gloss cx={35} cy={22} rx={2.6} ry={1.6} />
          <Circle cx={38} cy={26} r={12} fill="none" stroke={RING_EDGE} strokeWidth={4.4} />
          <Circle cx={38} cy={26} r={12} fill="none" stroke={RING} strokeWidth={2.2} />
        </G>
      )}
    </WordCanvas>
  );
}

/** Big smiling mouth, close up: lips, teeth and tongue. */
function OpenMouth({
  fill,
  tongueOut,
}: {
  fill: (tone: 'pink' | 'cream') => string;
  tongueOut: boolean;
}) {
  return (
    <G>
      {/* Lips, then the dark inside, then teeth and tongue. */}
      <Path d="M14 44 Q50 34 86 44 Q80 84 50 86 Q20 84 14 44 Z" fill={fill('pink')} />
      <Path d="M22 48 Q50 42 78 48 Q72 76 50 78 Q28 76 22 48 Z" fill={mouthColor} />
      {[30, 40, 50, 60].map((x) => (
        <Rect key={x} x={x} y={47} width={9.4} height={10} rx={2.6} fill={fill('cream')} />
      ))}
      {tongueOut ? (
        <Path d="M36 66 Q50 58 64 66 L64 82 Q64 94 50 94 Q36 94 36 82 Z" fill={tongueColor} />
      ) : (
        <Ellipse cx={50} cy={70} rx={14} ry={6} fill={tongueColor} />
      )}
      <Gloss cx={30} cy={44} rx={6} ry={2.4} rotate={-10} />
    </G>
  );
}

function Tooth({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['pink', 'cream']} shadowWidth={26}>
      {(fill) => (
        <G>
          <OpenMouth fill={fill} tongueOut={false} />
          <Rect
            x={46}
            y={42}
            width={17.4}
            height={20}
            rx={6}
            fill="none"
            stroke={RING_EDGE}
            strokeWidth={4.4}
          />
          <Rect
            x={46}
            y={42}
            width={17.4}
            height={20}
            rx={6}
            fill="none"
            stroke={RING}
            strokeWidth={2.2}
          />
        </G>
      )}
    </WordCanvas>
  );
}

function Tongue({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['pink', 'cream']} shadowWidth={26}>
      {(fill) => (
        <G>
          <OpenMouth fill={fill} tongueOut />
          <Ellipse
            cx={50}
            cy={80}
            rx={18}
            ry={16}
            fill="none"
            stroke={RING_EDGE}
            strokeWidth={4.4}
          />
          <Ellipse cx={50} cy={80} rx={18} ry={16} fill="none" stroke={RING} strokeWidth={2.2} />
        </G>
      )}
    </WordCanvas>
  );
}

/** Nehir seen from behind (buns, overall straps crossing); the back is ringed. */
function Back({ size }: WordArtProps) {
  return (
    <WordCanvas
      size={size}
      tones={['nehirSkin', 'nehirHair', 'sky', 'mint', 'charcoal']}
      shadowWidth={20}
    >
      {(fill) => (
        <G>
          <Ellipse cx={42} cy={88} rx={7} ry={4.5} fill={fill('charcoal')} />
          <Ellipse cx={58} cy={88} rx={7} ry={4.5} fill={fill('charcoal')} />
          <Rect
            x={23}
            y={52}
            width={7}
            height={22}
            rx={3.5}
            fill={fill('nehirSkin')}
            transform="rotate(12 26 52)"
          />
          <Rect
            x={70}
            y={52}
            width={7}
            height={22}
            rx={3.5}
            fill={fill('nehirSkin')}
            transform="rotate(-12 74 52)"
          />
          {/* T-shirt and overalls from behind; the straps cross on the back. */}
          <Path
            d="M36 46 C28 46 26 50 26 56 L26 72 L74 72 L74 56 C74 50 72 46 64 46 Z"
            fill={fill('sky')}
          />
          <Path d="M30 64 L70 64 L72 86 L54 86 L50 78 L46 86 L28 86 Z" fill={fill('mint')} />
          <Path
            d="M34 48 L64 66 M66 48 L36 66"
            stroke={artPalette.tones.mint.face}
            strokeWidth={4.2}
            strokeLinecap="round"
          />
          <Circle cx={23} cy={18} r={9} fill={fill('nehirHair')} />
          <Circle cx={77} cy={18} r={9} fill={fill('nehirHair')} />
          <Ellipse cx={50} cy={30} rx={22} ry={20} fill={fill('nehirHair')} />
          <Gloss cx={40} cy={20} rx={6} ry={3.5} opacity={0.35} />
          <Ellipse
            cx={50}
            cy={60}
            rx={21}
            ry={12}
            fill="none"
            stroke={RING_EDGE}
            strokeWidth={4.4}
          />
          <Ellipse cx={50} cy={60} rx={21} ry={12} fill="none" stroke={RING} strokeWidth={2.2} />
        </G>
      )}
    </WordCanvas>
  );
}

export const bodyArt = {
  // The whole figure.
  'body.head': onNehir('full', { cx: 100, cy: 92, rx: 54, ry: 52 }),
  'body.neck': onNehir('full', { cx: neck.x, cy: neck.y, rx: 13, ry: 8 }),
  'body.shoulder': onNehir('full', { cx: shoulderRight.x, cy: shoulderRight.y, rx: 13 }),
  'body.arm': onNehir('full', {
    cx: elbow.x,
    cy: elbow.y,
    rx: 12,
    ry: 27,
    rotate: ARM_TILT,
  }),
  'body.elbow': onNehir('full', { cx: elbow.x, cy: elbow.y, rx: 10 }),
  'body.hand': onNehir('full', { cx: hand.x, cy: hand.y, rx: 12 }),
  'body.tummy': onNehir('full', { cx: 100, cy: 184, rx: 22, ry: 16 }),
  'body.leg': onNehir('full', { cx: 116, cy: 210, rx: 14, ry: 24 }),
  'body.knee': onNehir('full', { cx: 116, cy: 208, rx: 11 }),
  'body.foot': onNehir('full', { cx: 113, cy: 231, rx: 16, ry: 11 }),
  // The head, close up.
  'body.hair': onNehir('portrait', { cx: 100, cy: 80, rx: 52, ry: 28 }),
  'body.face': onNehir('portrait', { cx: 100, cy: 112, rx: 41, ry: 39 }),
  'body.eye': onNehir('portrait', { cx: 114, cy: 108, rx: 9.5 }),
  'body.eyebrow': onNehir(
    'portrait',
    { cx: 114, cy: 95, rx: 11, ry: 7 },
    { extra: (strokeWidth) => <Brows strokeWidth={strokeWidth} /> },
  ),
  'body.ear': onNehir('portrait', { cx: 137, cy: 112, rx: 10.5 }),
  'body.nose': onNehir('portrait', { cx: 100, cy: 116, rx: 7.5 }),
  'body.cheek': onNehir('portrait', { cx: 123, cy: 118, rx: 10, ry: 8 }),
  'body.mouth': onNehir('portrait', { cx: 100, cy: 129, rx: 15, ry: 11 }, { expression: 'happy' }),
  'body.lips': onNehir('portrait', { cx: 100, cy: 127, rx: 14, ry: 8 }),
  'body.chin': onNehir('portrait', { cx: 100, cy: 139, rx: 13, ry: 7 }),
  // Close-ups of parts that are tiny or hidden on the figure.
  'body.finger': Finger,
  'body.toe': Toe,
  'body.tooth': Tooth,
  'body.tongue': Tongue,
  'body.back': Back,
} satisfies WordArtMap;

const styles = StyleSheet.create({
  square: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
