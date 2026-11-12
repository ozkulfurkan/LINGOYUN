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

// Weather, sky and landscape words of the 2–7 mode, drawn like the pilot sun
// (nature.tsx): clay shapes lit from the top left, one gloss, the shared
// ground shadow, no outlines. Abstract words are made concrete and look-alikes
// are told apart by silhouette first, colour second:
//   moon (sleepy crescent + stars) vs sun (disc with rays);
//   cloud (one white cloud) vs rain (grey cloud + drops) vs snow (white mound +
//   flakes) vs ice (stacked cubes) vs wind (curly lines + flying leaves) vs
//   lightning (dark cloud + zigzag) vs sky (a blue tile with small clouds);
//   tree (one round tree) vs forest (several trees, pines among them);
//   leaf (one big leaf) vs grass (a tuft of blades);
//   mountain (pointed, snow cap) vs volcano (flat top, lava, smoke puffs);
//   river (a band crossing the land) vs lake (water enclosed by land, reeds)
//   vs sea (rows of waves) vs island (land with a palm in the water) vs beach
//   (sand, umbrella, a wave behind) vs sand (a pile with bucket and spade);
//   rock (boulders) vs fire (a campfire on crossed logs).
// Faces only where the word asks for "cute" and a face separates it from a
// look-alike: the moon (vs. a banana).

const { ink, cheek, gloss } = artPalette;
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
const outTones = {
  /** Leaves, grass, tree crowns: mint pulled towards yellow. */
  leaf: leafTone,
  /** Pines and the back row of grass: the deep end of leaf. */
  pine: {
    light: leafTone.face,
    face: leafTone.shade,
    shade: mix(leafTone.shade, T.charcoal.face, 0.35),
  },
  /** Deep water: the deep end of sky. */
  ocean: { light: T.sky.face, face: T.sky.shade, shade: mix(T.sky.shade, T.charcoal.face, 0.35) },
  /** Clouds and snow: cooler than the cream cards, so they do not melt into them. */
  snow: { light: T.cream.light, face: mix(T.cream.face, T.grey.light, 0.6), shade: T.grey.face },
  /** Rain cloud: between snow and grey. */
  rainCloud: mixTone(T.grey, T.cream, 0.25),
  /** Thunder cloud: grey pulled towards charcoal. */
  storm: mixTone(T.grey, T.charcoal, 0.35),
  /** Moon: a paler, softer yellow than the sun. */
  moon: mixTone(T.lemon, T.cream, 0.35),
  /** Ice cubes and snowflakes: glass with a bluer shade, visible on cream. */
  ice: { light: T.glass.light, face: T.glass.shade, shade: T.sky.face },
  /** Wind lines: sky pulled towards grey. */
  wind: mixTone(T.sky, T.grey, 0.45),
  /** Sand. */
  sand: mixTone(T.tan, T.lemon, 0.3),
  /** Rock: grey warmed with tan. */
  stone: mixTone(T.grey, T.tan, 0.25),
  /** Mountain: grey with a blue cast, darker on top so the white cap stands out. */
  slate: {
    light: mix(T.grey.face, T.sky.face, 0.3),
    face: mix(T.grey.shade, T.sky.shade, 0.3),
    shade: mix(T.grey.shade, T.charcoal.face, 0.3),
  },
  /** Volcano: warm earth. */
  earth: mixTone(T.brown, T.terracotta, 0.35),
  /** Lava and flames: lemon to orange to terracotta. */
  flame: { light: T.lemon.face, face: T.orange.face, shade: T.terracotta.face },
} satisfies Record<string, ClayTone>;

type OutToneName = keyof typeof outTones;
type Tone = ArtToneName | OutToneName;
type Fill = (tone: Tone) => string;

const isOut = (tone: Tone): tone is OutToneName => Object.hasOwn(outTones, tone);

/** Flat colour of a tone (for back layers, stripes, veins). */
const flat = (tone: Tone, stop: keyof ClayTone = 'face') =>
  isOut(tone) ? outTones[tone][stop] : T[tone][stop];

/** WordCanvas that also knows the derived tones; `ref(name)` makes unique clip ids. */
function OutCanvas({
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
  const prefix = `o${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const base = tones.filter((t): t is ArtToneName => !isOut(t));
  const extra = tones.filter(isOut);
  const ref = (name: string) => `${prefix}-${name}`;
  return (
    <WordCanvas size={size} tones={base} shadowWidth={shadowWidth}>
      {(baseFill) => (
        <>
          {extra.length > 0 ? (
            <Defs>
              {extra.map((t) => (
                <ClayGradient key={t} id={ref(t)} tone={outTones[t]} />
              ))}
            </Defs>
          ) : null}
          {children((t) => (isOut(t) ? `url(#${ref(t)})` : baseFill(t)), ref)}
        </>
      )}
    </WordCanvas>
  );
}

// ---------------------------------------------------------------- shared shapes

/** Fluffy cloud, about 70 × 40 at scale 1, centred on (0, 0). */
const CLOUD =
  'M-22 14 C-33 14 -37 1 -27 -3 C-29 -15 -15 -21 -7 -13 C-4 -26 17 -27 19 -12 C28 -17 37 -7 32 2 C39 6 35 14 26 14 Z';

function Cloud({
  x,
  y,
  scale = 1,
  color,
}: {
  x: number;
  y: number;
  scale?: number;
  color: string;
}) {
  return <Path d={CLOUD} fill={color} transform={`translate(${x} ${y}) scale(${scale})`} />;
}

