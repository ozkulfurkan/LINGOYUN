import { useId, type ReactNode } from 'react';
import {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Vehicle and road words of the 2–7 mode, drawn like the pilot car and bus
// (vehicles.tsx): clay shapes lit from the top left, a gloss, the shared ground
// shadow, no outlines. Road vehicles are seen from the side and drive right,
// like the pilot. Things that fly (plane, helicopter, rocket, balloon) float
// above a narrow shadow. Look-alikes are told apart by silhouette first:
//   taxi (pilot car shape, yellow, chequered roof sign and side band) vs police
//   car (white with a navy lower half, blue-red light bar) vs ambulance (tall
//   white van, red band, plus sign) vs fire truck (long red truck with a ladder);
//   truck (cab + windowless container) vs tractor (one huge rear wheel, green);
//   train (steam locomotive: chimney, smoke, rails) vs tram (pantograph on an
//   overhead wire, rails in the street) vs subway (front view out of a tunnel);
//   boat (small rowboat with oars) vs ship (long hull, decks, two funnels) vs
//   submarine (yellow, periscope, under the water);
//   bicycle (thin ring wheels, open frame) vs motorcycle (fat wheels, engine);
//   sled (curled runners on snow) vs skateboard (deck with kicktails on wheels).
// The ambulance plus is blue on purpose: a red cross / crescent is a protected
// emblem, so a neutral plus is used.

const { gloss } = artPalette;
const T = artPalette.tones;

/** Mixes two hex colours; `t` = 0 gives `a`, 1 gives `b`. */
function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) =>
    Math.round(channel(a, i) * (1 - t) + channel(b, i) * t)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${out.join('').toUpperCase()}`;
}

function mixTone(a: ClayTone, b: ClayTone, t: number): ClayTone {
  return {
    light: mix(a.light, b.light, t),
    face: mix(a.face, b.face, t),
    shade: mix(a.shade, b.shade, t),
  };
}

const leafTone = mixTone(T.mint, T.lemon, 0.3);

// Extra tones this group needs, derived from the art palette so they stay in
// the same family. Kept here (not in artPalette) until another group needs them.
const carTones = {
  /** White vehicles: cooler than the cream cards, so they do not melt into them. */
  white: { light: T.cream.light, face: mix(T.cream.face, T.grey.light, 0.6), shade: T.grey.face },
  /** Police navy: the deep end of sky. */
  navy: {
    light: T.sky.face,
    face: mix(T.sky.shade, T.charcoal.face, 0.45),
    shade: mix(T.sky.shade, T.charcoal.shade, 0.7),
  },
  /** Tractor green: mint pulled towards yellow (same as the leaves of outdoors). */
  leaf: leafTone,
  /** Meadow under the road. */
  meadow: leafTone,
  /** Pines by the road. */
  pine: {
    light: leafTone.face,
    face: leafTone.shade,
    shade: mix(leafTone.shade, T.charcoal.face, 0.35),
  },
  /** Asphalt: grey pulled towards charcoal. */
  asphalt: mixTone(T.grey, T.charcoal, 0.55),
  /** Deep water. */
  ocean: { light: T.sky.face, face: T.sky.shade, shade: mix(T.sky.shade, T.charcoal.face, 0.35) },
  /** Tunnel stone: grey warmed with tan. */
  stone: mixTone(T.grey, T.tan, 0.25),
  /** Rocket flame. */
  flame: { light: T.lemon.face, face: T.orange.face, shade: T.terracotta.face },
  /** Snow under the sled. */
  snow: { light: T.cream.light, face: mix(T.cream.face, T.grey.light, 0.6), shade: T.grey.face },
  /** Traffic light lamps that are off: the colour sunk into charcoal. */
  redOff: mixTone(T.red, T.charcoal, 0.62),
  lemonOff: mixTone(T.lemon, T.charcoal, 0.62),
} satisfies Record<string, ClayTone>;

type CarToneName = keyof typeof carTones;
type Tone = ArtToneName | CarToneName;
type Fill = (tone: Tone) => string;

const isCar = (tone: Tone): tone is CarToneName => Object.hasOwn(carTones, tone);

/** Flat colour of a tone (for stripes, rails, rods). */
const flat = (tone: Tone, stop: keyof ClayTone = 'face') =>
  isCar(tone) ? carTones[tone][stop] : T[tone][stop];

/** WordCanvas that also knows the derived tones; `ref(name)` makes unique clip ids. */
function CarCanvas({
  size,
  tones,
  shadowWidth,
  children,
}: {
  size?: number;
  tones: readonly Tone[];
  shadowWidth?: number;
  children: (fill: Fill, ref: (name: string) => string) => ReactNode;
}) {
  const prefix = `t${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const base = tones.filter((t): t is ArtToneName => !isCar(t));
  const extra = tones.filter(isCar);
  const ref = (name: string) => `${prefix}-${name}`;
  return (
    <WordCanvas size={size} tones={base} shadowWidth={shadowWidth}>
      {(baseFill) => (
        <>
          {extra.length > 0 ? (
            <Defs>
              {extra.map((t) => (
                <ClayGradient key={t} id={ref(t)} tone={carTones[t]} />
              ))}
            </Defs>
          ) : null}
          {children((t) => (isCar(t) ? `url(#${ref(t)})` : baseFill(t)), ref)}
        </>
      )}
    </WordCanvas>
  );
}

// ---------------------------------------------------------------- shared shapes

/** Pilot wheel: dark tyre, light hub. */
function Wheel({
  cx,
  cy,
  r,
  fill,
  hub = 'cream',
}: {
  cx: number;
  cy: number;
  r: number;
  fill: Fill;
  hub?: Tone;
}) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={fill('charcoal')} />
      <Circle cx={cx} cy={cy} r={r * 0.42} fill={fill(hub)} />
    </G>
  );
}

/** The pilot car's cabin and body, so taxi and police car share its silhouette. */
const CAR_ROOF = 'M26 50 C28 30 36 24 50 24 C64 24 70 30 76 50 Z';
const CAR_BODY = { x: 8, y: 46, width: 84, height: 32, rx: 14 };
const CAR_WINDOWS = [
  'M32 47 C33 35 38 31 47 31 L47 47 Z',
  'M53 47 L53 31 C61 31 66 35 69 47 Z',
] as const;

/** Truck cab (front at the right), shared by the truck and the fire truck. */
const CAB = 'M68 80 L68 38 Q68 32 74 32 L83 32 C87 32 89 34 91 40 L94 50 L94 74 Q94 80 88 80 Z';
const CAB_WINDOW = 'M74 38 L83 38 C85 38 86 40 87 44 L89 52 L74 52 Z';

