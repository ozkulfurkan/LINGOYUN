import { useId, type ReactNode } from 'react';
import { Circle, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Clothes and things we wear, for the 2–7 mode. Same clay rules as the pilot
// shoes (clothes.tsx): light from the top left, gloss there, shared ground
// shadow, no outlines. Parts of one colour that overlap are separated by a soft
// drop shadow (`Lift`), not by a line.
//
// Look-alikes are told apart by shape first, colour second:
// shirt (collar + buttons, long sleeves) / t-shirt (round neck, short sleeves);
// pants (long legs) / shorts (short wide legs, drawstring);
// coat "mont" (long, puffy quilted bands, hood) / jacket "ceket" (lapels, two
// buttons) / sweater (knit bands, ribbed cuffs) / raincoat (yellow, pointed
// hood, shiny, rain drops); boots (tall shaft, fur cuff) / slippers (seen from
// above) / shoes (pilot); hat (brim) / gloves (fingers) / scarf (loop + tails).

// ---------------------------------------------------------------- tones

type Rgb = readonly [number, number, number];

const toRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const toHex = (rgb: readonly number[]) =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;

const mix = (a: string, b: string, k: number) => {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * k));
};

const mixTone = (a: ClayTone, b: ClayTone, k: number): ClayTone => ({
  light: mix(a.light, b.light, k),
  face: mix(a.face, b.face, k),
  shade: mix(a.shade, b.shade, k),
});

const t = artPalette.tones;

/** The same tone one step deeper: its face becomes the light, its shade the face. */
const deeper = (a: ClayTone): ClayTone => ({
  light: a.face,
  face: a.shade,
  shade: mix(a.shade, t.charcoal.shade, 0.45),
});

const denim = deeper(t.sky);

/** Clothing colours mixed from the shared art palette (no new hex values). */
export const wardrobeTones = {
  /** Jeans. */
  denim,
  /** Winter coat ("mont"): deep blue. */
  navy: mixTone(denim, t.charcoal, 0.4),
  /** Jacket ("ceket"). */
  camel: mixTone(t.ginger, t.brown, 0.3),
  /** Pajamas. */
  lavender: mixTone(t.sky, t.pink, 0.55),
  /** Swimsuit: pool turquoise. */
  turquoise: mixTone(t.mint, t.sky, 0.45),
  /** Straw hat. */
  straw: mixTone(t.lemon, t.tan, 0.55),
  /** Zipper teeth, slider and buckle metal. */
  metal: mixTone(t.grey, t.glass, 0.25),
} satisfies Record<string, ClayTone>;

type WardrobeToneName = keyof typeof wardrobeTones;
type ToneName = ArtToneName | WardrobeToneName;
type Paint = (tone: ToneName) => string;

const isWardrobeTone = (tone: ToneName): tone is WardrobeToneName =>
  Object.hasOwn(wardrobeTones, tone);

const tone = (name: ToneName): ClayTone =>
  isWardrobeTone(name) ? wardrobeTones[name] : artPalette.tones[name];

/** WordCanvas that also knows the clothing tones above. */
function WardrobeCanvas({
  size,
  tones,
  shadowWidth,
  children,
}: {
  size?: number;
  tones: readonly ToneName[];
  shadowWidth?: number;
  children: (paint: Paint) => ReactNode;
}) {
  const prefix = `w${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const base = tones.filter((name): name is ArtToneName => !isWardrobeTone(name));
  const extra = tones.filter(isWardrobeTone);
  return (
    <WordCanvas size={size} tones={base} shadowWidth={shadowWidth}>
      {(fill) => (
        <>
          <Defs>
            {extra.map((name) => (
              <ClayGradient key={name} id={`${prefix}-${name}`} tone={wardrobeTones[name]} />
            ))}
          </Defs>
          {children((name) => (isWardrobeTone(name) ? `url(#${prefix}-${name})` : fill(name)))}
        </>
      )}
    </WordCanvas>
  );
}

// ---------------------------------------------------------------- helpers

/**
 * Mirror of an absolute path across the vertical line x = `axis` (default: the
 * middle of the box). Only M, L, C, Q and Z are used in this file, so only
 * those are handled; every argument of them is an (x, y) pair.
 */
export function mirrorPath(d: string, axis = 50): string {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const out: string[] = [];
  let index = 0;
  for (const token of tokens) {
    if (/[A-Za-z]/.test(token)) {
      if (!/[MLCQZ]/.test(token)) throw new Error(`mirrorPath: unsupported command ${token}`);
      out.push(token);
      index = 0;
    } else {
      const value = Number(token);
      out.push(String(index % 2 === 0 ? Math.round((2 * axis - value) * 100) / 100 : value));
      index += 1;
    }
  }
  return out.join(' ');
}

/** Soft drop shadow of a part that lies on a part of the same colour. */
function Lift({ d, dx = 1, dy = 1.6 }: { d: string; dx?: number; dy?: number }) {
  return (
    <Path d={d} fill={artPalette.shadow} opacity={0.16} transform={`translate(${dx} ${dy})`} />
  );
}

/** Thin line in the darker stop of a tone (seams, folds, ribs). */
function Crease({
  d,
  of,
  opacity = 0.45,
  width = 1.8,
  dash,
}: {
  d: string;
  of: ToneName;
  opacity?: number;
  width?: number;
  dash?: string;
}) {
  return (
    <Path
      d={d}
      stroke={tone(of).shade}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
      fill="none"
    />
  );
}

/** Stitching or a light rib in the lighter stop of a tone. */
function Stitch({
  d,
  of,
  opacity = 0.8,
  width = 1.2,
  dash = '2.2 2',
}: {
  d: string;
  of: ToneName;
  opacity?: number;
  width?: number;
  dash?: string;
}) {
  return (
    <Path
      d={d}
      stroke={tone(of).light}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dash}
      fill="none"
    />
  );
}

/** Small clay button with two holes. */
function SmallButton({ x, y, r = 3, of }: { x: number; y: number; r?: number; of: ToneName }) {
  return (
    <G>
      <Circle cx={x + 0.4} cy={y + 0.8} r={r} fill={artPalette.shadow} opacity={0.18} />
      <Circle cx={x} cy={y} r={r} fill={tone(of).face} />
      <Circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.4} fill={tone(of).light} opacity={0.9} />
      <Circle cx={x - r * 0.3} cy={y + r * 0.25} r={r * 0.17} fill={tone(of).shade} />
      <Circle cx={x + r * 0.3} cy={y + r * 0.25} r={r * 0.17} fill={tone(of).shade} />
    </G>
  );
}

/** Five-point star centred on (x, y). */
const starPath = (x: number, y: number, r: number) => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.48;
    return `${(x + radius * Math.cos(angle)).toFixed(2)} ${(y + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join(' L')} Z`;
};

/** Point and direction (degrees) on a cubic Bézier at `k` (0–1). */
function onCurve(
  p0: readonly [number, number],
  p1: readonly [number, number],
  p2: readonly [number, number],
  p3: readonly [number, number],
  k: number,
) {
  const u = 1 - k;
  const at = (i: 0 | 1) =>
    u * u * u * p0[i] + 3 * u * u * k * p1[i] + 3 * u * k * k * p2[i] + k * k * k * p3[i];
  const slope = (i: 0 | 1) =>
    3 * u * u * (p1[i] - p0[i]) + 6 * u * k * (p2[i] - p1[i]) + 3 * k * k * (p3[i] - p2[i]);
  return { x: at(0), y: at(1), angle: (Math.atan2(slope(1), slope(0)) * 180) / Math.PI };
}

// ---------------------------------------------------------------- shared shapes

/** Front of a top, laid flat: shoulders at y 15, hem at y 91. */
const BODY =
  'M31 20 C38 17 43 15 50 15 C57 15 62 17 69 20 C72 22 73 26 73 30 L73 85 C73 89 70 91 66 91 L34 91 C30 91 27 89 27 85 L27 30 C27 26 28 22 31 20 Z';