/** Tear-shaped drop, tip at (x, y), `s` = width. */
const drop = (x: number, y: number, s: number) =>
  `M${x} ${y} C${x + s * 0.2} ${y + s * 0.5} ${x + s * 0.5} ${y + s * 0.8} ${x + s * 0.5} ${y + s * 1.1} ` +
  `A${s * 0.5} ${s * 0.5} 0 0 1 ${x - s * 0.5} ${y + s * 1.1} ` +
  `C${x - s * 0.5} ${y + s * 0.8} ${x - s * 0.2} ${y + s * 0.5} ${x} ${y} Z`;

/** Six-armed snowflake with a little fork on each arm. */
function Flake({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const arm = `M${cx} ${cy} L${cx} ${cy - r} M${cx} ${cy - r * 0.55} L${cx - r * 0.3} ${cy - r * 0.8} M${cx} ${cy - r * 0.55} L${cx + r * 0.3} ${cy - r * 0.8}`;
  return (
    <G>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <Path
          key={a}
          d={arm}
          stroke={color}
          strokeWidth={r * 0.26}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(${a} ${cx} ${cy})`}
        />
      ))}
      <Circle cx={cx} cy={cy} r={r * 0.22} fill={color} />
    </G>
  );
}

/** Rounded five-pointed star. */
function Star({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.5;
    return `${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`;
  });
  return (
    <Path
      d={`M${points.join(' L')} Z`}
      fill={color}
      stroke={color}
      strokeWidth={r * 0.35}
      strokeLinejoin="round"
    />
  );
}

/** Leaf with a midrib, pointing up, base at (0, 0), about 12 × 26 at scale 1. */
const LEAF = 'M0 0 C-9 -6 -9 -20 0 -27 C9 -20 9 -6 0 0 Z';

function SmallLeaf({
  x,
  y,
  rotate,
  scale = 1,
  color,
  vein,
}: {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  color: string;
  vein: string;
}) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <Path d={LEAF} fill={color} />
      <Path d="M0 -2 L0 -21" stroke={vein} strokeWidth={1.6} strokeLinecap="round" />
    </G>
  );
}

/** Round, bumpy tree crown (centred on 50, ~38 at scale 1). */
const CROWN =
  'M50 8 C62 8 70 15 70 24 C80 25 87 35 83 45 C89 53 83 66 70 66 L30 66 C17 66 11 53 17 45 C13 35 20 25 30 24 C30 15 38 8 50 8 Z';

/** Rounded pine tier: top at (cx, y), width w, height h. */
const tier = (cx: number, y: number, w: number, h: number) =>
  `M${cx} ${y} C${cx + 3} ${y} ${cx + w / 2} ${y + h - 5} ${cx + w / 2} ${y + h - 2} ` +
  `C${cx + w / 2} ${y + h + 1} ${cx - w / 2} ${y + h + 1} ${cx - w / 2} ${y + h - 2} ` +
  `C${cx - w / 2} ${y + h - 5} ${cx - 3} ${y} ${cx} ${y} Z`;

function Pine({ cx, top, w, color }: { cx: number; top: number; w: number; color: string }) {
  const h = (92 - top) * 0.36;
  return (
    <G>
      <Rect
        x={cx - w * 0.08}
        y={92 - h * 0.7}
        width={w * 0.16}
        height={h * 0.7}
        rx={w * 0.06}
        fill={T.brown.face}
      />
      <Path d={tier(cx, top + h * 1.15, w, h)} fill={color} />
      <Path d={tier(cx, top + h * 0.5, w * 0.8, h)} fill={color} />
      <Path d={tier(cx, top, w * 0.58, h)} fill={color} />
    </G>
  );
}

// ---------------------------------------------------------------- sky & weather

/** Sleepy crescent moon with two stars: the face and stars keep it from reading as a banana. */
function Moon({ size }: WordArtProps) {
  // Crescent = big disc minus a smaller disc to the upper right.
  const R = 31;
  const [ax, ay] = [46, 50];
  const r = 25;
  const [bx, by] = [63, 37];
  const d = Math.hypot(bx - ax, by - ay);
  const a = (R * R - r * r + d * d) / (2 * d);
  const h = Math.sqrt(R * R - a * a);
  const [mx, my] = [ax + (a * (bx - ax)) / d, ay + (a * (by - ay)) / d];
  const p1 = [mx + (h * (by - ay)) / d, my - (h * (bx - ax)) / d];
  const p2 = [mx - (h * (by - ay)) / d, my + (h * (bx - ax)) / d];
  const crescent = `M${p1[0]} ${p1[1]} A${R} ${R} 0 1 0 ${p2[0]} ${p2[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]} Z`;
  return (
    <OutCanvas size={size} tones={['moon', 'lemon']} shadowWidth={22}>
      {(fill) => (
        <>
          <Path d={crescent} fill={fill('moon')} />
          <Star cx={74} cy={64} r={7} color={flat('lemon')} />
          <Star cx={84} cy={44} r={4.5} color={flat('lemon')} />
          {/* Sleepy closed eye and smile on the fat part of the crescent. */}
          <Path
            d="M27 46 C29 49 33 49 35 46"
            stroke={ink}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M30 57 C32 60 36 60 38 57"
            stroke={ink}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse cx={26} cy={53} rx={3.4} ry={2.2} fill={cheek} opacity={0.55} />
          <Gloss cx={30} cy={31} rx={6} ry={3.5} rotate={-50} />
        </>
      )}
    </OutCanvas>
  );
}

/** One fluffy white cloud, floating. */
function CloudArt({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['snow']} shadowWidth={22}>
      {(fill) => (
        <>
          <Cloud x={50} y={50} scale={1.2} color={fill('snow')} />
          <Gloss cx={34} cy={36} rx={7} ry={4} />
          <Gloss cx={54} cy={30} rx={4} ry={2.4} opacity={0.4} />
        </>
      )}
    </OutCanvas>
  );
}

/** Rain: a grey cloud with fat blue drops. */
function Rain({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['rainCloud', 'sky']} shadowWidth={26}>
      {(fill) => (
        <>
          {[
            [28, 56, 9],
            [48, 62, 10],
            [68, 56, 9],
            [38, 76, 8],
            [60, 78, 8],
          ].map(([x, y, s]) => (
            <Path key={`${x}-${y}`} d={drop(x, y, s)} fill={fill('sky')} />
          ))}
          <Cloud x={50} y={36} scale={1.15} color={fill('rainCloud')} />
          <Gloss cx={34} cy={23} rx={6} ry={3.5} />
        </>
      )}
    </OutCanvas>
  );
}

/** Snow: a soft white mound with big snowflakes falling on it. */
function Snow({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['snow']} shadowWidth={38}>
      {(fill) => (
        <>
          <Flake cx={28} cy={26} r={11} color={flat('ice', 'shade')} />
          <Flake cx={68} cy={18} r={8} color={flat('ice', 'shade')} />
          <Flake cx={80} cy={44} r={6} color={flat('ice', 'shade')} />
          <Flake cx={50} cy={46} r={5} color={flat('ice', 'shade')} />
          <Path
            d="M6 92 C8 82 20 76 34 77 C44 68 64 66 76 74 C86 74 94 82 94 92 Z"
            fill={fill('snow')}
          />
          {/* Two snowballs in front of the drift. */}
          <Circle cx={72} cy={86} r={6} fill={fill('snow')} />
          <Circle cx={84} cy={88} r={4.2} fill={fill('snow')} />
          <Gloss cx={42} cy={68} rx={8} ry={3.5} rotate={-15} />
        </>
      )}
    </OutCanvas>
  );
}

/** Ice: three rounded ice cubes, two side by side and one on top. */
function Ice({ size }: WordArtProps) {
  // A cube = front face + lighter top face + darker side face.
  const cube = (x: number, y: number, s: number, tilt: number, key: string, fill: Fill) => (
    <G key={key} transform={`rotate(${tilt} ${x + s / 2} ${y + s / 2})`}>
      <Path
        d={`M${x + 3} ${y} L${x + s * 0.3 + 3} ${y - s * 0.28} L${x + s * 1.3 - 3} ${y - s * 0.28} L${x + s - 3} ${y} Z`}
        fill={T.sky.light}
        stroke={T.sky.light}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path
        d={`M${x + s} ${y + 3} L${x + s * 1.3} ${y - s * 0.28 + 3} L${x + s * 1.3} ${y + s * 0.72 - 3} L${x + s} ${y + s - 3} Z`}
        fill={flat('ice', 'shade')}
        stroke={flat('ice', 'shade')}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Rect x={x} y={y} width={s} height={s} rx={5} fill={fill('ice')} />
      <Path
        d={`M${x + 5} ${y + s * 0.35} L${x + 5} ${y + 5} L${x + s * 0.35} ${y + 5}`}
        stroke={gloss}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.85}
      />
    </G>
  );
  return (
    <OutCanvas size={size} tones={['ice']} shadowWidth={36}>
      {(fill) => (
        <>
          {cube(16, 64, 28, 0, 'left', fill)}
          {cube(50, 64, 28, 0, 'right', fill)}
          {cube(32, 30, 28, -8, 'top', fill)}
        </>
      )}
    </OutCanvas>
  );
}

/** Wind: three curly gusts with leaves blowing along. */
function Wind({ size }: WordArtProps) {
  const gusts = [
    'M10 36 H56 C68 36 70 20 60 18 C52 17 50 27 57 29',
    'M20 56 H76 C88 56 90 40 80 38 C72 37 71 46 77 48',
    'M8 74 H50 C61 74 63 87 55 89 C48 90 47 82 53 81',
  ];
  return (
    <OutCanvas size={size} tones={['wind', 'leaf', 'orange']} shadowWidth={20}>
      {(fill) => (
        <>
          {gusts.map((d) => (
            <Path
              key={d}
              d={d}
              stroke={fill('wind')}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          <SmallLeaf
            x={80}
            y={78}
            rotate={60}
            scale={0.8}
            color={fill('leaf')}
            vein={flat('leaf', 'shade')}
          />
          <SmallLeaf
            x={84}
            y={20}
            rotate={-110}
            scale={0.6}
            color={fill('orange')}
            vein={flat('orange', 'shade')}
          />
          <SmallLeaf
            x={26}
            y={30}
            rotate={100}
            scale={0.5}
            color={fill('leaf')}
            vein={flat('leaf', 'shade')}
          />
        </>
      )}
    </OutCanvas>
  );
}

/** Lightning: a dark cloud with a big round-cornered yellow zigzag. */
function Lightning({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['storm', 'lemon']} shadowWidth={20}>
      {(fill) => (
        <>
          <Path
            d="M50 36 L36 64 L49 64 L41 88 L68 54 L55 54 L64 36 Z"
            fill={fill('lemon')}
            stroke={fill('lemon')}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Cloud x={50} y={30} scale={1.15} color={fill('storm')} />
          <Gloss cx={34} cy={17} rx={6} ry={3.5} opacity={0.45} />
          <Gloss cx={44} cy={50} rx={3} ry={1.6} rotate={-60} />
        </>
      )}
    </OutCanvas>
  );
}

/** Rainbow: five clay bands arching between two little clouds. */
function Rainbow({ size }: WordArtProps) {
  const bands: { tone: Tone; r: number }[] = [
    { tone: 'red', r: 40 },
    { tone: 'orange', r: 33 },
    { tone: 'lemon', r: 26 },
    { tone: 'mint', r: 19 },
    { tone: 'sky', r: 12 },
  ];
  const cy = 74;
  return (
    <OutCanvas
      size={size}
      tones={['red', 'orange', 'lemon', 'mint', 'sky', 'snow']}
      shadowWidth={36}
    >
      {(fill) => (
        <>
          {bands.map(({ tone, r }) => (
            <Path
              key={tone}
              d={`M${50 - r} ${cy} A${r} ${r} 0 0 1 ${50 + r} ${cy}`}
              stroke={fill(tone)}
              strokeWidth={7.4}
              fill="none"
            />
          ))}
          <Gloss cx={22} cy={46} rx={6} ry={2.4} rotate={-55} />
          <Cloud x={18} y={78} scale={0.5} color={fill('snow')} />
          <Cloud x={82} y={78} scale={0.5} color={fill('snow')} />
        </>
      )}
    </OutCanvas>
  );
}

/** Sky: a rounded tile of blue (no sun) with two small clouds and a bird. */
function Sky({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['snow']} shadowWidth={34}>
      {(fill, ref) => (
        <>
          <Defs>
            <LinearGradient id={ref('sky')} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={T.sky.shade} />
              <Stop offset="0.55" stopColor={T.sky.face} />
              <Stop offset="1" stopColor={T.sky.light} />
            </LinearGradient>
          </Defs>
          <Rect x={10} y={10} width={80} height={80} rx={22} fill={`url(#${ref('sky')})`} />
          <Gloss cx={26} cy={20} rx={9} ry={3.5} rotate={-20} opacity={0.4} />
          <Cloud x={36} y={46} scale={0.5} color={fill('snow')} />
          <Cloud x={64} y={70} scale={0.6} color={fill('snow')} />
          <Path
            d="M58 30 C60 27 63 27 65 30 C67 27 70 27 72 30"
            stroke={ink}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}
    </OutCanvas>
  );
}

// ---------------------------------------------------------------- plants

/** Tree: one round, bumpy crown on a brown trunk. */
function Tree({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['brown', 'leaf']} shadowWidth={22}>
      {(fill) => (
        <>
          <Path
            d="M44 92 C46 84 46 70 45 56 L55 56 C54 70 54 84 56 92 C52 93 48 93 44 92 Z"
            fill={fill('brown')}
          />
          <Path
            d="M46 92 C42 92 38 92 36 91 M54 92 C58 92 62 92 64 91"
            stroke={T.brown.face}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Path d="M52 66 L62 58" stroke={T.brown.face} strokeWidth={4} strokeLinecap="round" />
          <Path d={CROWN} fill={fill('leaf')} />
          <Circle cx={62} cy={48} r={3} fill={flat('leaf', 'shade')} opacity={0.5} />
          <Circle cx={40} cy={54} r={2.4} fill={flat('leaf', 'shade')} opacity={0.5} />
          <Circle cx={70} cy={36} r={2.2} fill={flat('leaf', 'shade')} opacity={0.5} />
          <Gloss cx={36} cy={24} rx={8} ry={4.5} />
        </>
      )}
    </OutCanvas>
  );
}

/** Forest: tall pines and round trees crowded together. */
function Forest({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['leaf', 'pine', 'brown']} shadowWidth={44}>
      {(fill) => (
        <>
          <Pine cx={50} top={6} w={40} color={fill('pine')} />
          <Pine cx={78} top={26} w={30} color={fill('pine')} />
          <G transform="translate(-2 41) scale(0.55)">
            <Rect x={45} y={56} width={10} height={36} rx={4} fill={T.brown.face} />
            <Path d={CROWN} fill={fill('leaf')} />
          </G>
          <Pine cx={28} top={40} w={26} color={fill('leaf')} />
          <G transform="translate(36 44) scale(0.52)">
            <Rect x={45} y={56} width={10} height={36} rx={4} fill={T.brown.face} />
            <Path d={CROWN} fill={fill('leaf')} />
          </G>
          <Gloss cx={44} cy={20} rx={4} ry={2.4} rotate={-50} />
          <Gloss cx={8} cy={42} rx={4} ry={2.2} />
          <Gloss cx={54} cy={52} rx={4} ry={2.2} />
        </>
      )}
    </OutCanvas>
  );
}