/** One row of round wave crests from x0 to x1, top at y. */
const waves = (x0: number, x1: number, y: number, r: number, bottom: number) => {
  const n = Math.round((x1 - x0) / (2 * r));
  const step = (x1 - x0) / n;
  let d = `M${x0} ${bottom} L${x0} ${y}`;
  for (let i = 0; i < n; i += 1) d += ` a${step / 2} ${r} 0 0 1 ${step} 0`;
  return `${d} L${x1} ${bottom} Z`;
};

/** A rail line with sleepers along the ground. */
function Rails({ y, x0 = 4, x1 = 96 }: { y: number; x0?: number; x1?: number }) {
  const sleepers = [];
  for (let x = x0 + 4; x < x1; x += 9) sleepers.push(x);
  return (
    <G>
      {sleepers.map((x) => (
        <Rect key={x} x={x} y={y - 1} width={5} height={3} rx={1} fill={T.brown.face} />
      ))}
      <Rect x={x0} y={y - 2} width={x1 - x0} height={2} rx={1} fill={T.grey.shade} />
    </G>
  );
}

// ---------------------------------------------------------------- cars

/** Taxi: the pilot car in Turkish taxi yellow, chequered roof sign and side band. */
function Taxi({ size }: WordArtProps) {
  const checks = (x: number, y: number, cols: number, s: number) =>
    Array.from({ length: cols * 2 }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return (col + row) % 2 === 0 ? (
        <Rect key={i} x={x + col * s} y={y + row * s} width={s} height={s} fill={T.charcoal.face} />
      ) : null;
    });
  return (
    <CarCanvas
      size={size}
      tones={['lemon', 'glass', 'charcoal', 'cream', 'orange', 'red']}
      shadowWidth={40}
    >
      {(fill) => (
        <>
          {/* Roof sign: a cream lamp with a chequered face instead of text. */}
          <Rect x={40} y={14} width={20} height={11} rx={3.5} fill={fill('cream')} />
          {checks(42, 16.5, 8, 2)}
          <Path d={CAR_ROOF} fill={fill('lemon')} />
          <Rect {...CAR_BODY} fill={fill('lemon')} />
          {CAR_WINDOWS.map((d) => (
            <Path key={d} d={d} fill={fill('glass')} />
          ))}
          <Rect x={11} y={57} width={78} height={7} fill={T.cream.face} />
          {checks(11, 57, 22, 3.5)}
          <Rect x={86} y={50} width={7} height={6} rx={3} fill={fill('cream')} />
          <Rect x={7} y={50} width={5} height={6} rx={2.5} fill={fill('red')} />
          <Wheel cx={29} cy={78} r={12} fill={fill} />
          <Wheel cx={71} cy={78} r={12} fill={fill} />
          <Gloss cx={40} cy={28} rx={7} ry={2.8} rotate={-12} />
          <Gloss cx={20} cy={50} rx={8} ry={2.6} rotate={-8} />
        </>
      )}
    </CarCanvas>
  );
}

/** Police car: the pilot car shape, white on top, navy below, a blue-red light bar. */
function PoliceCar({ size }: WordArtProps) {
  return (
    <CarCanvas
      size={size}
      tones={['white', 'navy', 'glass', 'charcoal', 'cream', 'sky', 'red', 'lemon']}
      shadowWidth={40}
    >
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('body')}>
              <Rect {...CAR_BODY} />
            </ClipPath>
          </Defs>
          {/* Light bar: blue half and red half on a dark base. */}
          <Rect x={37} y={21} width={26} height={5} rx={2.5} fill={fill('charcoal')} />
          <Rect x={38} y={14} width={12} height={9} rx={4} fill={fill('sky')} />
          <Rect x={50} y={14} width={12} height={9} rx={4} fill={fill('red')} />
          <Path d={CAR_ROOF} fill={fill('white')} />
          <Rect {...CAR_BODY} fill={fill('white')} />
          <G clipPath={`url(#${ref('body')})`}>
            <Rect x={0} y={60} width={100} height={30} fill={fill('navy')} />
            <Rect x={0} y={57} width={100} height={3} fill={flat('sky')} />
          </G>
          {CAR_WINDOWS.map((d) => (
            <Path key={d} d={d} fill={fill('glass')} />
          ))}
          <Rect x={86} y={50} width={7} height={6} rx={3} fill={fill('lemon')} />
          <Rect x={7} y={50} width={5} height={6} rx={2.5} fill={fill('red')} />
          <Wheel cx={29} cy={78} r={12} fill={fill} />
          <Wheel cx={71} cy={78} r={12} fill={fill} />
          <Gloss cx={40} cy={28} rx={7} ry={2.8} rotate={-12} />
          <Gloss cx={20} cy={51} rx={8} ry={2.6} rotate={-8} />
          <Gloss cx={40} cy={16} rx={2.6} ry={1.4} rotate={0} />
        </>
      )}
    </CarCanvas>
  );
}

/** Ambulance: a tall white van with a red band, a blue plus and a lamp on the roof. */
function Ambulance({ size }: WordArtProps) {
  const body =
    'M6 30 Q6 22 14 22 L64 22 C70 22 73 24 75 30 L80 44 L88 46 C92 47 94 50 94 56 L94 72 Q94 80 86 80 L14 80 Q6 80 6 72 Z';
  return (
    <CarCanvas
      size={size}
      tones={['white', 'red', 'sky', 'glass', 'charcoal', 'cream', 'lemon']}
      shadowWidth={42}
    >
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('body')}>
              <Path d={body} />
            </ClipPath>
          </Defs>
          <Rect x={22} y={14} width={14} height={10} rx={4} fill={fill('red')} />
          <Path d={body} fill={fill('white')} />
          <G clipPath={`url(#${ref('body')})`}>
            <Rect x={0} y={58} width={100} height={7} fill={fill('red')} />
          </G>
          <Path d="M58 30 L69 30 C71 30 72 31 73 33 L77 44 L58 44 Z" fill={fill('glass')} />
          {/* Neutral blue plus (not the protected red cross / crescent). */}
          <Path
            d="M28 30 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 v-8 h8 Z"
            fill={fill('sky')}
            stroke={fill('sky')}
            strokeWidth={2.4}
            strokeLinejoin="round"
          />
          <Rect x={52} y={48} width={1.6} height={30} fill={T.grey.face} />
          <Rect x={88} y={52} width={6} height={6} rx={3} fill={fill('lemon')} />
          <Wheel cx={24} cy={80} r={11} fill={fill} />
          <Wheel cx={74} cy={80} r={11} fill={fill} />
          <Gloss cx={20} cy={26} rx={9} ry={2.4} rotate={-4} />
          <Gloss cx={26} cy={16} rx={2.6} ry={1.4} rotate={0} />
        </>
      )}
    </CarCanvas>
  );
}