/** Left long sleeve, cuff at the bottom left. */
const LONG_SLEEVE =
  'M33 20 C25 21 20 26 18 33 L12 80 C11.5 84 13.5 86 17 86 L24 86 C26.5 86 28 84.5 28 82 L32 44 Z';
const LONG_SLEEVE_R = mirrorPath(LONG_SLEEVE);
/** Left short sleeve. */
const SHORT_SLEEVE =
  'M33 20 C25 21 18 25 13 32 L7 43 C6 46 7 48 10 49 L21 53 C23 54 25 53 26 51 L31 40 Z';
const SHORT_SLEEVE_R = mirrorPath(SHORT_SLEEVE);

/** Sleeves and body of a long-sleeved top in one tone. */
function LongTop({ paint, of }: { paint: Paint; of: ToneName }) {
  return (
    <>
      <Path d={LONG_SLEEVE} fill={paint(of)} />
      <Path d={LONG_SLEEVE_R} fill={paint(of)} />
      <Lift d={BODY} dx={0} dy={1} />
      <Path d={BODY} fill={paint(of)} />
    </>
  );
}

// ---------------------------------------------------------------- tops

function Shirt({ size }: WordArtProps) {
  const collar = 'M50 25 L41 14 C39 13 37 14 37 16 L37 31 C37 33 39 33 40 32 Z';
  return (
    <WardrobeCanvas size={size} tones={['sky', 'cream']} shadowWidth={34}>
      {(paint) => (
        <>
          <LongTop paint={paint} of="sky" />
          {/* Cuffs. */}
          <Crease d="M12.6 77 L28.6 78" of="sky" />
          <Crease d={mirrorPath('M12.6 77 L28.6 78')} of="sky" />
          {/* Button band and pocket. */}
          <Crease d="M50 27 L50 90" of="sky" opacity={0.5} />
          <Crease
            d="M32 40 L43 40 L43 50 C43 52 42 53 40 53 L35 53 C33 53 32 52 32 50 Z"
            of="sky"
          />
          <Gloss cx={35} cy={60} rx={3} ry={11} rotate={6} opacity={0.4} />
          {/* Pointed collar: the sign of a shirt. */}
          <Lift d={collar} />
          <Lift d={mirrorPath(collar)} />
          <Path d={collar} fill={paint('cream')} />
          <Path d={mirrorPath(collar)} fill={paint('cream')} />
          {[38, 52, 66, 80].map((y) => (
            <SmallButton key={y} x={50} y={y} r={3.2} of="cream" />
          ))}
          <Gloss cx={18} cy={36} rx={2} ry={6} rotate={18} opacity={0.45} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function TShirt({ size }: WordArtProps) {
  return (
    <WardrobeCanvas size={size} tones={['orange', 'lemon']} shadowWidth={32}>
      {(paint) => (
        <>
          <Path d={SHORT_SLEEVE} fill={paint('orange')} />
          <Path d={SHORT_SLEEVE_R} fill={paint('orange')} />
          <Lift d={BODY} dx={0} dy={1} />
          <Path d={BODY} fill={paint('orange')} />
          {/* Round neck, no collar; ribbed sleeve ends. */}
          <Path d="M40 17 C43 26 57 26 60 17 C56 15.5 44 15.5 40 17 Z" fill={t.orange.shade} />
          <Crease d="M39 17 C42 28 58 28 61 17" of="orange" opacity={0.5} width={2.2} />
          <Crease d="M9.5 44 L22 49.5" of="orange" />
          <Crease d={mirrorPath('M9.5 44 L22 49.5')} of="orange" />
          <Crease d="M28 86 L72 86" of="orange" opacity={0.35} />
          <Lift d={starPath(50, 56, 15)} />
          <Path
            d={starPath(50, 56, 15)}
            fill={paint('lemon')}
            stroke={t.lemon.face}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Gloss cx={34} cy={36} rx={3.5} ry={10} rotate={10} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Sweater({ size }: WordArtProps) {
  // Knit rows: zigzags across the chest; ribbed neck, cuffs and hem.
  const zigzag = (y: number) =>
    `M28 ${y} ${Array.from({ length: 11 }, (_, i) => `L${28 + (i + 1) * 4.1} ${i % 2 === 0 ? y + 3.5 : y}`).join(' ')}`;
  const ribs = (x0: number, x1: number, y0: number, y1: number, step = 3) =>
    Array.from({ length: Math.floor((x1 - x0) / step) + 1 }, (_, i) => {
      const x = x0 + i * step;
      return `M${x} ${y0} L${x} ${y1}`;
    }).join(' ');
  return (
    <WardrobeCanvas size={size} tones={['red', 'cream']} shadowWidth={34}>
      {(paint) => (
        <>
          <LongTop paint={paint} of="red" />
          {/* Ribbed hem and cuffs. */}
          <Path
            d="M27 80 L73 80 L73 85 C73 89 70 91 66 91 L34 91 C30 91 27 89 27 85 Z"
            fill={t.red.shade}
            opacity={0.35}
          />
          <Crease d={ribs(30, 70, 81.5, 89.5)} of="red" opacity={0.55} width={1.3} />
          <Path
            d="M12.9 76 L28.7 77 L28 82 C28 84.5 26.5 86 24 86 L17 86 C13.5 86 11.5 84 12 80 Z"
            fill={t.red.shade}
            opacity={0.35}
          />
          <Path
            d={mirrorPath(
              'M12.9 76 L28.7 77 L28 82 C28 84.5 26.5 86 24 86 L17 86 C13.5 86 11.5 84 12 80 Z',
            )}
            fill={t.red.shade}
            opacity={0.35}
          />
          {/* Knit pattern. */}
          <Stitch d={zigzag(38)} of="cream" dash="0" width={2.4} opacity={0.95} />
          <Stitch d={zigzag(62)} of="cream" dash="0" width={2.4} opacity={0.95} />
          {[44, 50, 56].map((y) =>
            [32, 39, 46, 53, 60, 67].map((x) => (
              <Path
                key={`${x}-${y}`}
                d={`M${x + (y === 50 ? 3.5 : 0) - 2} ${y - 1.5} L${x + (y === 50 ? 3.5 : 0)} ${y + 1.5} L${x + (y === 50 ? 3.5 : 0) + 2} ${y - 1.5}`}
                stroke={t.red.light}
                strokeOpacity={0.7}
                strokeWidth={1.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )),
          )}
          {/* Crew neck rib. */}
          <Path d="M39 17 C42 28 58 28 61 17 C57 15.4 43 15.4 39 17 Z" fill={t.red.shade} />
          <Path d="M37 17.5 C40 31 60 31 63 17.5 L60 17 C57 26 43 26 40 17 Z" fill={paint('red')} />
          <Crease d={ribs(42, 58, 25, 28.5, 2.6)} of="red" opacity={0.5} width={1} />
          <Gloss cx={34} cy={30} rx={2.5} ry={6} rotate={10} opacity={0.5} />
          <Gloss cx={18} cy={36} rx={2} ry={6} rotate={18} opacity={0.45} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Jacket({ size }: WordArtProps) {
  // Blazer ("ceket"): hip length, a V of shirt, lapels, two buttons, pocket flaps.
  const vNeck = 'M41 16 C44 15 56 15 59 16 L50 54 Z';
  const lapel = 'M41 15 L36 17 L35 28 L40 31 L37 35 L50 56 L42 16 Z';
  return (
    <WardrobeCanvas size={size} tones={['camel', 'cream', 'brown']} shadowWidth={34}>
      {(paint) => (
        <>
          <Path d={LONG_SLEEVE} fill={paint('camel')} />
          <Path d={LONG_SLEEVE_R} fill={paint('camel')} />
          <Path
            d="M31 20 C38 17 43 15 50 15 C57 15 62 17 69 20 C72 22 73 26 73 30 L73 78 C73 82 70 84 66 84 L54 84 L50 80 L46 84 L34 84 C30 84 27 82 27 78 L27 30 C27 26 28 22 31 20 Z"
            fill={paint('camel')}
          />
          <Path d={vNeck} fill={paint('cream')} />
          <Lift d={lapel} />
          <Lift d={mirrorPath(lapel)} />
          <Path d={lapel} fill={paint('camel')} />
          <Path d={mirrorPath(lapel)} fill={paint('camel')} />
          <Crease d="M50 56 L50 80" of="camel" opacity={0.55} />
          <Crease d="M31 66 L43 66" of="camel" opacity={0.6} width={2.2} />
          <Crease d="M57 66 L69 66" of="camel" opacity={0.6} width={2.2} />
          <Crease d="M58 38 L67 38" of="camel" opacity={0.6} width={2} />
          <SmallButton x={50} y={62} r={3.4} of="brown" />
          <SmallButton x={50} y={73} r={3.4} of="brown" />
          {/* Cuff buttons. */}
          <Circle cx={22} cy={80} r={1.5} fill={t.brown.face} />
          <Circle cx={78} cy={80} r={1.5} fill={t.brown.face} />
          <Gloss cx={33} cy={46} rx={2.5} ry={10} rotate={6} opacity={0.45} />
          <Gloss cx={18} cy={36} rx={2} ry={6} rotate={18} opacity={0.45} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Coat({ size }: WordArtProps) {
  // Winter coat ("mont"): long and thick, puffy quilted bands, furry hood.
  const bands = [0, 1, 2, 3, 4];
  return (
    <WardrobeCanvas size={size} tones={['navy', 'cream', 'lemon']} shadowWidth={36}>
      {(paint) => (
        <>
          {/* Puffy sleeves: four bulges each, down to the hem of the hips. */}
          {[0, 1, 2, 3].map((i) => (
            <G key={i}>
              <Ellipse cx={26 - i * 3.6} cy={30 + i * 13} rx={9} ry={8} fill={paint('navy')} />
              <Ellipse cx={74 + i * 3.6} cy={30 + i * 13} rx={9} ry={8} fill={paint('navy')} />
            </G>
          ))}
          {/* Body: five quilted bands, the coat is long. */}
          {bands.map((i) => (
            <G key={i}>
              <Rect
                x={26 - i * 1}
                y={19.2 + i * 14.6}
                width={48 + i * 2}
                height={16.5}
                rx={8}
                fill={artPalette.shadow}
                opacity={0.16}
              />
              <Rect
                x={26 - i * 1}
                y={18 + i * 14.6}
                width={48 + i * 2}
                height={16.5}
                rx={8}
                fill={paint('navy')}
              />
            </G>
          ))}
          <Crease d="M50 30 L50 91" of="navy" opacity={0.8} width={2} />
          {/* Hood up, with a fluffy fur rim round a dark opening. */}
          <Path
            d="M32 30 C29 12 38 2 50 2 C62 2 71 12 68 30 C62 35 38 35 32 30 Z"
            fill={paint('navy')}
          />
          <Path
            d="M50 6 C53 4 57 6 58 8 C61 7 64 10 63 13 C66 15 66 19 64 21 C66 24 64 28 61 28 C60 31 56 32 54 30 C52 32 48 32 46 30 C44 32 40 31 39 28 C36 28 34 24 36 21 C34 19 34 15 37 13 C36 10 39 7 42 8 C43 6 47 4 50 6 Z"
            fill={paint('cream')}
          />
          <Ellipse cx={50} cy={19} rx={7.5} ry={9} fill={wardrobeTones.navy.shade} />
          <Gloss cx={40} cy={11} rx={2} ry={3.5} rotate={-30} opacity={0.7} />
          {/* Zipper pull. */}
          <Rect x={47.6} y={36} width={4.8} height={9} rx={2.4} fill={paint('lemon')} />
          {bands.map((i) => (
            <Gloss
              key={i}
              cx={33 - i}
              cy={23.5 + i * 14.6}
              rx={4.5}
              ry={2}
              rotate={-6}
              opacity={0.4}
            />
          ))}
        </>
      )}
    </WardrobeCanvas>
  );
}

function Raincoat({ size }: WordArtProps) {
  // Yellow, hood up, shiny, toggles and rain drops: a raincoat at a glance.
  const drop = (x: number, y: number, s: number) =>
    `M${x} ${y - 5 * s} C${x + 3 * s} ${y - s} ${x + 3.5 * s} ${y + 1 * s} ${x + 3.5 * s} ${y + 2 * s} C${x + 3.5 * s} ${y + 4.5 * s} ${x + 2 * s} ${y + 5.5 * s} ${x} ${y + 5.5 * s} C${x - 2 * s} ${y + 5.5 * s} ${x - 3.5 * s} ${y + 4.5 * s} ${x - 3.5 * s} ${y + 2 * s} C${x - 3.5 * s} ${y + 1 * s} ${x - 3 * s} ${y - s} ${x} ${y - 5 * s} Z`;
  return (
    <WardrobeCanvas size={size} tones={['lemon', 'sky', 'brown']} shadowWidth={34}>
      {(paint) => (
        <>
          <Path d={LONG_SLEEVE} fill={paint('lemon')} />
          <Path d={LONG_SLEEVE_R} fill={paint('lemon')} />
          {/* A-line body that flares to the hem. */}
          <Path
            d="M33 22 C38 19 44 18 50 18 C56 18 62 19 67 22 L71 36 L77 85 C77 89 74 91 70 91 L30 91 C26 91 23 89 23 85 L29 36 Z"
            fill={paint('lemon')}
          />
          {/* Pointed hood, up. */}
          <Lift d="M33 26 C31 12 40 3 50 3 C60 3 69 12 67 26 C61 31 39 31 33 26 Z" />
          <Path
            d="M33 26 C31 12 40 3 50 3 C60 3 69 12 67 26 C61 31 39 31 33 26 Z"
            fill={paint('lemon')}
          />
          <Path
            d="M39 25 C38 15 44 10 50 10 C56 10 62 15 61 25 C57 27 43 27 39 25 Z"
            fill={t.lemon.shade}
            opacity={0.75}
          />
          <Crease d="M50 30 L50 90" of="lemon" opacity={0.6} width={2} />
          {/* Toggles. */}
          {[44, 60, 76].map((y) => (
            <G key={y}>
              <Path d={`M44 ${y} L56 ${y}`} stroke={t.brown.shade} strokeWidth={1.2} />
              <Rect x={46} y={y - 1.8} width={8} height={3.6} rx={1.8} fill={paint('brown')} />
            </G>
          ))}
          <Crease d="M33 70 L43 70" of="lemon" opacity={0.6} width={2.2} />
          <Crease d="M57 70 L67 70" of="lemon" opacity={0.6} width={2.2} />
          {/* Wet shine. */}
          <Gloss cx={34} cy={52} rx={2.6} ry={16} rotate={8} opacity={0.75} />
          <Gloss cx={39} cy={11} rx={2.5} ry={5} rotate={-30} opacity={0.7} />
          <Gloss cx={17} cy={38} rx={1.8} ry={7} rotate={16} opacity={0.6} />
          <Path d={drop(14, 12, 1)} fill={paint('sky')} />
          <Path d={drop(86, 20, 0.9)} fill={paint('sky')} />
          <Path d={drop(90, 86, 0.75)} fill={paint('sky')} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Pajamas({ size }: WordArtProps) {
  // Top and trousers laid together, with moon and stars.
  const moon = (x: number, y: number, r: number) =>
    `M${x} ${y - r} C${x - r * 1.4} ${y - r * 0.6} ${x - r * 1.4} ${y + r * 0.9} ${x + r * 0.2} ${y + r} C${x - r * 0.5} ${y + r * 0.3} ${x - r * 0.6} ${y - r * 0.4} ${x} ${y - r} Z`;
  return (
    <WardrobeCanvas size={size} tones={['lavender', 'lemon', 'cream']} shadowWidth={40}>
      {(paint) => (
        <>
          {/* Trousers, behind on the right. */}
          <G transform="translate(42 38) scale(0.58)">
            <Path
              d="M26 6 L74 6 L77 86 C77 89 75 91 72 91 L57 91 C55 91 53 89 53 87 L50 38 L47 87 C47 89 45 91 43 91 L28 91 C25 91 23 89 23 86 Z"
              fill={paint('lavender')}
            />
            <Path
              d="M23 80 L47.4 80 L47 87 C47 89 45 91 43 91 L28 91 C25 91 23 89 23 86 Z"
              fill={paint('cream')}
            />
            <Path
              d="M52.6 80 L77 80 L77 86 C77 89 75 91 72 91 L57 91 C55 91 53 89 53 87 Z"
              fill={paint('cream')}
            />
            <Crease d="M27 14 L73 14" of="lavender" width={2.4} />
            <Path d={starPath(36, 40, 6)} fill={paint('lemon')} />
            <Path d={starPath(64, 60, 6)} fill={paint('lemon')} />
            <Path d={moon(63, 30, 6)} fill={paint('lemon')} />
            <Gloss cx={30} cy={30} rx={3} ry={12} rotate={4} />
          </G>
          {/* Top, in front on the left. */}
          <G transform="translate(-6 4) scale(0.72)">
            <LongTop paint={paint} of="lavender" />
            <Path
              d="M12.9 78 L28.5 79 L28 82 C28 84.5 26.5 86 24 86 L17 86 C13.5 86 11.5 84 12 80 Z"
              fill={paint('cream')}
            />
            <Path
              d={mirrorPath(
                'M12.9 78 L28.5 79 L28 82 C28 84.5 26.5 86 24 86 L17 86 C13.5 86 11.5 84 12 80 Z',
              )}
              fill={paint('cream')}
            />
            <Path
              d="M27 84 L73 84 L73 85 C73 89 70 91 66 91 L34 91 C30 91 27 89 27 85 Z"
              fill={paint('cream')}
            />
            {/* Round collar. */}
            <Path d="M50 22 C46 32 36 32 34 26 C34 20 40 17 44 16 Z" fill={paint('cream')} />
            <Path
              d={mirrorPath('M50 22 C46 32 36 32 34 26 C34 20 40 17 44 16 Z')}
              fill={paint('cream')}
            />
            <Path d={moon(38, 48, 7)} fill={paint('lemon')} />
            <Path d={starPath(62, 44, 7)} fill={paint('lemon')} />
            <Path d={starPath(40, 72, 6)} fill={paint('lemon')} />
            <Path d={starPath(63, 72, 5)} fill={paint('lemon')} />
            {[40, 56, 72].map((y) => (
              <SmallButton key={y} x={50} y={y} r={3} of="cream" />
            ))}
            <Gloss cx={18} cy={38} rx={2.5} ry={7} rotate={18} opacity={0.5} />
          </G>
        </>
      )}
    </WardrobeCanvas>
  );
}

// ---------------------------------------------------------------- bottoms and dresses

/** Long trousers with a waistband, laid flat. */
const PANTS =
  'M26 12 L74 12 L78 86 C78 89 76 91 73 91 L57 91 C55 91 53 89 53 87 L50 36 L47 87 C47 89 45 91 43 91 L27 91 C24 91 22 89 22 86 Z';

function Pants({ size }: WordArtProps) {
  const band = 'M25 10 C25 8 27 7 29 7 L71 7 C73 7 75 8 75 10 L75.4 18 L24.6 18 Z';
  return (
    <WardrobeCanvas size={size} tones={['denim', 'lemon']} shadowWidth={30}>
      {(paint) => (
        <>
          <Path d={PANTS} fill={paint('denim')} />
          {/* Turned-up hems. */}
          <Path
            d="M22.4 83 L47.3 83 L47 87 C47 89 45 91 43 91 L27 91 C24 91 22 89 22 86 Z"
            fill={t.sky.face}
          />
          <Path
            d="M52.7 83 L77.6 83 L78 86 C78 89 76 91 73 91 L57 91 C55 91 53 89 53 87 Z"
            fill={t.sky.face}
          />
          <Lift d={band} dx={0} dy={1.2} />
          <Path d={band} fill={paint('denim')} />
          {/* Stitching, pockets, fly. */}
          <Stitch d="M27 21 C33 22 37 26 38 31" of="lemon" />
          <Stitch d="M73 21 C67 22 63 26 62 31" of="lemon" />
          <Stitch d="M50 19 L50 30 C50 33 47 35 44 34" of="lemon" />
          <Stitch d="M24 82 L47.3 82" of="lemon" />
          <Stitch d="M52.7 82 L77.5 82" of="lemon" />
          <Crease d="M32 50 L34 62 M66 52 L64 64" of="denim" opacity={0.35} width={1.6} />
          {[30, 50, 70].map((x) => (
            <Rect
              key={x}
              x={x - 1.5}
              y={6.5}
              width={3}
              height={12}
              rx={1.5}
              fill={wardrobeTones.denim.face}
            />
          ))}
          <SmallButton x={50} y={12.5} r={3} of="lemon" />
          <Gloss cx={29} cy={40} rx={2.5} ry={14} rotate={4} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Shorts({ size }: WordArtProps) {
  const band = 'M20 34 C20 32 22 31 24 31 L76 31 C78 31 80 32 80 34 L80.6 44 L19.4 44 Z';
  return (
    <WardrobeCanvas size={size} tones={['mint', 'cream']} shadowWidth={38}>
      {(paint) => (
        <>
          {/* Short and wide legs: shorts, not trousers. */}
          <Path
            d="M20 40 L80 40 L87 81 C87.5 84 86 86 83 86 L58 86 C55 86 53.5 84 53 82 L50 62 L47 82 C46.5 84 45 86 42 86 L17 86 C14 86 12.5 84 13 81 Z"
            fill={paint('mint')}
          />
          <Path
            d="M14.2 76 L45.8 76 L47 82 C46.5 84 45 86 42 86 L17 86 C14 86 12.5 84 13 81 Z"
            fill={t.mint.shade}
            opacity={0.3}
          />
          <Path
            d="M54.2 76 L85.8 76 L87 81 C87.5 84 86 86 83 86 L58 86 C55 86 53.5 84 53 82 Z"
            fill={t.mint.shade}
            opacity={0.3}
          />
          <Lift d={band} dx={0} dy={1.2} />
          <Path d={band} fill={paint('mint')} />
          <Crease
            d={Array.from(
              { length: 15 },
              (_, i) => `M${23 + i * 3.8} 33.5 L${23 + i * 3.8} 41.5`,
            ).join(' ')}
            of="mint"
            opacity={0.35}
            width={1}
          />
          <Crease d="M50 45 L50 60" of="mint" opacity={0.5} />
          <Crease d="M23 47 C29 48 33 51 34 56" of="mint" opacity={0.5} />
          <Crease d="M77 47 C71 48 67 51 66 56" of="mint" opacity={0.5} />
          {/* Drawstring bow. */}
          <Path
            d="M47 38 C44 46 42 52 40 58 M53 38 C56 46 58 52 61 57"
            stroke={tone('cream').face}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={40} cy={58.5} r={2.2} fill={paint('cream')} />
          <Circle cx={61} cy={57.5} r={2.2} fill={paint('cream')} />
          <Circle cx={47} cy={38} r={1.8} fill={t.mint.shade} />
          <Circle cx={53} cy={38} r={1.8} fill={t.mint.shade} />
          <Gloss cx={24} cy={56} rx={3} ry={9} rotate={10} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Skirt({ size }: WordArtProps) {
  const band = 'M30 24 C30 22 32 21 34 21 L66 21 C68 21 70 22 70 24 L70 33 L30 33 Z';
  return (
    <WardrobeCanvas size={size} tones={['berry', 'lemon']} shadowWidth={38}>
      {(paint) => (
        <>
          {/* Pleated A-line skirt with a wavy hem. */}
          <Path
            d="M31 30 L69 30 L88 80 C89 84 87 87 83 87 C80 90 76 90 73 87 C70 90 66 90 63 87 C60 90 56 90 53 87 C50 90 46 90 43 87 C40 90 36 90 33 87 C30 90 26 90 23 87 C20 87 17 87 13 86 C11 84 11 82 12 80 Z"
            fill={paint('berry')}
          />
          {[
            'M38 33 L25 86',
            'M44 33 L38 87',
            'M50 33 L50 88',
            'M56 33 L62 87',
            'M62 33 L75 86',
          ].map((d) => (
            <Crease key={d} d={d} of="berry" opacity={0.4} width={2} />
          ))}
          <Lift d={band} dx={0} dy={1.2} />
          <Path d={band} fill={paint('berry')} />
          <SmallButton x={64} y={27} r={2.6} of="lemon" />
          <Gloss cx={27} cy={62} rx={3} ry={14} rotate={22} />
          <Gloss cx={37} cy={25} rx={4} ry={1.6} rotate={0} opacity={0.5} />
        </>
      )}
    </WardrobeCanvas>
  );
}

const DOTS: readonly (readonly [number, number])[] = [
  [36, 54],
  [50, 50],
  [64, 54],
  [29, 68],
  [43, 64],
  [57, 64],
  [71, 68],
  [24, 81],
  [37, 78],
  [50, 76],
  [63, 78],
  [76, 81],
];

function Dress({ size }: WordArtProps) {
  return (
    <WardrobeCanvas size={size} tones={['pink', 'berry', 'cream']} shadowWidth={36}>
      {(paint) => (
        <>
          {/* Puff sleeves, bodice and a twirly skirt: a dress, not a skirt. */}
          <Circle cx={33} cy={21} r={8} fill={paint('pink')} />
          <Circle cx={67} cy={21} r={8} fill={paint('pink')} />
          <Path
            d="M37 13 C39 12 41 13 42 15 C44 21 56 21 58 15 C59 13 61 12 63 13 C66 20 67 30 64 42 L36 42 C33 30 34 20 37 13 Z"
            fill={paint('pink')}
          />
          <Path
            d="M36 40 L64 40 C72 54 82 66 88 81 C89 85 87 88 83 88 L17 88 C13 88 11 85 12 81 C18 66 28 54 36 40 Z"
            fill={paint('pink')}
          />
          {DOTS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={2.4} fill={t.cream.light} opacity={0.95} />
          ))}
          <Crease
            d="M30 56 C26 66 22 76 20 86 M70 56 C74 66 78 76 80 86"
            of="pink"
            opacity={0.45}
          />
          {/* Sash with a bow. */}
          <Lift d="M35 38 L65 38 L65 45 L35 45 Z" dx={0} dy={1} />
          <Rect x={35} y={38} width={30} height={7} rx={3.5} fill={paint('berry')} />
          <Path d="M50 41.5 C44 34 37 36 38 41.5 C37 47 44 49 50 41.5 Z" fill={paint('berry')} />
          <Path d="M50 41.5 C56 34 63 36 62 41.5 C63 47 56 49 50 41.5 Z" fill={paint('berry')} />
          <Circle cx={50} cy={41.5} r={3} fill={paint('berry')} />
          <Gloss cx={42} cy={24} rx={2} ry={5} rotate={10} opacity={0.5} />
          <Gloss cx={30} cy={18} rx={2} ry={3} rotate={-30} opacity={0.6} />
          <Gloss cx={27} cy={66} rx={2.5} ry={10} rotate={30} opacity={0.5} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Swimsuit({ size }: WordArtProps) {
  return (
    <WardrobeCanvas size={size} tones={['turquoise', 'lemon', 'cream']} shadowWidth={26}>
      {(paint) => (
        <>
          {/* One piece: thin straps, scoop neck, leg holes cut high; no skirt, no sleeves. */}
          <Path
            d="M33 10 C34 7 39 7 40 10 L43 29 C46 35 54 35 57 29 L60 10 C61 7 66 7 67 10 L69 40 C70 52 67 60 74 71 C66 74 59 79 57 90 L43 90 C41 79 34 74 26 71 C33 60 30 52 31 40 Z"
            fill={paint('turquoise')}
          />
          {/* Wave band. */}
          <Path
            d="M31 54 C36 49 41 49 45 54 C49 59 54 59 58 54 C62 49 66 49 69.6 52 L70 60 C66 57 62 57 58 62 C54 67 49 67 45 62 C41 57 36 57 31.4 62 Z"
            fill={paint('lemon')}
          />
          <Path
            d="M32 66 C36 62 41 62 45 66 C49 70 54 70 58 66 C62 62 66 62 70 65"
            stroke={tone('cream').light}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.9}
          />
          <Gloss cx={37} cy={42} rx={2.5} ry={8} rotate={6} />
          <Gloss cx={35.5} cy={14} rx={1} ry={3} rotate={-8} opacity={0.5} />
        </>
      )}
    </WardrobeCanvas>
  );
}

// ---------------------------------------------------------------- feet

/** One winter boot from the side, toe to the right; (x, y) moves it. */
function Boot({ x, y, paint }: { x: number; y: number; paint: Paint }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path
        d="M9 6 L35 6 L36 28 C46 30 60 32 68 38 C74 42 75 50 70 50 L10 50 C7 50 6 47 6 44 Z"
        fill={paint('brown')}
      />
      {/* Thick sole with tread. */}
      <Path d="M5 46 L75 46 C75 51 72 55 68 55 L10 55 C7 55 5 52 5 46 Z" fill={paint('charcoal')} />
      <Crease
        d="M14 55 L14 52 M24 55 L24 52 M34 55 L34 52 M44 55 L44 52 M54 55 L54 52 M64 55 L64 52"
        of="charcoal"
        opacity={0.8}
        width={1.4}
      />
      {/* Laces. */}
      <Path
        d="M30 14 L37 20 M30 20 L37 14 M31 23 L39 29 M31 29 L39 23"
        stroke={t.cream.face}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Fur cuff. */}
      <Path
        d="M6 4 C6 0 9 -1 12 0 C14 -2 18 -2 20 0 C22 -2 26 -2 28 0 C30 -2 34 -2 36 0 C39 -1 41 1 40 4 C41 8 38 10 35 9 C33 11 29 11 27 9 C25 11 21 11 19 9 C17 11 13 11 11 9 C8 10 5 8 6 4 Z"
        fill={paint('cream')}
      />
      <Gloss cx={14} cy={24} rx={3} ry={8} rotate={6} />
    </G>
  );
}

function Boots({ size }: WordArtProps) {
  return (
    <WardrobeCanvas size={size} tones={['brown', 'charcoal', 'cream']} shadowWidth={40}>
      {(paint) => (
        <>
          <Boot x={20} y={24} paint={paint} />
          <Boot x={4} y={37} paint={paint} />
        </>
      )}
    </WardrobeCanvas>
  );
}

/** One house slipper seen from above, toe up; (x, y) is its centre. */
function Slipper({ x, y, turn, paint }: { x: number; y: number; turn: number; paint: Paint }) {
  const sole =
    'M0 -34 C11 -34 15 -22 14 -8 C13 8 13 26 0 32 C-13 26 -13 8 -14 -8 C-15 -22 -11 -34 0 -34 Z';
  return (
    <G transform={`translate(${x} ${y}) rotate(${turn})`}>
      {/* Sole edge, then the sole top. */}
      <Path d={sole} fill={t.tan.shade} transform="translate(0 3)" />
      <Path d={sole} fill={paint('tan')} />
      <Path
        d="M0 -26 C7 -26 9 -18 9 -8 C8 6 8 18 0 23 C-8 18 -8 6 -9 -8 C-9 -18 -7 -26 0 -26 Z"
        fill={t.tan.light}
        opacity={0.6}
      />
      {/* Fluffy band over the toes. */}
      <Lift d="M-15 -14 C-12 -30 12 -30 15 -14 L15 4 C8 0 -8 0 -15 4 Z" dy={2} />
      <Path d="M-15 -14 C-12 -30 12 -30 15 -14 L15 4 C8 0 -8 0 -15 4 Z" fill={paint('pink')} />
      <Circle cx={0} cy={-12} r={5} fill={paint('berry')} />
      <Gloss cx={-8} cy={-16} rx={2.5} ry={5} rotate={20} />
      <Gloss cx={-1.5} cy={-13.5} rx={1.3} ry={1.8} rotate={20} opacity={0.6} />
    </G>
  );
}

function Slippers({ size }: WordArtProps) {
  return (
    <WardrobeCanvas size={size} tones={['tan', 'pink', 'berry']} shadowWidth={36}>
      {(paint) => (
        <>
          <Slipper x={32} y={52} turn={-8} paint={paint} />
          <Slipper x={68} y={56} turn={8} paint={paint} />
        </>
      )}
    </WardrobeCanvas>
  );
}

/** One sock, cuff up, toe to the right; (x, y) moves it. */
function Sock({ x, y, paint }: { x: number; y: number; paint: Paint }) {
  const sock =
    'M0 4 C0 1 2 0 5 0 L21 0 C24 0 26 1 26 4 L26 30 C26 34 30 36 36 38 L44 40 C51 42 53 48 50 53 C47 58 40 58 32 57 L12 54 C4 53 0 47 0 40 Z';
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d={sock} fill={paint('lemon')} />
      {/* Stripes across the leg. */}
      <Rect x={0} y={14} width={26} height={5} fill={paint('berry')} />
      <Rect x={0} y={24} width={26} height={5} fill={paint('berry')} />
      {/* Heel and toe. */}
      <Path
        d="M0 40 C0 47 4 53 12 54 L14 54 C16 49 15 44 10 42 C6 40 2 40 0 40 Z"
        fill={paint('berry')}
      />
      <Path
        d="M44 40 C51 42 53 48 50 53 C48 56 45 57 42 57 C40 52 40 45 44 40 Z"
        fill={paint('berry')}
      />
      {/* Ribbed cuff. */}
      <Rect x={0} y={0} width={26} height={8} rx={3} fill={paint('cream')} />
      <Crease
        d="M5 1.5 L5 6.5 M9.5 1.5 L9.5 6.5 M14 1.5 L14 6.5 M18.5 1.5 L18.5 6.5 M23 1.5 L23 6.5"
        of="cream"
        opacity={0.7}
        width={1.1}
      />
      <Gloss cx={6} cy={30} rx={2.2} ry={7} rotate={4} />
    </G>
  );
}

function Socks({ size }: WordArtProps) {
  return (
    <WardrobeCanvas size={size} tones={['lemon', 'berry', 'cream']} shadowWidth={36}>
      {(paint) => (
        <>
          <Sock x={38} y={20} paint={paint} />
          <Sock x={16} y={34} paint={paint} />
        </>
      )}
    </WardrobeCanvas>
  );
}

// ---------------------------------------------------------------- accessories

function Hat({ size }: WordArtProps) {
  return (
    <WardrobeCanvas size={size} tones={['straw', 'berry', 'lemon']} shadowWidth={40}>
      {(paint) => (
        <>
          {/* Wide brim, round crown, ribbon with a flower. */}
          <Ellipse cx={50} cy={70} rx={46} ry={16} fill={paint('straw')} />
          <Ellipse cx={50} cy={67} rx={27} ry={7} fill={wardrobeTones.straw.shade} opacity={0.35} />
          <Path
            d="M24 66 C23 42 34 26 50 26 C66 26 77 42 76 66 C70 72 30 72 24 66 Z"
            fill={paint('straw')}
          />
          <Path
            d="M24.4 56 C32 61 68 61 75.6 56 L76 66 C70 72 30 72 24 66 Z"
            fill={paint('berry')}
          />
          {/* Woven straw. */}
          {[
            [38, 36],
            [50, 33],
            [62, 36],
            [33, 46],
            [45, 44],
            [57, 44],
            [68, 46],
            [16, 72],
            [28, 78],
            [42, 81],
            [58, 81],
            [72, 78],
            [84, 72],
          ].map(([x, y]) => (
            <Crease
              key={`${x}-${y}`}
              d={`M${x - 2.2} ${y} L${x + 2.2} ${y}`}
              of="straw"
              opacity={0.5}
              width={1.4}
            />
          ))}
          {/* Flower. */}
          {[0, 72, 144, 216, 288].map((a) => (
            <Circle
              key={a}
              cx={68 + 4.2 * Math.cos((a * Math.PI) / 180)}
              cy={61 + 4.2 * Math.sin((a * Math.PI) / 180)}
              r={3.4}
              fill={paint('lemon')}
            />
          ))}
          <Circle cx={68} cy={61} r={2.6} fill={paint('berry')} />
          <Gloss cx={36} cy={38} rx={4} ry={8} rotate={30} />
          <Gloss cx={18} cy={64} rx={7} ry={2.2} rotate={-12} opacity={0.5} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Scarf({ size }: WordArtProps) {
  // A knitted scarf tied as if around a neck: a loop and two hanging tails.
  const loop =
    'M50 16 C70 16 80 23 80 32 C80 41 70 48 50 48 C30 48 20 41 20 32 C20 23 30 16 50 16 Z M50 25 C36 25 30 28 30 32 C30 36 36 38 50 38 C64 38 70 36 70 32 C70 28 64 25 50 25 Z';
  const tailBack = 'M50 40 L66 42 L72 84 L57 86 Z';
  const tailFront = 'M34 38 L50 40 L46 88 L31 87 Z';
  return (
    <WardrobeCanvas size={size} tones={['mint', 'lemon']} shadowWidth={30}>
      {(paint) => (
        <>
          <Path d={tailBack} fill={paint('mint')} />
          {[56, 70].map((y) => (
            <Path
              key={y}
              d={`M${51.5 + (y - 42) * 0.14} ${y} L${66.5 + (y - 42) * 0.14} ${y + 1.5} L${67.2 + (y - 42) * 0.14} ${y + 6.5} L${52 + (y - 42) * 0.14} ${y + 5}`}
              fill={paint('lemon')}
            />
          ))}
          <Path d={loop} fill={paint('mint')} fillRule="evenodd" />
          <Lift d={tailFront} />
          <Path d={tailFront} fill={paint('mint')} />
          {[54, 68].map((y) => (
            <Path
              key={y}
              d={`M${33.3 - (y - 40) * 0.05} ${y} L${48.8 - (y - 40) * 0.08} ${y} L${48.4 - (y - 40) * 0.08} ${y + 5.5} L${33 - (y - 40) * 0.05} ${y + 5.5} Z`}
              fill={paint('lemon')}
            />
          ))}
          {/* Knot over the loop. */}
          <Ellipse cx={42} cy={41} rx={9} ry={7} fill={paint('mint')} />
          {/* Fringes. */}
          <Path
            d="M33 88 L32 94 M37 88 L36.5 94 M41 88 L41 94 M45 88 L45.5 93.5 M59 86 L60 92 M63 85.5 L64.2 91.5 M67 85 L68.4 91 M71 84.5 L72.6 90"
            stroke={tone('mint').face}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Crease
            d="M24 30 L24 36 M30 21 L30 27 M42 18 L42 24 M58 18 L58 24 M70 21 L70 27 M76 30 L76 36"
            of="mint"
            opacity={0.4}
            width={1.2}
          />
          <Gloss cx={30} cy={22} rx={5} ry={2} rotate={-20} />
          <Gloss cx={36} cy={52} rx={1.6} ry={8} rotate={4} opacity={0.5} />
        </>
      )}
    </WardrobeCanvas>
  );
}

/** One five-finger glove, palm up, thumb on the left; drawn round (0, 0). */
function Glove({ paint, flip = false }: { paint: Paint; flip?: boolean }) {
  const f = (d: string) => (flip ? mirrorPath(d, 0) : d);
  const fingers: readonly (readonly [number, number])[] = [
    [-10.5, -30],
    [-3.5, -35],
    [3.5, -34],
    [10.5, -28],
  ];
  return (
    <>
      <Path d={f('M-15 -2 C-21 -6 -26 -4 -26 1 C-26 5 -21 10 -14 14 Z')} fill={paint('sky')} />
      {fingers.map(([x, top]) => (
        <Rect
          key={x}
          x={(flip ? -x : x) - 3.6}
          y={top}
          width={7.2}
          height={-top}
          rx={3.6}
          fill={paint('sky')}
        />
      ))}
      <Path
        d="M-15 -8 C-15 -12 -12 -14 -8 -14 L8 -14 C12 -14 15 -12 15 -8 L15 14 C15 20 11 24 6 24 L-6 24 C-11 24 -15 20 -15 14 Z"
        fill={paint('sky')}
      />
      {/* Ribbed cuff. */}
      <Rect x={-14} y={22} width={28} height={12} rx={4} fill={paint('cream')} />
      <Crease
        d="M-9 24 L-9 32 M-4.5 24 L-4.5 32 M0 24 L0 32 M4.5 24 L4.5 32 M9 24 L9 32"
        of="cream"
        opacity={0.6}
        width={1.1}
      />
      <Path d={starPath(0, 6, 6)} fill={paint('lemon')} />
      <Gloss cx={-9} cy={-2} rx={2.2} ry={6} rotate={8} />
    </>
  );
}

function Gloves({ size }: WordArtProps) {
  return (
    <WardrobeCanvas size={size} tones={['sky', 'cream', 'lemon']} shadowWidth={38}>
      {(paint) => (
        <>
          <G transform="translate(31 56) rotate(-12)">
            <Glove paint={paint} />
          </G>
          <G transform="translate(69 56) rotate(12)">
            <Glove paint={paint} flip />
          </G>
        </>
      )}
    </WardrobeCanvas>
  );
}

function Belt({ size }: WordArtProps) {
  // A belt closed in a loop, buckle in front, the tail with its holes on the right.
  const band =
    'M50 32 C76 32 92 42 92 54 C92 66 76 74 50 74 C24 74 8 66 8 54 C8 42 24 32 50 32 Z M50 41 C30 41 18 47 18 54 C18 61 30 65 50 65 C70 65 82 61 82 54 C82 47 70 41 50 41 Z';
  const buckle =
    'M38 60 C38 58 39 57 41 57 L59 57 C61 57 62 58 62 60 L62 80 C62 82 61 83 59 83 L41 83 C39 83 38 82 38 80 Z M43 62 L43 78 L57 78 L57 62 Z';
  return (
    <WardrobeCanvas size={size} tones={['brown', 'lemon']} shadowWidth={42}>
      {(paint) => (
        <>
          <Path d={band} fill={paint('brown')} fillRule="evenodd" />
          <Stitch d="M50 35 C73 35 88 44 89 54" of="brown" opacity={0.6} width={1} />
          <Stitch d="M11 54 C12 44 27 35 50 35" of="brown" opacity={0.6} width={1} />
          {/* Tail end with holes. */}
          <Path
            d="M58 64 C70 64 80 63 86 61 C90 60 92 62 91 65 C89 69 84 72 74 73 L58 74 Z"
            fill={paint('brown')}
          />
          {[68, 75, 82].map((x) => (
            <Circle key={x} cx={x} cy={x === 82 ? 66.5 : 68} r={1.6} fill={t.brown.shade} />
          ))}
          <Lift d={buckle} />
          <Path d={buckle} fill={paint('lemon')} fillRule="evenodd" />
          <Rect x={49} y={60} width={2.6} height={14} rx={1.3} fill={t.lemon.shade} />
          <Gloss cx={22} cy={44} rx={8} ry={2.4} rotate={-28} opacity={0.5} />
          <Gloss cx={41} cy={64} rx={1.2} ry={4} rotate={0} opacity={0.8} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Glasses({ size }: WordArtProps) {
  const ring = (cx: number) =>
    `M${cx} 37 C${cx + 12} 37 ${cx + 20} 46 ${cx + 20} 57 C${cx + 20} 68 ${cx + 12} 77 ${cx} 77 C${cx - 12} 77 ${cx - 20} 68 ${cx - 20} 57 C${cx - 20} 46 ${cx - 12} 37 ${cx} 37 Z M${cx} 42.5 C${cx - 9} 42.5 ${cx - 14.5} 49 ${cx - 14.5} 57 C${cx - 14.5} 65 ${cx - 9} 71.5 ${cx} 71.5 C${cx + 9} 71.5 ${cx + 14.5} 65 ${cx + 14.5} 57 C${cx + 14.5} 49 ${cx + 9} 42.5 ${cx} 42.5 Z`;
  return (
    <WardrobeCanvas size={size} tones={['berry', 'glass']} shadowWidth={38}>
      {(paint) => (
        <>
          {/* Temples folded back behind the frame. */}
          <Path
            d="M10 50 C10 64 22 80 30 86"
            stroke={t.berry.shade}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M90 50 C90 64 78 80 70 86"
            stroke={t.berry.shade}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={29} cy={57} r={15} fill={paint('glass')} opacity={0.85} />
          <Circle cx={71} cy={57} r={15} fill={paint('glass')} opacity={0.85} />
          <Path
            d="M20 54 L28 46 M22 60 L33 49"
            stroke={artPalette.gloss}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={0.9}
          />
          <Path
            d="M62 54 L70 46 M64 60 L75 49"
            stroke={artPalette.gloss}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={0.9}
          />
          <Path
            d="M46 51 C47 44 53 44 54 51"
            stroke={paint('berry')}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d={ring(29)} fill={paint('berry')} fillRule="evenodd" />
          <Path d={ring(71)} fill={paint('berry')} fillRule="evenodd" />
          <Gloss cx={17} cy={47} rx={1.8} ry={4} rotate={-40} opacity={0.7} />
          <Gloss cx={59} cy={47} rx={1.8} ry={4} rotate={-40} opacity={0.7} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Bag({ size }: WordArtProps) {
  // School backpack: handle, rounded top with a zip, front pocket.
  return (
    <WardrobeCanvas size={size} tones={['orange', 'lemon', 'brown']} shadowWidth={32}>
      {(paint) => (
        <>
          <Path
            d="M42 22 C42 10 58 10 58 22"
            stroke={t.orange.shade}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
          {/* Shoulder straps peeking out at the sides. */}
          <Rect x={16} y={34} width={10} height={44} rx={5} fill={t.orange.shade} />
          <Rect x={74} y={34} width={10} height={44} rx={5} fill={t.orange.shade} />
          <Path
            d="M22 44 C22 28 34 20 50 20 C66 20 78 28 78 44 L78 82 C78 88 74 92 68 92 L32 92 C26 92 22 88 22 82 Z"
            fill={paint('orange')}
          />
          <Crease
            d="M27 42 C28 30 38 25 50 25 C62 25 72 30 73 42"
            of="orange"
            opacity={0.55}
            width={1.6}
            dash="1.6 1.6"
          />
          <Rect x={68.5} y={36} width={4} height={9} rx={2} fill={paint('lemon')} />
          <Lift d="M29 60 C29 56 32 54 36 54 L64 54 C68 54 71 56 71 60 L71 82 C71 86 68 88 64 88 L36 88 C32 88 29 86 29 82 Z" />
          <Path
            d="M29 60 C29 56 32 54 36 54 L64 54 C68 54 71 56 71 60 L71 82 C71 86 68 88 64 88 L36 88 C32 88 29 86 29 82 Z"
            fill={paint('orange')}
          />
          <Crease d="M33 61 L67 61" of="orange" opacity={0.55} width={1.4} dash="1.6 1.6" />
          <Rect x={58} y={59} width={4} height={9} rx={2} fill={paint('lemon')} />
          <Path
            d="M44 74 L56 74"
            stroke={t.orange.shade}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.5}
          />
          <Gloss cx={31} cy={36} rx={3} ry={8} rotate={30} />
          <Gloss cx={35} cy={66} rx={1.8} ry={5} rotate={6} opacity={0.5} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function Umbrella({ size }: WordArtProps) {
  const outer = 'M50 12 C26 12 8 28 6 50 Q17 44 28 50 C30 32 38 16 50 12 Z';
  const inner = 'M50 12 C38 16 30 32 28 50 Q39 44 50 50 Z';
  return (
    <WardrobeCanvas size={size} tones={['red', 'lemon', 'brown']} shadowWidth={24}>
      {(paint) => (
        <>
          <Path
            d="M50 48 L50 82 C50 90 40 91 39 84"
            stroke={paint('brown')}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d={outer} fill={paint('red')} />
          <Path d={inner} fill={paint('lemon')} />
          <Path d={mirrorPath(inner)} fill={paint('red')} />
          <Path d={mirrorPath(outer)} fill={paint('lemon')} />
          <Circle cx={50} cy={10} r={3.2} fill={paint('brown')} />
          <Gloss cx={26} cy={26} rx={3} ry={9} rotate={45} />
          <Gloss cx={43} cy={22} rx={1.6} ry={6} rotate={20} opacity={0.5} />
        </>
      )}
    </WardrobeCanvas>
  );
}

function ButtonArt({ size }: WordArtProps) {
  // One big four-hole button, sewn with a cross of thread.
  const holes: readonly (readonly [number, number])[] = [
    [42, 47],
    [58, 47],
    [42, 63],
    [58, 63],
  ];
  return (
    <WardrobeCanvas size={size} tones={['sky', 'berry']} shadowWidth={28}>
      {(paint) => (
        <>
          <Circle cx={50} cy={55} r={36} fill={paint('sky')} />
          {/* Dished middle. */}
          <Circle cx={50} cy={55} r={26} fill={t.sky.shade} opacity={0.35} />
          <Circle cx={51} cy={56.5} r={24.5} fill={paint('sky')} />
          {holes.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={4.6} fill={t.sky.shade} />
          ))}
          <Path
            d="M42 47 L58 63 M58 47 L42 63"
            stroke={t.berry.face}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Path
            d="M41 46 L49 54 M57 46 L52 51"
            stroke={t.berry.light}
            strokeWidth={1.3}
            strokeLinecap="round"
            opacity={0.8}
          />
          <Gloss cx={30} cy={36} rx={5} ry={10} rotate={40} />
        </>
      )}
    </WardrobeCanvas>
  );
}

/** Inner edge of the open left tape of the zipper. */
const ZIP_OPEN: readonly [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
] = [
  [47, 48],
  [47, 34],
  [40, 20],
  [30, 6],
];

function Zipper({ size }: WordArtProps) {
  // Half open: teeth meet below the slider and part above it.
  const tape = 'M34 92 L34 50 C34 38 26 24 16 10 L30 5 C40 19 47 34 47 48 L49 92 Z';
  const openTeeth = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.92].map((k) => onCurve(...ZIP_OPEN, k));
  const closedTeeth = Array.from({ length: 9 }, (_, i) => 54 + i * 4.4);
  return (
    <WardrobeCanvas size={size} tones={['berry', 'metal', 'lemon']} shadowWidth={26}>
      {(paint) => (
        <>
          <Path d={tape} fill={paint('berry')} />
          <Path d={mirrorPath(tape)} fill={paint('berry')} />
          <Stitch d="M37 90 L37 52 C37 40 30 27 21 14" of="berry" opacity={0.7} />
          <Stitch d={mirrorPath('M37 90 L37 52 C37 40 30 27 21 14')} of="berry" opacity={0.7} />
          {openTeeth.map(({ x, y, angle }) => (
            <G key={`${x}`}>
              <Rect
                x={x - 3}
                y={y - 2}
                width={7}
                height={4}
                rx={1.6}
                fill={paint('metal')}
                transform={`rotate(${angle - 90} ${x} ${y})`}
              />
              <Rect
                x={100 - x - 4}
                y={y - 2}
                width={7}
                height={4}
                rx={1.6}
                fill={paint('metal')}
                transform={`rotate(${90 - angle} ${100 - x} ${y})`}
              />
            </G>
          ))}
          {closedTeeth.map((y, i) => (
            <Rect
              key={y}
              x={i % 2 === 0 ? 44.5 : 48.5}
              y={y}
              width={7}
              height={3.6}
              rx={1.5}
              fill={paint('metal')}
            />
          ))}
          {/* Slider and its pull tab. */}
          <Lift d="M39 40 C39 38 40 37 42 37 L58 37 C60 37 61 38 61 40 L58 54 C57.5 56 56 57 54 57 L46 57 C44 57 42.5 56 42 54 Z" />
          <Path
            d="M39 40 C39 38 40 37 42 37 L58 37 C60 37 61 38 61 40 L58 54 C57.5 56 56 57 54 57 L46 57 C44 57 42.5 56 42 54 Z"
            fill={paint('metal')}
          />
          <Lift d="M45.5 50 L54.5 50 L56.5 69 C56.5 73.5 43.5 73.5 43.5 69 Z M47.6 61 L47.6 66 C47.6 68.4 52.4 68.4 52.4 66 L52.4 61 C52.4 58.6 47.6 58.6 47.6 61 Z" />
          <Path
            d="M45.5 50 L54.5 50 L56.5 69 C56.5 73.5 43.5 73.5 43.5 69 Z M47.6 61 L47.6 66 C47.6 68.4 52.4 68.4 52.4 66 L52.4 61 C52.4 58.6 47.6 58.6 47.6 61 Z"
            fill={paint('lemon')}
            fillRule="evenodd"
          />
          <Circle cx={50} cy={50} r={3} fill={t.grey.shade} />
          <Gloss cx={43} cy={42} rx={2} ry={3.5} rotate={20} opacity={0.7} />
          <Gloss cx={46} cy={56} rx={1} ry={3} rotate={4} opacity={0.6} />
          <Gloss cx={25} cy={22} rx={1.6} ry={7} rotate={-35} opacity={0.5} />
        </>
      )}
    </WardrobeCanvas>
  );
}

export const wardrobeArt = {
  'clothes.shirt': Shirt,
  'clothes.tshirt': TShirt,
  'clothes.pants': Pants,
  'clothes.shorts': Shorts,
  'clothes.skirt': Skirt,
  'clothes.dress': Dress,
  'clothes.coat': Coat,
  'clothes.jacket': Jacket,
  'clothes.sweater': Sweater,
  'clothes.pajamas': Pajamas,
  'clothes.swimsuit': Swimsuit,
  'clothes.raincoat': Raincoat,
  'clothes.boots': Boots,
  'clothes.slippers': Slippers,
  'clothes.socks': Socks,
  'clothes.hat': Hat,
  'clothes.scarf': Scarf,
  'clothes.gloves': Gloves,
  'clothes.belt': Belt,
  'clothes.glasses': Glasses,
  'clothes.bag': Bag,
  'clothes.umbrella': Umbrella,
  'clothes.button': ButtonArt,
  'clothes.zipper': Zipper,
} satisfies WordArtMap;