/** Flower: six round pink petals, a yellow middle, a stem with two leaves. */
function Flower({ size }: WordArtProps) {
  const petals = 6;
  return (
    <OutCanvas size={size} tones={['berry', 'lemon', 'leaf']} shadowWidth={20}>
      {(fill) => (
        <>
          <Path
            d="M50 92 C50 76 48 60 50 46"
            stroke={flat('leaf', 'shade')}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
          <SmallLeaf
            x={50}
            y={80}
            rotate={-55}
            scale={0.9}
            color={fill('leaf')}
            vein={flat('leaf', 'shade')}
          />
          <SmallLeaf
            x={50}
            y={72}
            rotate={55}
            scale={0.8}
            color={fill('leaf')}
            vein={flat('leaf', 'shade')}
          />
          {Array.from({ length: petals }, (_, i) => {
            const ang = (2 * Math.PI * i) / petals - Math.PI / 2;
            return (
              <Circle
                key={i}
                cx={50 + Math.cos(ang) * 14}
                cy={34 + Math.sin(ang) * 14}
                r={11}
                fill={fill('berry')}
              />
            );
          })}
          <Circle cx={50} cy={34} r={9} fill={fill('lemon')} />
          <Gloss cx={36} cy={22} rx={4.5} ry={2.6} />
          <Gloss cx={47} cy={30} rx={3} ry={1.8} />
        </>
      )}
    </OutCanvas>
  );
}