/** Fire truck: long and red, a ladder on top, roller shutters, a blue lamp. */
function FireTruck({ size }: WordArtProps) {
  const rungs: number[] = [];
  for (let x = 12; x <= 64; x += 7) rungs.push(x);
  return (
    <CarCanvas
      size={size}
      tones={['red', 'glass', 'charcoal', 'cream', 'sky', 'lemon', 'grey']}
      shadowWidth={44}
    >
      {(fill) => (
        <>
          <Rect x={74} y={25} width={10} height={9} rx={4} fill={fill('sky')} />
          <Path d={CAB} fill={fill('red')} />
          <Rect x={6} y={44} width={66} height={36} rx={8} fill={fill('red')} />
          <Path d={CAB_WINDOW} fill={fill('glass')} />
          {/* Roller shutters of the lockers. */}
          {[12, 32, 52].map((x) => (
            <G key={x}>
              <Rect x={x} y={50} width={15} height={16} rx={3} fill={flat('red', 'shade')} />
              {[54, 58, 62].map((y) => (
                <Rect key={y} x={x + 2} y={y} width={11} height={1.2} fill={flat('red')} />
              ))}
            </G>
          ))}
          <Rect x={6} y={68} width={88} height={4} fill={fill('cream')} />
          {/* Ladder resting on the roof. */}
          <Rect x={58} y={38} width={4} height={7} fill={T.grey.shade} />
          <Rect x={16} y={38} width={4} height={7} fill={T.grey.shade} />
          {rungs.map((x) => (
            <Rect key={x} x={x} y={31} width={2.4} height={8} fill={T.grey.face} />
          ))}
          <Rect x={6} y={29} width={68} height={3.4} rx={1.7} fill={fill('grey')} />
          <Rect x={6} y={37.5} width={68} height={3.4} rx={1.7} fill={fill('grey')} />
          <Rect x={88} y={56} width={6} height={6} rx={3} fill={fill('lemon')} />
          <Wheel cx={20} cy={81} r={10} fill={fill} />
          <Wheel cx={42} cy={81} r={10} fill={fill} />
          <Wheel cx={80} cy={81} r={10} fill={fill} />
          <Gloss cx={18} cy={48} rx={8} ry={2.2} rotate={-4} />
          <Gloss cx={77} cy={35} rx={3} ry={1.6} rotate={-10} />
        </>
      )}
    </CarCanvas>
  );
}

/** Truck: an orange cab pulling a tall, windowless blue container. */
function Truck({ size }: WordArtProps) {
  return (
    <CarCanvas
      size={size}
      tones={['orange', 'sky', 'glass', 'charcoal', 'cream', 'lemon']}
      shadowWidth={44}
    >
      {(fill) => (
        <>
          <Rect x={6} y={70} width={88} height={7} rx={3} fill={fill('charcoal')} />
          <Path d={CAB} fill={fill('orange')} />
          <Path d={CAB_WINDOW} fill={fill('glass')} />
          <Rect x={6} y={20} width={60} height={52} rx={7} fill={fill('sky')} />
          {[18, 30, 42, 54].map((x) => (
            <Rect key={x} x={x} y={26} width={2} height={40} rx={1} fill={flat('sky', 'shade')} />
          ))}
          <Rect x={88} y={56} width={6} height={6} rx={3} fill={fill('lemon')} />
          <Rect x={70} y={60} width={10} height={2} rx={1} fill={flat('orange', 'shade')} />
          <Wheel cx={20} cy={81} r={10} fill={fill} />
          <Wheel cx={42} cy={81} r={10} fill={fill} />
          <Wheel cx={80} cy={81} r={10} fill={fill} />
          <Gloss cx={20} cy={24} rx={10} ry={2.6} rotate={-4} />
          <Gloss cx={77} cy={35} rx={3} ry={1.6} rotate={-10} />
        </>
      )}
    </CarCanvas>
  );
}

/** Tractor: green, a huge rear wheel with a knobbly tyre, a small front wheel. */
function Tractor({ size }: WordArtProps) {
  const knobs = Array.from({ length: 14 }, (_, i) => (360 / 14) * i);
  return (
    <CarCanvas size={size} tones={['leaf', 'glass', 'charcoal', 'lemon', 'grey']} shadowWidth={42}>
      {(fill) => (
        <>
          <Rect x={70} y={28} width={4.5} height={22} rx={2} fill={fill('charcoal')} />
          <Rect x={18} y={16} width={40} height={7} rx={3.5} fill={fill('leaf')} />
          <Rect x={23} y={20} width={4} height={30} fill={flat('leaf', 'shade')} />
          <Rect x={50} y={20} width={4} height={30} fill={flat('leaf', 'shade')} />
          <Path d="M26 22 L52 22 L52 48 L26 48 Z" fill={fill('glass')} />
          <Rect x={20} y={46} width={40} height={20} rx={6} fill={fill('leaf')} />
          <Rect x={48} y={46} width={44} height={24} rx={8} fill={fill('leaf')} />
          {[56, 62, 68].map((y) => (
            <Rect key={y} x={84} y={y} width={6} height={2} rx={1} fill={flat('leaf', 'shade')} />
          ))}
          <Rect x={86} y={49} width={6} height={6} rx={3} fill={fill('lemon')} />
          {/* Rear wheel with tread knobs, and its mudguard. */}
          {knobs.map((a) => (
            <Rect
              key={a}
              x={32}
              y={45}
              width={6}
              height={6}
              rx={1.6}
              fill={T.charcoal.face}
              transform={`rotate(${a} 35 70)`}
            />
          ))}
          <Wheel cx={35} cy={70} r={21} fill={fill} hub="lemon" />
          <Circle cx={35} cy={70} r={3} fill={flat('lemon', 'shade')} />
          <Path
            d="M10 64 A26 26 0 0 1 60 64"
            stroke={fill('leaf')}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
          <Wheel cx={78} cy={80} r={12} fill={fill} hub="lemon" />
          <Gloss cx={30} cy={18} rx={8} ry={2.2} rotate={-4} />
          <Gloss cx={60} cy={50} rx={7} ry={2.4} rotate={-6} />
        </>
      )}
    </CarCanvas>
  );
}

// ---------------------------------------------------------------- rails