/** Leaf: one big green leaf with veins and a short stalk. */
function LeafArt({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['leaf']} shadowWidth={26}>
      {(fill) => (
        <>
          <Path
            d="M28 80 C24 84 20 88 16 90"
            stroke={flat('leaf', 'shade')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M28 80 C18 56 34 22 82 12 C88 46 66 80 28 80 Z" fill={fill('leaf')} />
          <Path
            d="M30 78 C42 60 58 38 78 16 M44 60 L36 46 M44 60 L60 62 M54 46 L50 32 M54 46 L70 46 M64 34 L64 24 M64 34 L76 32"
            stroke={flat('leaf', 'shade')}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={36} cy={42} rx={8} ry={3.5} rotate={-60} />
        </>
      )}
    </OutCanvas>
  );
}

/** Grass: a thick tuft of rounded blades, darker ones behind. */
function Grass({ size }: WordArtProps) {
  const blade = (bx: number, w: number, tx: number, ty: number) =>
    `M${bx - w} 92 C${bx - w} 72 ${tx - 2} ${ty + 12} ${tx} ${ty} C${tx + 2} ${ty + 12} ${bx + w} 74 ${bx + w} 92 Z`;
  const back = [
    [26, 5, 14, 40],
    [44, 5, 40, 22],
    [60, 5, 66, 24],
    [76, 5, 88, 42],
  ];
  const front = [
    [20, 6, 10, 56],
    [34, 6, 28, 34],
    [50, 6, 52, 30],
    [64, 6, 72, 38],
    [80, 6, 90, 58],
  ];
  return (
    <OutCanvas size={size} tones={['leaf', 'pine']} shadowWidth={38}>
      {(fill) => (
        <>
          {back.map(([bx, w, tx, ty]) => (
            <Path key={`b${bx}`} d={blade(bx, w, tx, ty)} fill={fill('pine')} />
          ))}
          {front.map(([bx, w, tx, ty]) => (
            <Path key={`f${bx}`} d={blade(bx, w, tx, ty)} fill={fill('leaf')} />
          ))}
          <Path d="M12 92 C12 84 88 84 88 92 Z" fill={fill('leaf')} />
          <Gloss cx={30} cy={48} rx={5} ry={2} rotate={-70} />
          <Gloss cx={50} cy={46} rx={5} ry={2} rotate={-85} />
        </>
      )}
    </OutCanvas>
  );
}