/** Train: a steam locomotive with a chimney and puffs of smoke, on rails. */
function Train({ size }: WordArtProps) {
  return (
    <CarCanvas
      size={size}
      tones={['red', 'charcoal', 'glass', 'lemon', 'cream', 'snow', 'grey']}
      shadowWidth={44}
    >
      {(fill) => (
        <>
          <Rails y={93} />
          <Circle cx={64} cy={10} r={6.5} fill={fill('snow')} />
          <Circle cx={50} cy={7} r={4.5} fill={fill('snow')} />
          <Circle cx={76} cy={14} r={5.5} fill={fill('snow')} />
          <Path d="M70 40 L68 24 L82 24 L80 40 Z" fill={fill('charcoal')} />
          <Rect x={65} y={19} width={20} height={7} rx={3.5} fill={fill('charcoal')} />
          <Rect x={34} y={40} width={52} height={30} rx={13} fill={fill('charcoal')} />
          <Rect x={50} y={40} width={3.4} height={30} fill={flat('red')} />
          <Path d="M50 40 A7 7 0 0 1 64 40 Z" fill={fill('lemon')} />
          <Rect x={8} y={24} width={32} height={48} rx={5} fill={fill('red')} />
          <Rect x={4} y={18} width={40} height={8} rx={4} fill={fill('charcoal')} />
          <Rect x={14} y={31} width={20} height={16} rx={4} fill={fill('glass')} />
          <Rect x={6} y={68} width={82} height={8} rx={3} fill={fill('red')} />
          <Path d="M86 66 L94 84 L86 84 Z" fill={fill('red')} strokeLinejoin="round" />
          <Circle cx={86} cy={48} r={5} fill={fill('lemon')} />
          <Wheel cx={22} cy={80} r={12} fill={fill} />
          <Wheel cx={48} cy={80} r={12} fill={fill} />
          <Wheel cx={74} cy={83} r={9} fill={fill} />
          <Rect x={20} y={78} width={30} height={4} rx={2} fill={fill('grey')} />
          <Gloss cx={18} cy={28} rx={6} ry={2.2} rotate={-8} />
          <Gloss cx={44} cy={46} rx={7} ry={2.4} rotate={-8} opacity={0.4} />
          <Gloss cx={60} cy={7} rx={3} ry={1.6} />
        </>
      )}
    </CarCanvas>
  );
}

/** Tram: Istanbul's red street tram, pantograph touching the overhead wire, rails below. */
function Tram({ size }: WordArtProps) {
  return (
    <CarCanvas
      size={size}
      tones={['red', 'white', 'glass', 'charcoal', 'lemon', 'grey', 'asphalt']}
      shadowWidth={42}
    >
      {(fill) => (
        <>
          {/* Overhead wire and the pantograph reaching up to it. */}
          <Rect x={0} y={8} width={100} height={1.8} fill={T.charcoal.face} />
          <Path
            d="M40 28 L56 18 L46 11"
            stroke={T.charcoal.face}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Rect x={38} y={9.5} width={18} height={2.6} rx={1.3} fill={fill('charcoal')} />
          <Rect x={14} y={26} width={72} height={8} rx={4} fill={fill('grey')} />
          <Rect x={8} y={32} width={84} height={48} rx={10} fill={fill('red')} />
          <Rect x={8} y={36} width={84} height={24} fill={fill('white')} />
          {[14, 30, 46].map((x) => (
            <Rect key={x} x={x} y={39} width={13} height={18} rx={3} fill={fill('glass')} />
          ))}
          <Rect x={63} y={39} width={14} height={36} rx={3} fill={fill('glass')} />
          <Rect x={69.2} y={40} width={1.6} height={34} fill={T.cream.face} />
          <Rect x={81} y={39} width={8} height={18} rx={3} fill={fill('glass')} />
          <Circle cx={88} cy={68} r={3.2} fill={fill('lemon')} />
          <Rect x={18} y={78} width={20} height={6} rx={3} fill={fill('charcoal')} />
          <Rect x={62} y={78} width={20} height={6} rx={3} fill={fill('charcoal')} />
          {[22, 34, 66, 78].map((x) => (
            <Circle key={x} cx={x} cy={86} r={4.5} fill={fill('charcoal')} />
          ))}
          {/* Street with rails set in it. */}
          <Rect x={2} y={89} width={96} height={5} rx={2.5} fill={fill('asphalt')} />
          <Rect x={4} y={90} width={92} height={1.6} rx={0.8} fill={T.grey.light} />
          <Gloss cx={18} cy={37} rx={8} ry={2.2} rotate={-4} />
          <Gloss cx={22} cy={28} rx={6} ry={1.4} rotate={0} opacity={0.4} />
        </>
      )}
    </CarCanvas>
  );
}

/** Subway: a metro train coming at you out of a dark tunnel mouth. */
function Subway({ size }: WordArtProps) {
  const arch = 'M6 92 L6 48 A44 44 0 0 1 94 48 L94 92 Z';
  const mouth = 'M18 92 L18 52 A32 32 0 0 1 82 52 L82 92 Z';
  return (
    <CarCanvas
      size={size}
      tones={['stone', 'charcoal', 'grey', 'glass', 'sky', 'lemon']}
      shadowWidth={46}
    >
      {(fill) => (
        <>
          <Path d={arch} fill={fill('stone')} />
          {/* Arch blocks around the mouth. */}
          {[-70, -35, 0, 35, 70].map((a) => (
            <Rect
              key={a}
              x={49}
              y={8}
              width={2}
              height={10}
              fill={flat('stone', 'shade')}
              transform={`rotate(${a} 50 52)`}
            />
          ))}
          <Path d={mouth} fill={T.charcoal.shade} />
          {/* Rails coming out of the tunnel. */}
          <Path
            d="M40 84 L30 92 M60 84 L70 92"
            stroke={T.grey.face}
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Train front. */}
          <Path
            d="M28 86 L28 46 C28 36 36 30 50 30 C64 30 72 36 72 46 L72 86 Z"
            fill={fill('grey')}
          />
          <Rect x={40} y={34} width={20} height={5} rx={2} fill={fill('lemon')} />
          <Path
            d="M32 46 C32 42 38 41 50 41 C62 41 68 42 68 46 L68 60 L32 60 Z"
            fill={fill('glass')}
          />
          <Rect x={28} y={64} width={44} height={6} fill={fill('sky')} />
          <Circle cx={36} cy={76} r={3.6} fill={fill('lemon')} />
          <Circle cx={64} cy={76} r={3.6} fill={fill('lemon')} />
          <Rect x={30} y={82} width={40} height={5} rx={2} fill={fill('charcoal')} />
          <Gloss cx={24} cy={24} rx={8} ry={3} rotate={-40} />
          <Gloss cx={38} cy={45} rx={4} ry={1.6} rotate={-8} />
        </>
      )}
    </CarCanvas>
  );
}

// ---------------------------------------------------------------- air

/** Plane: a white airliner climbing to the right, red tail and wing. */
function Plane({ size }: WordArtProps) {
  return (
    <CarCanvas size={size} tones={['white', 'red', 'sky', 'grey', 'glass']} shadowWidth={18}>
      {(fill) => (
        <G transform="rotate(-12 52 48)">
          <Path d="M16 46 L10 22 C10 17 16 17 18 21 L32 40 Z" fill={fill('red')} />
          <Path d="M12 50 L30 50 L24 57 L14 56 Z" fill={flat('red', 'shade')} />
          <Path
            d="M14 44 C14 40 18 38 24 38 L78 38 C88 38 95 44 95 50 C95 56 88 60 78 60 L22 60 C16 60 14 56 14 52 Z"
            fill={fill('white')}
          />
          <Path d="M81 42 C87 42 90 45 92 49 L81 49 Z" fill={fill('sky')} />
          {[30, 39, 48, 57, 66].map((x) => (
            <Circle key={x} cx={x} cy={46} r={2.6} fill={fill('sky')} />
          ))}
          <Rect x={14} y={52} width={80} height={3} fill={flat('red')} />
          <Rect x={46} y={60} width={14} height={7} rx={3.5} fill={fill('grey')} />
          <Path d="M42 54 L60 54 L44 80 C42 83 35 83 36 78 Z" fill={fill('red')} />
          <Gloss cx={34} cy={41} rx={14} ry={1.8} rotate={0} />
        </G>
      )}
    </CarCanvas>
  );
}