// ---------------------------------------------------------------- land & water

/** Mountain: two pointed peaks, snow caps with a scalloped edge. */
function Mountain({ size }: WordArtProps) {
  const front = 'M6 92 C18 70 32 32 42 20 C46 15 50 15 54 20 C64 32 76 66 86 92 Z';
  const back = 'M50 92 C60 72 68 50 74 42 C77 38 81 38 84 42 C89 50 94 70 98 92 Z';
  return (
    <OutCanvas size={size} tones={['slate', 'snow']} shadowWidth={46}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('back')}>
              <Path d={back} />
            </ClipPath>
            <ClipPath id={ref('front')}>
              <Path d={front} />
            </ClipPath>
          </Defs>
          <Path d={back} fill={fill('slate')} />
          <G clipPath={`url(#${ref('back')})`}>
            <Path
              d="M50 0 H100 V52 C96 58 92 56 90 52 C86 58 82 56 80 52 C76 58 72 56 70 52 Z"
              fill={fill('snow')}
            />
          </G>
          <Path d={front} fill={fill('slate')} />
          <G clipPath={`url(#${ref('front')})`}>
            <Path
              d="M0 0 H100 V36 C64 36 64 42 62 40 C58 46 54 44 52 40 C48 46 42 46 40 40 C36 44 32 42 28 38 L0 38 Z"
              fill={fill('snow')}
            />
          </G>
          <Gloss cx={42} cy={26} rx={5} ry={2.4} rotate={-60} />
          <Gloss cx={30} cy={58} rx={6} ry={2.4} rotate={-62} opacity={0.35} />
        </>
      )}
    </OutCanvas>
  );
}