/** Helicopter: a round mint cabin with a big front window, rotor on top, skids. */
function Helicopter({ size }: WordArtProps) {
  return (
    <CarCanvas size={size} tones={['mint', 'glass', 'charcoal', 'grey', 'lemon']} shadowWidth={20}>
      {(fill) => (
        <>
          <Path d="M40 40 L12 34 C7 33 6 39 10 41 L40 54 Z" fill={fill('mint')} />
          <Path d="M9 36 L5 24 C5 21 9 21 10 24 L16 36 Z" fill={fill('mint')} />
          <Ellipse
            cx={10}
            cy={30}
            rx={2}
            ry={10}
            fill={fill('grey')}
            transform="rotate(30 10 30)"
          />
          <Ellipse
            cx={10}
            cy={30}
            rx={2}
            ry={10}
            fill={fill('grey')}
            transform="rotate(-60 10 30)"
          />
          <Circle cx={10} cy={30} r={2} fill={fill('charcoal')} />
          {/* Skids. */}
          <Path
            d="M44 62 L42 76 M70 62 L72 76"
            stroke={T.charcoal.face}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Path
            d="M32 76 L80 76 C84 76 86 73 86 71"
            stroke={T.charcoal.face}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse cx={58} cy={46} rx={27} ry={20} fill={fill('mint')} />
          <Path d="M62 30 C76 30 85 40 85 50 L62 50 Z" fill={fill('glass')} />
          <Rect x={42} y={50} width={36} height={3} fill={flat('lemon')} />
          <Rect x={55} y={18} width={6} height={10} rx={2} fill={fill('charcoal')} />
          <Ellipse cx={58} cy={18} rx={42} ry={3} fill={fill('grey')} />
          <Circle cx={58} cy={18} r={3} fill={fill('charcoal')} />
          <Gloss cx={44} cy={34} rx={7} ry={3.5} rotate={-30} />
        </>
      )}
    </CarCanvas>
  );
}

/** Rocket: white body, red nose and fins, a round window, flame under it. */
function Rocket({ size }: WordArtProps) {
  const body =
    'M50 4 C62 14 66 28 66 44 L66 64 C66 68 62 70 58 70 L42 70 C38 70 34 68 34 64 L34 44 C34 28 38 14 50 4 Z';
  return (
    <CarCanvas
      size={size}
      tones={['white', 'red', 'glass', 'sky', 'charcoal', 'flame', 'lemon']}
      shadowWidth={14}
    >
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('body')}>
              <Path d={body} />
            </ClipPath>
          </Defs>
          <Path d="M42 74 C38 82 44 86 50 92 C56 86 62 82 58 74 Z" fill={fill('flame')} />
          <Path d="M45 74 C44 80 47 83 50 86 C53 83 56 80 55 74 Z" fill={fill('lemon')} />
          <Path d="M36 48 L22 62 C20 66 21 72 26 70 L36 64 Z" fill={fill('red')} />
          <Path d="M64 48 L78 62 C80 66 79 72 74 70 L64 64 Z" fill={fill('red')} />
          <Rect x={41} y={68} width={18} height={7} rx={2} fill={fill('charcoal')} />
          <Path d={body} fill={fill('white')} />
          <G clipPath={`url(#${ref('body')})`}>
            <Rect x={30} y={0} width={40} height={22} fill={fill('red')} />
          </G>
          <Rect x={47} y={50} width={6} height={20} rx={3} fill={fill('red')} />
          <Circle cx={50} cy={36} r={9} fill={fill('sky')} />
          <Circle cx={50} cy={36} r={6.5} fill={fill('glass')} />
          <Gloss cx={41} cy={20} rx={2.4} ry={6} rotate={20} />
          <Gloss cx={47} cy={33} rx={2.2} ry={1.4} rotate={-30} />
        </>
      )}
    </CarCanvas>
  );
}

/** Hot air balloon: a striped red-yellow envelope, ropes and a wicker basket. */
function HotAirBalloon({ size }: WordArtProps) {
  const envelope =
    'M50 4 C72 4 86 18 86 36 C86 50 72 58 62 66 L38 66 C28 58 14 50 14 36 C14 18 28 4 50 4 Z';
  const gore = (k: number) =>
    `M50 2 C${50 + k * 34 - 6} 10 ${50 + k * 30 - 6} 50 ${50 + k * 8 - 3} 68 ` +
    `L${50 + k * 8 + 3} 68 C${50 + k * 30 + 6} 50 ${50 + k * 34 + 6} 10 50 2 Z`;
  return (
    <CarCanvas size={size} tones={['red', 'lemon', 'brown', 'tan']} shadowWidth={16}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('env')}>
              <Path d={envelope} />
            </ClipPath>
          </Defs>
          <Path
            d="M40 66 L42 76 M60 66 L58 76 M48 66 L48 76 M52 66 L52 76"
            stroke={T.brown.face}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
          <Path d={envelope} fill={fill('red')} />
          <G clipPath={`url(#${ref('env')})`}>
            {[-1, 0, 1].map((k) => (
              <Path key={k} d={gore(k)} fill={fill('lemon')} />
            ))}
          </G>
          <Rect x={37} y={62} width={26} height={6} rx={3} fill={fill('tan')} />
          <Rect x={39} y={75} width={22} height={13} rx={3} fill={fill('brown')} />
          <Rect x={38} y={74} width={24} height={4} rx={2} fill={fill('tan')} />
          {[44, 50, 56].map((x) => (
            <Rect key={x} x={x - 0.6} y={79} width={1.2} height={8} fill={T.brown.shade} />
          ))}
          <Gloss cx={30} cy={18} rx={8} ry={4} rotate={-40} />
        </>
      )}
    </CarCanvas>
  );
}

// ---------------------------------------------------------------- water