/** Volcano: a squat, flat-topped hill with lava spilling over and soft smoke puffs. */
function Volcano({ size }: WordArtProps) {
  const body =
    'M6 92 C16 80 26 56 32 44 C34 40 38 38 42 39 C47 41 53 41 58 39 C62 38 66 40 68 44 C74 56 84 80 94 92 Z';
  return (
    <OutCanvas size={size} tones={['earth', 'flame', 'snow']} shadowWidth={46}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('body')}>
              <Path d={body} />
            </ClipPath>
          </Defs>
          {/* Smoke puffs and lava blobs above the crater. */}
          <Circle cx={44} cy={24} r={8} fill={fill('snow')} />
          <Circle cx={56} cy={18} r={10} fill={fill('snow')} />
          <Circle cx={68} cy={10} r={6.5} fill={fill('snow')} />
          <Circle cx={30} cy={26} r={3.5} fill={fill('flame')} />
          <Circle cx={72} cy={28} r={3} fill={fill('flame')} />
          <Path d={body} fill={fill('earth')} />
          <G clipPath={`url(#${ref('body')})`}>
            <Path
              d="M28 36 H72 V48 C72 54 68 54 67 50 C66 46 64 46 63 52 C62 62 56 62 56 54 C56 48 53 48 52 52 C51 56 47 56 46 50 C45 46 42 46 41 56 C40 66 34 66 34 58 C34 52 32 50 30 50 Z"
              fill={fill('flame')}
            />
          </G>
          <Ellipse cx={50} cy={40} rx={9} ry={2.2} fill={flat('flame', 'shade')} />
          <Gloss cx={30} cy={60} rx={6} ry={2.4} rotate={-60} />
          <Gloss cx={52} cy={14} rx={4} ry={2.2} />
        </>
      )}
    </OutCanvas>
  );
}

/** A round patch of meadow seen from above at an angle, with its earth edge. */
function Meadow({ fill, d }: { fill: Fill; d: string }) {
  return (
    <>
      <Path d={d} fill={flat('brown')} transform="translate(0 5)" />
      <Path d={d} fill={fill('leaf')} />
    </>
  );
}

const MEADOW = 'M50 44 C76 44 94 54 94 66 C94 80 76 88 50 88 C24 88 6 80 6 66 C6 54 24 44 50 44 Z';

/** River: a blue band winding across a meadow, from narrow (far) to wide (near). */
function River({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['leaf', 'sky', 'stone', 'pine']} shadowWidth={44}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('meadow')}>
              <Path d={MEADOW} />
            </ClipPath>
          </Defs>
          <Meadow fill={fill} d={MEADOW} />
          <G clipPath={`url(#${ref('meadow')})`}>
            <Path
              d="M60 40 C54 48 72 52 66 60 C60 68 34 64 30 74 C28 80 34 86 32 92 L52 92 C54 86 46 80 50 76 C56 70 82 70 80 58 C78 50 66 48 70 40 Z"
              fill={fill('sky')}
            />
          </G>
          <Path
            d="M64 58 C60 62 56 62 52 63 M40 76 C38 78 38 80 40 82"
            stroke={gloss}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
            opacity={0.8}
          />
          {/* Pine and stones on the banks. */}
          <Pine cx={22} top={36} w={16} color={fill('pine')} />
          <Ellipse cx={78} cy={76} rx={5} ry={3.4} fill={fill('stone')} />
          <Ellipse cx={85} cy={72} rx={3} ry={2.2} fill={fill('stone')} />
          <Gloss cx={26} cy={56} rx={7} ry={2.4} rotate={-10} opacity={0.4} />
        </>
      )}
    </OutCanvas>
  );
}

/** Lake: still water held in a meadow, reeds on one side, a lily pad. */
function Lake({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['leaf', 'sky', 'brown', 'pine']} shadowWidth={44}>
      {(fill) => (
        <>
          <Meadow fill={fill} d={MEADOW} />
          <Ellipse cx={52} cy={67} rx={33} ry={14} fill={fill('sky')} />
          <Path
            d="M38 62 C42 60 48 60 52 61 M58 72 C62 73 66 72 70 70"
            stroke={gloss}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
            opacity={0.8}
          />
          <Path
            d="M68 66 C68 62 78 62 78 66 C78 70 68 70 68 66 Z M73 66 L77 63"
            fill={fill('leaf')}
            stroke={flat('leaf', 'shade')}
            strokeWidth={0.8}
          />
          {/* Reeds (cattails) on the left bank. */}
          {[
            [14, 30, -6],
            [20, 22, 0],
            [26, 34, 6],
          ].map(([x, top, lean]) => (
            <G key={x}>
              <Path
                d={`M${x} 72 C${x} 60 ${x + lean / 2} ${top + 10} ${x + lean} ${top}`}
                stroke={flat('pine', 'face')}
                strokeWidth={2.2}
                strokeLinecap="round"
                fill="none"
              />
              <Rect
                x={x + lean * 0.8 - 3}
                y={top + 4}
                width={6}
                height={14}
                rx={3}
                fill={fill('brown')}
              />
            </G>
          ))}
          <SmallLeaf
            x={12}
            y={74}
            rotate={-30}
            scale={0.7}
            color={fill('pine')}
            vein={flat('pine', 'shade')}
          />
          <SmallLeaf
            x={30}
            y={74}
            rotate={25}
            scale={0.6}
            color={fill('pine')}
            vein={flat('pine', 'shade')}
          />
          <Gloss cx={40} cy={60} rx={8} ry={2.2} rotate={-6} opacity={0.5} />
        </>
      )}
    </OutCanvas>
  );
}

/** One row of round wave crests from x0 to x1, top at y. */
const waves = (x0: number, x1: number, y: number, r: number, bottom: number) => {
  const n = Math.round((x1 - x0) / (2 * r));
  const step = (x1 - x0) / n;
  let d = `M${x0} ${bottom} L${x0} ${y}`;
  for (let i = 0; i < n; i += 1) d += ` a${step / 2} ${r} 0 0 1 ${step} 0`;
  return `${d} L${x1} ${bottom} Z`;
};

/** Sea: three rows of rolling waves with foam curls. */
function Sea({ size }: WordArtProps) {
  const rows: { tone: Tone; y: number; x0: number; x1: number; r: number }[] = [
    { tone: 'sky', y: 44, x0: 14, x1: 86, r: 8 },
    { tone: 'sky', y: 58, x0: 8, x1: 92, r: 9 },
    { tone: 'ocean', y: 72, x0: 6, x1: 94, r: 10 },
  ];
  return (
    <OutCanvas size={size} tones={['sky', 'ocean']} shadowWidth={44}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('sea')}>
              <Path d="M4 20 H96 V70 C96 84 78 92 50 92 C22 92 4 84 4 70 Z" />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${ref('sea')})`}>
            {rows.map(({ tone, y, x0, x1, r }, i) => (
              <G key={y}>
                <Path d={waves(x0, x1, y, r, 96)} fill={fill(tone)} opacity={i === 0 ? 0.75 : 1} />
                {/* Foam curl on every other crest. */}
                {Array.from({ length: Math.round((x1 - x0) / (2 * r)) }, (_, k) => k)
                  .filter((k) => (k + i) % 2 === 0)
                  .map((k) => {
                    const step = (x1 - x0) / Math.round((x1 - x0) / (2 * r));
                    const cx = x0 + step * k + step / 2;
                    return (
                      <Path
                        key={k}
                        d={`M${cx - step * 0.3} ${y - r * 0.4} C${cx - step * 0.1} ${y - r * 0.95} ${cx + step * 0.25} ${y - r * 0.8} ${cx + step * 0.15} ${y - r * 0.35}`}
                        stroke={gloss}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        fill="none"
                      />
                    );
                  })}
              </G>
            ))}
          </G>
          <Gloss cx={22} cy={64} rx={6} ry={2.2} opacity={0.4} />
        </>
      )}
    </OutCanvas>
  );
}

/** Palm tree: curved trunk, five fronds, coconuts. Top of the trunk at (tx, ty). */
function Palm({ tx, ty, fill }: { tx: number; ty: number; fill: Fill }) {
  const fronds = [-160, -120, -60, -20, 30, 150];
  return (
    <G>
      <Path
        d={`M${tx + 8} 80 C${tx + 10} 62 ${tx + 6} ${ty + 14} ${tx} ${ty}`}
        stroke={fill('tan')}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${tx + 4} ${ty + 30} l4 -1 M${tx + 6} ${ty + 20} l4 -1.5 M${tx + 3} ${ty + 10} l4 -2`}
        stroke={T.tan.shade}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      {fronds.map((a) => (
        <Ellipse
          key={a}
          cx={tx + 12}
          cy={ty}
          rx={13}
          ry={4.6}
          fill={fill('leaf')}
          transform={`rotate(${a} ${tx} ${ty}) rotate(${a > -90 && a < 90 ? 12 : -12} ${tx + 12} ${ty})`}
        />
      ))}
      <Circle cx={tx - 3} cy={ty + 4} r={3.2} fill={fill('brown')} />
      <Circle cx={tx + 3} cy={ty + 5} r={3.2} fill={fill('brown')} />
    </G>
  );
}

/** Island: a sandy hump with a palm, sitting in round blue water. */
function Island({ size }: WordArtProps) {
  return (
    <OutCanvas
      size={size}
      tones={['ocean', 'sky', 'sand', 'tan', 'leaf', 'brown']}
      shadowWidth={44}
    >
      {(fill) => (
        <>
          <Ellipse cx={50} cy={80} rx={45} ry={13} fill={fill('sky')} />
          <Path d="M20 80 C24 64 76 64 80 80 C70 86 30 86 20 80 Z" fill={fill('sand')} />
          <Path
            d="M12 86 C16 84 20 84 24 86 M76 86 C80 84 84 84 88 86 M16 76 C18 75 20 75 22 76"
            stroke={gloss}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Palm tx={44} ty={30} fill={fill} />
          <Gloss cx={34} cy={70} rx={6} ry={2.2} rotate={-12} />
        </>
      )}
    </OutCanvas>
  );
}

/** Beach: sand in front, a wave behind, a striped umbrella and a starfish. */
function Beach({ size }: WordArtProps) {
  const canopy =
    'M22 42 C24 22 76 22 78 42 C74 39 70 39 66 42 C62 39 58 39 54 42 C50 39 46 39 42 42 C38 39 34 39 30 42 C27 39 24 39 22 42 Z';
  return (
    <OutCanvas size={size} tones={['sky', 'sand', 'red', 'cream', 'orange']} shadowWidth={44}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('canopy')}>
              <Path d={canopy} />
            </ClipPath>
            <ClipPath id={ref('shore')}>
              <Path d="M4 40 H96 V74 C96 86 78 92 50 92 C22 92 4 86 4 74 Z" />
            </ClipPath>
          </Defs>
          <G clipPath={`url(#${ref('shore')})`}>
            <Path d={waves(4, 96, 58, 7, 80)} fill={fill('sky')} />
            <Path d="M0 70 C30 64 70 66 100 70 L100 96 L0 96 Z" fill={fill('sand')} />
            <Path
              d="M4 70 C30 64 70 66 96 70"
              stroke={gloss}
              strokeWidth={2.6}
              strokeLinecap="round"
              fill="none"
            />
          </G>
          <Path d="M50 30 L56 84" stroke={T.brown.face} strokeWidth={3} strokeLinecap="round" />
          <Path d={canopy} fill={fill('red')} />
          <G clipPath={`url(#${ref('canopy')})`}>
            <Path
              d="M41 20 L33 44 L43 44 L49 20 Z M59 20 L57 44 L67 44 L67 20 Z"
              fill={fill('cream')}
            />
          </G>
          <Circle cx={50} cy={24} r={2.6} fill={fill('red')} />
          <Star cx={26} cy={82} r={6} color={fill('orange')} />
          <Gloss cx={34} cy={30} rx={6} ry={2.6} rotate={-25} />
        </>
      )}
    </OutCanvas>
  );
}