/** Boat: a small wooden rowboat with two oars dipping into the water. */
function Boat({ size }: WordArtProps) {
  return (
    <CarCanvas
      size={size}
      tones={['sky', 'ocean', 'terracotta', 'cream', 'brown', 'tan']}
      shadowWidth={44}
    >
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('water')}>
              <Path d="M4 60 H96 V80 C96 88 78 92 50 92 C22 92 4 88 4 80 Z" />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${ref('water')})`}>
            <Path d={waves(4, 96, 70, 6, 96)} fill={fill('sky')} />
          </G>
          {/* Oars. */}
          <Path
            d="M38 50 L18 82 M62 50 L82 82"
            stroke={T.tan.shade}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Ellipse
            cx={18}
            cy={82}
            rx={3.4}
            ry={6}
            fill={fill('tan')}
            transform="rotate(32 18 82)"
          />
          <Ellipse
            cx={82}
            cy={82}
            rx={3.4}
            ry={6}
            fill={fill('tan')}
            transform="rotate(-32 82 82)"
          />
          <Path
            d="M10 54 L90 54 C88 70 78 80 64 80 L36 80 C22 80 12 70 10 54 Z"
            fill={fill('terracotta')}
          />
          <Rect x={8} y={51} width={84} height={6} rx={3} fill={fill('cream')} />
          <Path
            d="M16 66 C30 68 70 68 84 66"
            stroke={flat('terracotta', 'shade')}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
          <G clipPath={`url(#${ref('water')})`}>
            <Path d={waves(4, 96, 80, 5, 96)} fill={fill('ocean')} />
          </G>
          <Path
            d="M10 78 C14 76 18 76 22 78 M76 78 C80 76 84 76 88 78"
            stroke={gloss}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={22} cy={60} rx={7} ry={2.4} rotate={-8} />
        </>
      )}
    </CarCanvas>
  );
}

/** Ship: a long liner with decks, portholes and two funnels on the sea. */
function Ship({ size }: WordArtProps) {
  const hull = 'M4 52 L96 50 C92 64 86 74 78 76 L16 76 C10 74 6 64 4 52 Z';
  return (
    <CarCanvas
      size={size}
      tones={['navy', 'red', 'white', 'glass', 'charcoal', 'sky', 'ocean']}
      shadowWidth={46}
    >
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('hull')}>
              <Path d={hull} />
            </ClipPath>
          </Defs>
          {[24, 38].map((x) => (
            <G key={x}>
              <Rect x={x} y={14} width={10} height={24} rx={2} fill={fill('red')} />
              <Rect x={x} y={14} width={10} height={5} rx={2} fill={fill('charcoal')} />
            </G>
          ))}
          <Rect x={52} y={24} width={24} height={16} rx={3} fill={fill('white')} />
          {[56, 64].map((x) => (
            <Rect key={x} x={x} y={28} width={6} height={5} rx={1.5} fill={fill('glass')} />
          ))}
          <Rect x={14} y={36} width={68} height={16} rx={4} fill={fill('white')} />
          {[20, 28, 36, 44, 52, 60, 68, 76].map((x) => (
            <Circle key={x} cx={x} cy={44} r={2.2} fill={fill('sky')} />
          ))}
          <Path d={hull} fill={fill('navy')} />
          <G clipPath={`url(#${ref('hull')})`}>
            <Rect x={0} y={68} width={100} height={12} fill={fill('red')} />
          </G>
          <Path d={waves(2, 98, 76, 6, 92)} fill={fill('ocean')} />
          <Path
            d="M8 82 C12 80 16 80 20 82 M74 84 C78 82 82 82 86 84"
            stroke={gloss}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={22} cy={39} rx={6} ry={1.8} rotate={-4} />
          <Gloss cx={18} cy={57} rx={8} ry={2} rotate={-4} opacity={0.4} />
        </>
      )}
    </CarCanvas>
  );
}

/** Submarine: a yellow submarine under the water, periscope up, bubbles behind. */
function Submarine({ size }: WordArtProps) {
  return (
    <CarCanvas
      size={size}
      tones={['lemon', 'glass', 'charcoal', 'grey', 'orange']}
      shadowWidth={38}
    >
      {(fill, ref) => (
        <>
          <Defs>
            <LinearGradient id={ref('water')} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={T.sky.face} />
              <Stop offset="1" stopColor={carTones.ocean.shade} />
            </LinearGradient>
          </Defs>
          <Path
            d="M6 36 C14 32 22 32 30 36 C38 40 46 40 54 36 C62 32 70 32 78 36 C84 39 90 39 94 36 L94 74 C94 84 86 92 76 92 L24 92 C14 92 6 84 6 74 Z"
            fill={`url(#${ref('water')})`}
          />
          {/* Periscope pokes out above the surface. */}
          <Path
            d="M60 50 L60 24 L68 24"
            stroke={T.charcoal.face}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Rect x={42} y={44} width={22} height={16} rx={6} fill={fill('lemon')} />
          <Rect x={14} y={54} width={70} height={26} rx={13} fill={fill('lemon')} />
          {[34, 50, 66].map((x) => (
            <G key={x}>
              <Circle cx={x} cy={67} r={5.4} fill={flat('lemon', 'shade')} />
              <Circle cx={x} cy={67} r={3.8} fill={fill('glass')} />
            </G>
          ))}
          <Ellipse cx={11} cy={67} rx={2.2} ry={7} fill={fill('orange')} />
          <Rect x={9} y={65.5} width={6} height={3} fill={fill('grey')} />
          {[
            [18, 46, 2.6],
            [12, 40, 1.8],
            [22, 38, 1.4],
          ].map(([x, y, r]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={gloss} opacity={0.8} />
          ))}
          <Gloss cx={28} cy={58} rx={8} ry={2.4} rotate={-6} />
          <Gloss cx={48} cy={47} rx={3} ry={1.4} rotate={-8} />
        </>
      )}
    </CarCanvas>
  );
}

// ---------------------------------------------------------------- small wheels