/** Sand: a heap of sand with a spade stuck in it and a red bucket. */
function Sand({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['sand', 'red', 'sky']} shadowWidth={42}>
      {(fill) => (
        <>
          <Path d="M36 46 L44 64" stroke={T.sky.shade} strokeWidth={3.4} strokeLinecap="round" />
          <Path d="M33 40 C30 42 31 47 35 47 L39 45 C40 42 37 39 33 40 Z" fill={fill('sky')} />
          <Path d="M8 92 C12 76 30 58 50 58 C70 58 86 76 90 92 Z" fill={fill('sand')} />
          {[
            [34, 76],
            [50, 70],
            [62, 82],
            [44, 86],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill={flat('sand', 'shade')} />
          ))}
          {/* Bucket: tapered body, rim, handle. */}
          <Path
            d="M66 62 C66 52 90 52 90 62"
            stroke={flat('red', 'shade')}
            strokeWidth={2}
            fill="none"
          />
          <Path d="M64 66 L92 66 L88 90 C88 92 68 92 68 90 Z" fill={fill('red')} />
          <Rect x={62} y={62} width={32} height={6} rx={3} fill={fill('red')} />
          <Gloss cx={32} cy={66} rx={7} ry={2.6} rotate={-30} />
          <Gloss cx={70} cy={74} rx={2} ry={5} rotate={10} />
        </>
      )}
    </OutCanvas>
  );
}

/** Rock: a big round boulder with a smaller one beside it. */
function RockArt({ size }: WordArtProps) {
  return (
    <OutCanvas size={size} tones={['stone']} shadowWidth={40}>
      {(fill) => (
        <>
          <Path
            d="M16 92 C10 80 14 60 28 50 C40 40 62 40 74 52 C84 62 86 80 80 92 Z"
            fill={fill('stone')}
          />
          <Path
            d="M58 50 C56 56 60 60 57 66 M57 66 L62 70"
            stroke={flat('stone', 'shade')}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M72 92 C70 84 76 76 84 76 C92 76 96 84 94 92 Z" fill={fill('stone')} />
          <Ellipse cx={10} cy={90} rx={4} ry={2.6} fill={fill('stone')} />
          <Gloss cx={32} cy={58} rx={9} ry={5} rotate={-35} />
          <Gloss cx={80} cy={81} rx={3} ry={1.8} />
        </>
      )}
    </OutCanvas>
  );
}

/** Fire: a friendly campfire, round flames on two crossed logs. */
function Fire({ size }: WordArtProps) {
  const log = (rotate: number) => (
    <G transform={`rotate(${rotate} 50 84)`}>
      <Rect x={20} y={78} width={60} height={12} rx={6} fill={T.brown.face} />
      <Ellipse cx={74} cy={84} rx={4.5} ry={5.6} fill={T.tan.face} />
      <Ellipse cx={74} cy={84} rx={2} ry={2.6} fill={T.tan.shade} />
    </G>
  );
  return (
    <OutCanvas size={size} tones={['flame', 'lemon', 'brown']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path
            d="M50 14 C58 28 74 38 72 60 C71 74 62 82 50 82 C38 82 29 74 28 60 C27 50 34 44 37 34 C42 42 44 44 46 44 C46 36 46 24 50 14 Z"
            fill={fill('flame')}
          />
          <Path
            d="M51 42 C56 50 62 56 61 66 C60 74 56 78 50 78 C44 78 39 74 39 67 C39 60 44 56 46 50 C48 54 50 54 50 54 C50 50 50 46 51 42 Z"
            fill={fill('lemon')}
          />
          <Circle cx={74} cy={30} r={2.4} fill={fill('lemon')} />
          <Circle cx={26} cy={36} r={1.8} fill={fill('lemon')} />
          {log(-14)}
          {log(14)}
          <Gloss cx={40} cy={50} rx={5} ry={2.4} rotate={-60} />
        </>
      )}
    </OutCanvas>
  );
}

export const outdoorArt = {
  'nature.moon': Moon,
  'nature.cloud': CloudArt,
  'nature.rain': Rain,
  'nature.snow': Snow,
  'nature.ice': Ice,
  'nature.wind': Wind,
  'nature.lightning': Lightning,
  'nature.rainbow': Rainbow,
  'nature.sky': Sky,
  'nature.tree': Tree,
  'nature.flower': Flower,
  'nature.leaf': LeafArt,
  'nature.grass': Grass,
  'nature.forest': Forest,
  'nature.mountain': Mountain,
  'nature.volcano': Volcano,
  'nature.river': River,
  'nature.lake': Lake,
  'nature.sea': Sea,
  'nature.island': Island,
  'nature.beach': Beach,
  'nature.sand': Sand,
  'nature.rock': RockArt,
  'nature.fire': Fire,
} satisfies WordArtMap;