/** Bicycle: thin ring wheels with spokes and an open mint frame. */
function Bicycle({ size }: WordArtProps) {
  const R = 17;
  const tube = (d: string) => (
    <Path
      key={d}
      d={d}
      stroke={T.mint.shade}
      strokeWidth={4.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
  const wheel = (cx: number) => (
    <G key={cx}>
      {[0, 60, 120].map((a) => (
        <Rect
          key={a}
          x={cx - 0.6}
          y={72 - R}
          width={1.2}
          height={R * 2}
          fill={T.grey.face}
          transform={`rotate(${a} ${cx} 72)`}
        />
      ))}
      <Circle cx={cx} cy={72} r={R} stroke={T.charcoal.face} strokeWidth={4.6} fill="none" />
      <Circle cx={cx} cy={72} r={3} fill={T.grey.shade} />
    </G>
  );
  return (
    <CarCanvas size={size} tones={['mint', 'charcoal', 'grey']} shadowWidth={40}>
      {(fill) => (
        <>
          {wheel(24)}
          {wheel(76)}
          {tube('M24 72 L46 72 L38 46 Z')}
          {tube('M38 46 L66 46 L46 72')}
          {tube('M66 46 L76 72')}
          {/* Light face of the frame tubes. */}
          <Path
            d="M24 72 L38 46 L66 46 M46 72 L38 46"
            stroke={T.mint.face}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path
            d="M66 46 L64 36 L56 34"
            stroke={T.charcoal.face}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Ellipse cx={36} cy={42} rx={8} ry={3.2} fill={fill('charcoal')} />
          <Circle cx={46} cy={72} r={4.4} fill={fill('grey')} />
          <Rect x={46} y={76} width={8} height={3} rx={1.5} fill={fill('charcoal')} />
        </>
      )}
    </CarCanvas>
  );
}

/** Motorcycle: fat wheels, a red tank and fender, an engine block, headlight. */
function Motorcycle({ size }: WordArtProps) {
  return (
    <CarCanvas
      size={size}
      tones={['berry', 'charcoal', 'cream', 'grey', 'lemon', 'glass']}
      shadowWidth={40}
    >
      {(fill) => (
        <>
          <Path d="M66 42 L76 78" stroke={T.grey.shade} strokeWidth={4} strokeLinecap="round" />
          <Path d="M44 74 L14 78" stroke={T.grey.face} strokeWidth={4.4} strokeLinecap="round" />
          <Wheel cx={24} cy={78} r={13} fill={fill} />
          <Wheel cx={76} cy={78} r={13} fill={fill} />
          <Path
            d="M64 70 A16 16 0 0 1 90 68"
            stroke={fill('berry')}
            strokeWidth={4.4}
            strokeLinecap="round"
            fill="none"
          />
          <Rect x={38} y={58} width={24} height={16} rx={4} fill={fill('grey')} />
          {[62, 66, 70].map((y) => (
            <Rect key={y} x={41} y={y} width={18} height={1.4} fill={T.grey.shade} />
          ))}
          <Path d="M10 56 L46 56 L44 64 L24 66 C16 66 12 62 10 56 Z" fill={fill('berry')} />
          <Path d="M16 52 C16 48 20 46 26 46 L44 48 L44 56 L18 56 Z" fill={fill('charcoal')} />
          <Path d="M40 50 C42 40 58 38 68 46 L66 58 L40 58 Z" fill={fill('berry')} />
          <Path
            d="M64 40 L60 32"
            stroke={T.charcoal.face}
            strokeWidth={3.4}
            strokeLinecap="round"
          />
          <Path d="M58 32 L66 30" stroke={T.charcoal.face} strokeWidth={4} strokeLinecap="round" />
          <Circle cx={72} cy={46} r={5.4} fill={fill('lemon')} />
          <Gloss cx={50} cy={44} rx={6} ry={2.2} rotate={-14} />
          <Gloss cx={20} cy={58} rx={5} ry={1.4} rotate={-4} />
        </>
      )}
    </CarCanvas>
  );
}

/** Sled: a wooden sled on red runners that curl up in front, on a snow drift, with a rope. */
function Sled({ size }: WordArtProps) {
  return (
    <CarCanvas size={size} tones={['snow', 'tan', 'brown', 'red']} shadowWidth={44}>
      {(fill) => (
        <>
          <Path d="M4 92 C8 82 24 78 50 78 C76 78 92 82 96 92 Z" fill={fill('snow')} />
          {/* Rope from the curl, lying on the snow. */}
          <Path
            d="M82 56 C90 58 92 66 88 72 C86 76 90 80 94 80"
            stroke={T.tan.shade}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          {[24, 44, 64].map((x) => (
            <Rect key={x} x={x} y={58} width={5} height={18} rx={2} fill={flat('red', 'shade')} />
          ))}
          <Path
            d="M12 76 L70 76 C82 76 88 68 84 60 C81 54 74 56 75 61"
            stroke={fill('red')}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M18 46 L74 46 L80 54 L14 54 Z" fill={fill('tan')} strokeLinejoin="round" />
          {[30, 46, 62].map((x) => (
            <Path key={x} d={`M${x} 46.5 L${x - 1} 53.5`} stroke={T.tan.shade} strokeWidth={1.2} />
          ))}
          <Rect x={14} y={54} width={66} height={7} rx={2} fill={fill('brown')} />
          <Gloss cx={28} cy={48.5} rx={8} ry={1.4} rotate={0} />
          <Gloss cx={30} cy={82} rx={8} ry={2} rotate={-4} opacity={0.5} />
        </>
      )}
    </CarCanvas>
  );
}

/** Skateboard: a berry deck with both ends turned up, on four lemon wheels. */
function Skateboard({ size }: WordArtProps) {
  const deck =
    'M6 42 C8 50 14 54 24 54 L76 54 C86 54 92 50 94 42 C96 50 90 62 76 62 L24 62 C10 62 4 50 6 42 Z';
  return (
    <CarCanvas size={size} tones={['berry', 'grey', 'lemon', 'cream', 'charcoal']} shadowWidth={40}>
      {(fill) => (
        <>
          {/* Far wheels peek out behind the near ones. */}
          <Circle cx={31} cy={76} r={8} fill={flat('lemon', 'shade')} />
          <Circle cx={75} cy={76} r={8} fill={flat('lemon', 'shade')} />
          <Path d="M20 62 L36 62 L32 72 L24 72 Z" fill={fill('grey')} />
          <Path d="M64 62 L80 62 L76 72 L68 72 Z" fill={fill('grey')} />
          <Path d={deck} fill={fill('berry')} />
          <Path
            d="M8 46 C10 54 16 57 24 57 L76 57 C84 57 90 54 92 46"
            stroke={T.tan.face}
            strokeWidth={1.8}
            fill="none"
          />
          {/* Lemon stripe along the deck. */}
          <Path
            d="M36 57.4 L44 54 L52 57.4 L60 54"
            stroke={flat('lemon')}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx={26} cy={80} r={9} fill={fill('lemon')} />
          <Circle cx={26} cy={80} r={3.6} fill={fill('cream')} />
          <Circle cx={70} cy={80} r={9} fill={fill('lemon')} />
          <Circle cx={70} cy={80} r={3.6} fill={fill('cream')} />
          <Gloss cx={22} cy={56} rx={8} ry={1.6} rotate={-2} />
          <Gloss cx={23} cy={76} rx={2.6} ry={1.6} />
        </>
      )}
    </CarCanvas>
  );
}

// ---------------------------------------------------------------- road things

/** Wheel: one big rubber tyre with tread blocks, a grey rim and wheel nuts. */
function WheelArt({ size }: WordArtProps) {
  const knobs = Array.from({ length: 18 }, (_, i) => (360 / 18) * i);
  const nuts = Array.from({ length: 5 }, (_, i) => ((2 * Math.PI) / 5) * i - Math.PI / 2);
  return (
    <CarCanvas size={size} tones={['charcoal', 'grey']} shadowWidth={30}>
      {(fill) => (
        <>
          {knobs.map((a) => (
            <Rect
              key={a}
              x={46}
              y={11}
              width={8}
              height={7}
              rx={2}
              fill={T.charcoal.face}
              transform={`rotate(${a} 50 52)`}
            />
          ))}
          <Circle cx={50} cy={52} r={37} fill={fill('charcoal')} />
          <Circle cx={50} cy={52} r={22} fill={T.grey.shade} />
          <Circle cx={50} cy={52} r={20} fill={fill('grey')} />
          <Circle cx={50} cy={52} r={7} fill={T.grey.shade} />
          {nuts.map((a) => (
            <Circle
              key={a}
              cx={50 + Math.cos(a) * 13}
              cy={52 + Math.sin(a) * 13}
              r={2.2}
              fill={T.grey.shade}
            />
          ))}
          <Path
            d="M24 40 A28 28 0 0 1 40 24"
            stroke={gloss}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            opacity={0.45}
          />
          <Gloss cx={42} cy={42} rx={5} ry={2.6} />
        </>
      )}
    </CarCanvas>
  );
}

const MEADOW = 'M50 44 C76 44 94 54 94 66 C94 80 76 88 50 88 C24 88 6 80 6 66 C6 54 24 44 50 44 Z';

/** Pine on the roadside, top at (cx, top). */
function Pine({ cx, top, w, fill }: { cx: number; top: number; w: number; fill: Fill }) {
  const h = (80 - top) * 0.42;
  const tier = (y: number, tw: number) =>
    `M${cx} ${y} C${cx + 3} ${y} ${cx + tw / 2} ${y + h - 5} ${cx + tw / 2} ${y + h - 2} ` +
    `C${cx + tw / 2} ${y + h + 1} ${cx - tw / 2} ${y + h + 1} ${cx - tw / 2} ${y + h - 2} ` +
    `C${cx - tw / 2} ${y + h - 5} ${cx - 3} ${y} ${cx} ${y} Z`;
  return (
    <G>
      <Rect x={cx - 1.5} y={top + h * 1.8} width={3} height={h * 0.6} fill={T.brown.face} />
      <Path d={tier(top + h * 0.8, w)} fill={fill('pine')} />
      <Path d={tier(top, w * 0.7)} fill={fill('pine')} />
    </G>
  );
}

/** Road: a winding asphalt road with a dashed middle line, crossing a meadow. */
function Road({ size }: WordArtProps) {
  return (
    <CarCanvas
      size={size}
      tones={['meadow', 'asphalt', 'pine', 'lemon', 'red', 'cream']}
      shadowWidth={44}
    >
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('meadow')}>
              <Path d={MEADOW} />
            </ClipPath>
          </Defs>
          <Path d={MEADOW} fill={T.brown.face} transform="translate(0 5)" />
          <Path d={MEADOW} fill={fill('meadow')} />
          <G clipPath={`url(#${ref('meadow')})`}>
            <Path
              d="M58 40 C50 50 72 52 64 60 C56 68 26 64 20 76 C16 84 22 88 18 94 L58 94 C60 88 52 84 56 80 C62 72 88 72 84 58 C80 48 66 48 70 40 Z"
              fill={fill('asphalt')}
            />
            <Path
              d="M64 42 C60 50 80 54 72 62 C64 70 40 66 37 78 C35 86 40 88 38 94"
              stroke={T.lemon.face}
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="none"
            />
          </G>
          <Pine cx={24} top={34} w={16} fill={fill} />
          <Pine cx={84} top={50} w={12} fill={fill} />
          {/* A little give-way sign keeps it a road for cars. */}
          <Rect x={75.2} y={72} width={1.6} height={14} fill={T.grey.shade} />
          <Path
            d="M70 66 L82 66 L76 76 Z"
            fill={fill('red')}
            strokeLinejoin="round"
            stroke={fill('red')}
            strokeWidth={2}
          />
          <Path d="M72.8 67.6 L79.2 67.6 L76 73 Z" fill={fill('cream')} />
          <Gloss cx={26} cy={58} rx={7} ry={2.4} rotate={-10} opacity={0.4} />
        </>
      )}
    </CarCanvas>
  );
}

/** Traffic light: three lamps in a dark housing on a pole; the green one is lit. */
function TrafficLight({ size }: WordArtProps) {
  const visor = (cy: number) => `M41 ${cy - 6} A10 10 0 0 1 59 ${cy - 6}`;
  return (
    <CarCanvas
      size={size}
      tones={['charcoal', 'grey', 'redOff', 'lemonOff', 'mint']}
      shadowWidth={20}
    >
      {(fill) => (
        <>
          <Rect x={46} y={60} width={8} height={32} rx={3} fill={fill('grey')} />
          <Rect x={32} y={6} width={36} height={62} rx={12} fill={fill('charcoal')} />
          {/* Glow around the lit lamp. */}
          <Circle cx={50} cy={54} r={13} fill={T.mint.light} opacity={0.35} />
          <Circle cx={50} cy={20} r={8} fill={fill('redOff')} />
          <Circle cx={50} cy={37} r={8} fill={fill('lemonOff')} />
          <Circle cx={50} cy={54} r={8.6} fill={fill('mint')} />
          {[20, 37, 54].map((cy) => (
            <Path
              key={cy}
              d={visor(cy)}
              stroke={T.charcoal.shade}
              strokeWidth={2.4}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          <Gloss cx={47} cy={51} rx={3} ry={1.8} opacity={0.8} />
          {/* Rays: the lit lamp is shown by shape as well as colour. */}
          {[-30, 0, 30].map((a) => (
            <Rect
              key={a}
              x={72}
              y={52.8}
              width={7}
              height={2.4}
              rx={1.2}
              fill={T.mint.face}
              transform={`rotate(${a} 50 54)`}
            />
          ))}
          <Gloss cx={38} cy={14} rx={2.6} ry={5} rotate={10} opacity={0.35} />
        </>
      )}
    </CarCanvas>
  );
}

export const transportArt = {
  'vehicle.truck': Truck,
  'vehicle.train': Train,
  'vehicle.plane': Plane,
  'vehicle.helicopter': Helicopter,
  'vehicle.boat': Boat,
  'vehicle.ship': Ship,
  'vehicle.bicycle': Bicycle,
  'vehicle.motorcycle': Motorcycle,
  'vehicle.taxi': Taxi,
  'vehicle.ambulance': Ambulance,
  'vehicle.fire_truck': FireTruck,
  'vehicle.police_car': PoliceCar,
  'vehicle.tractor': Tractor,
  'vehicle.rocket': Rocket,
  'vehicle.submarine': Submarine,
  'vehicle.tram': Tram,
  'vehicle.subway': Subway,
  'vehicle.hot_air_balloon': HotAirBalloon,
  'vehicle.sled': Sled,
  'vehicle.skateboard': Skateboard,
  'vehicle.wheel': WheelArt,
  'vehicle.road': Road,
  'vehicle.traffic_light': TrafficLight,
} satisfies WordArtMap;
