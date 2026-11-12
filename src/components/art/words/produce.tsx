import { useId, type ReactNode } from 'react';
import { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Fruit, vegetables and drinks of the 2–7 mode. Same clay rules as the pilot
// (food.tsx): light from the top left, gloss there, shared ground shadow, no
// outlines.
//
// Some foods need colours the shared palette does not have (leaf green,
// purple, peach). They are mixed here from artPalette tones instead of new hex
// values, so they stay in the family of the rest of the set.

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

/** `a` blended toward `b` by `t` (0 = a, 1 = b). */
export function mixColor(a: string, b: string, t: number): string {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

function toHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === rn
      ? (gn - bn) / d + (gn < bn ? 6 : 0)
      : max === gn
        ? (bn - rn) / d + 2
        : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return toHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}

/** Same colour with its hue turned by `hue` degrees and lightness moved by `light`. */
export function shiftColor(hex: string, hue: number, light = 0): string {
  const [h, s, l] = toHsl(toRgb(hex));
  return fromHsl((((h + hue) % 360) + 360) % 360, s, Math.min(1, Math.max(0, l + light)));
}

const mixTone = (a: ClayTone, b: ClayTone, t: number): ClayTone => ({
  light: mixColor(a.light, b.light, t),
  face: mixColor(a.face, b.face, t),
  shade: mixColor(a.shade, b.shade, t),
});

const shiftTone = (a: ClayTone, hue: number, light = 0): ClayTone => ({
  light: shiftColor(a.light, hue, light),
  face: shiftColor(a.face, hue, light),
  shade: shiftColor(a.shade, hue, light),
});

const t = artPalette.tones;
const leaf = mixTone(t.mint, t.lemon, 0.35);
const purple = mixTone(shiftTone(t.berry, -62, -0.04), t.charcoal, 0.12);

/** Food colours mixed from the shared art palette. */
export const produceTones = {
  /** Leaves, stems, peas. */
  leaf,
  /** Cucumber skin, pineapple crown, cherry stems. */
  darkLeaf: mixTone(leaf, t.charcoal, 0.3),
  pea: mixTone(leaf, t.lemon, 0.15),
  pear: mixTone(t.lemon, leaf, 0.45),
  /** Grapes. */
  purple,
  /** Plum: deeper and bluer than grapes. */
  plum: mixTone(shiftTone(t.berry, -78, -0.1), t.charcoal, 0.3),
  fig: mixTone(shiftTone(t.berry, -50, -0.1), t.brown, 0.45),
  figFlesh: mixTone(t.pink, t.red, 0.45),
  /** Peach: pink-orange with a blush. */
  peach: mixTone(t.pink, t.orange, 0.5),
  /** Apricot: golden orange, no pink. */
  apricot: mixTone(t.orange, t.lemon, 0.35),
  apricotFlesh: mixTone(t.orange, t.lemon, 0.65),
  pineapple: mixTone(t.lemon, t.ginger, 0.5),
  /** Hazelnut shell: warmer and lighter than a chestnut. */
  hazel: mixTone(t.brown, t.ginger, 0.4),
  potato: mixTone(t.tan, t.brown, 0.22),
  onion: mixTone(t.ginger, t.brown, 0.4),
  mushroom: mixTone(t.tan, t.brown, 0.5),
  /** Turkish tea ("tavşan kanı"): deep red-amber. */
  tea: mixTone(t.red, t.brown, 0.55),
} satisfies Record<string, ClayTone>;

type ProduceToneName = keyof typeof produceTones;
type ToneName = ArtToneName | ProduceToneName;
type Paint = (tone: ToneName) => string;

const isProduceTone = (tone: ToneName): tone is ProduceToneName =>
  Object.hasOwn(produceTones, tone);

/** WordCanvas that also knows the food tones above. */
function ProduceCanvas({
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
  const prefix = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const base = tones.filter((tone): tone is ArtToneName => !isProduceTone(tone));
  const extra = tones.filter(isProduceTone);
  return (
    <WordCanvas size={size} tones={base} shadowWidth={shadowWidth}>
      {(fill) => (
        <>
          <Defs>
            {extra.map((tone) => (
              <ClayGradient key={tone} id={`${prefix}-${tone}`} tone={produceTones[tone]} />
            ))}
          </Defs>
          {children((tone) => (isProduceTone(tone) ? `url(#${prefix}-${tone})` : fill(tone)))}
        </>
      )}
    </WordCanvas>
  );
}

/** Thin line drawn in the darker stop of a tone (creases, ribs, grooves). */
function Crease({
  d,
  tone,
  opacity = 0.45,
  width = 2,
}: {
  d: string;
  tone: ClayTone;
  opacity?: number;
  width?: number;
}) {
  return (
    <Path
      d={d}
      stroke={tone.shade}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
    />
  );
}

const p = produceTones;

// ---------------------------------------------------------------- fruit

function Pear({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['pear', 'leaf', 'brown']} shadowWidth={26}>
      {(paint) => (
        <>
          <Path
            d="M50 19 C59 19 61 27 62 37 C63 47 77 53 77 69 C77 85 65 92 50 92 C35 92 23 85 23 69 C23 53 37 47 38 37 C39 27 41 19 50 19 Z"
            fill={paint('pear')}
          />
          <Path
            d="M50 21 C50 15 51 11 54 7"
            stroke={paint('brown')}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M53 15 C59 5 71 6 76 10 C70 19 59 20 53 15 Z" fill={paint('leaf')} />
          <Gloss cx={34} cy={64} rx={5} ry={10} rotate={15} />
          <Gloss cx={44} cy={34} rx={2.5} ry={5} rotate={10} opacity={0.45} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Cherry({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['red', 'leaf', 'darkLeaf']} shadowWidth={34}>
      {(paint) => (
        <>
          {/* Two cherries on stems joined at the top. */}
          <Path
            d="M32 58 C34 40 44 24 56 12 M68 60 C66 42 62 26 56 12"
            stroke={paint('darkLeaf')}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M56 13 C62 3 78 4 84 10 C76 20 62 20 56 13 Z" fill={paint('leaf')} />
          <Circle cx={31} cy={73} r={18} fill={paint('red')} />
          <Circle cx={68} cy={74} r={18} fill={paint('red')} />
          <Gloss cx={24} cy={66} rx={4} ry={6.5} rotate={25} />
          <Gloss cx={61} cy={67} rx={4} ry={6.5} rotate={25} />
        </>
      )}
    </ProduceCanvas>
  );
}

/** Bunch rows from the top: 4, 3, 2, 1 grapes. */
const GRAPES: readonly (readonly [number, number])[] = [
  [23, 31],
  [41, 30],
  [59, 30],
  [77, 31],
  [32, 47],
  [50, 47],
  [68, 47],
  [41, 63],
  [59, 63],
  [50, 79],
];

function Grapes({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['purple', 'leaf', 'brown']} shadowWidth={20}>
      {(paint) => (
        <>
          <Path
            d="M50 24 C50 16 51 11 54 6"
            stroke={paint('brown')}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M52 13 C44 3 30 4 25 9 C32 18 45 19 52 13 Z" fill={paint('leaf')} />
          {GRAPES.map(([x, y]) => (
            <G key={`${x}-${y}`}>
              <Circle cx={x} cy={y} r={11} fill={paint('purple')} />
              <Gloss cx={x - 4} cy={y - 4} rx={2} ry={3.5} rotate={30} opacity={0.5} />
            </G>
          ))}
        </>
      )}
    </ProduceCanvas>
  );
}

/** Pores of a citrus peel, as [x, y]. */
const ORANGE_PORES: readonly (readonly [number, number])[] = [
  [42, 34],
  [60, 38],
  [70, 50],
  [56, 54],
  [74, 66],
  [62, 72],
  [48, 80],
  [66, 84],
  [34, 76],
  [24, 62],
  [80, 54],
  [44, 64],
];

function Orange({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['orange', 'leaf', 'brown']} shadowWidth={30}>
      {(paint) => (
        <>
          <Circle cx={50} cy={57} r={35} fill={paint('orange')} />
          {ORANGE_PORES.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} fill={t.orange.shade} opacity={0.35} />
          ))}
          <Path d="M52 23 C57 10 71 8 78 12 C73 23 61 27 52 23 Z" fill={paint('leaf')} />
          <Circle cx={50} cy={23} r={3.2} fill={paint('brown')} />
          <Gloss cx={34} cy={42} rx={7} ry={11} rotate={30} />
        </>
      )}
    </ProduceCanvas>
  );
}

const STRAWBERRY_SEEDS: readonly (readonly [number, number])[] = [
  [30, 44],
  [44, 42],
  [58, 42],
  [72, 44],
  [24, 56],
  [38, 54],
  [52, 54],
  [66, 54],
  [78, 56],
  [32, 66],
  [46, 66],
  [60, 66],
  [72, 66],
  [40, 77],
  [54, 77],
  [64, 76],
  [48, 86],
];

function Strawberry({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['red', 'leaf', 'darkLeaf']} shadowWidth={22}>
      {(paint) => (
        <>
          <Path
            d="M50 92 C36 92 14 70 13 48 C12 32 27 25 50 29 C73 25 88 32 87 48 C86 70 64 92 50 92 Z"
            fill={paint('red')}
          />
          {STRAWBERRY_SEEDS.map(([x, y]) => (
            <Ellipse
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              rx={1.4}
              ry={2.2}
              fill={t.lemon.light}
              opacity={0.9}
            />
          ))}
          {/* Leafy cap: five rounded leaves around the stem. */}
          <Path
            d="M50 33 C40 37 26 36 22 30 C30 25 40 26 46 28 C40 22 38 16 41 12 C47 15 50 22 50 26 C50 22 53 15 59 12 C62 16 60 22 54 28 C60 26 70 25 78 30 C74 36 60 37 50 33 Z"
            fill={paint('leaf')}
          />
          <Path
            d="M50 27 C50 20 51 14 54 9"
            stroke={paint('darkLeaf')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={27} cy={48} rx={4} ry={8} rotate={25} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Watermelon({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['darkLeaf', 'cream', 'red']} shadowWidth={36}>
      {(paint) => (
        <>
          {/* A half-moon slice: green rind, pale band, red flesh, dark seeds. */}
          <Path d="M5 40 A45 52 0 0 0 95 40 Z" fill={paint('darkLeaf')} />
          <Path d="M10 40 A40 46 0 0 0 90 40 Z" fill={paint('cream')} />
          <Path d="M14 40 A36 41 0 0 0 86 40 Z" fill={paint('red')} />
          {[
            [32, 52, -30],
            [50, 56, 0],
            [68, 52, 30],
            [40, 68, -15],
            [60, 68, 15],
            [50, 46, 0],
          ].map(([x, y, r]) => (
            <Ellipse
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              rx={1.8}
              ry={3}
              fill={artPalette.ink}
              transform={`rotate(${r} ${x} ${y})`}
            />
          ))}
          <Gloss cx={28} cy={46} rx={9} ry={3} rotate={0} opacity={0.5} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Lemon({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['lemon']} shadowWidth={34}>
      {(paint) => (
        <>
          {/* Oval with a nub on both ends, lying slightly tilted; no leaf (the orange has one). */}
          <G transform="rotate(-16 50 62)">
            <Path
              d="M8 62 C8 59 11 57 14 56 C20 40 34 34 50 34 C66 34 80 40 86 56 C89 57 92 59 92 62 C92 65 89 67 86 68 C80 84 66 90 50 90 C34 90 20 84 14 68 C11 67 8 65 8 62 Z"
              fill={paint('lemon')}
            />
            {[
              [36, 48],
              [56, 46],
              [70, 56],
              [62, 72],
              [44, 78],
              [28, 70],
              [48, 62],
            ].map(([x, y]) => (
              <Circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill={t.lemon.shade} opacity={0.5} />
            ))}
          </G>
          <Gloss cx={34} cy={54} rx={10} ry={5} rotate={-25} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Peach({ size }: WordArtProps) {
  const blush = `b${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <ProduceCanvas size={size} tones={['peach', 'leaf', 'brown', 'red']} shadowWidth={30}>
      {(paint) => (
        <>
          {/* Round, with a seam down the front and two leaves. */}
          <Path
            d="M50 27 C43 22 13 24 12 57 C11 81 31 92 50 92 C69 92 89 81 88 57 C87 24 57 22 50 27 Z"
            fill={paint('peach')}
          />
          {/* Soft blush on the far side. */}
          <Defs>
            <RadialGradient id={blush} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={t.red.face} stopOpacity={0.3} />
              <Stop offset="1" stopColor={t.red.face} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={64} cy={64} rx={26} ry={28} fill={`url(#${blush})`} />
          <Crease d="M50 29 C38 44 38 72 48 90" tone={p.peach} opacity={0.55} width={2.5} />
          <Path
            d="M50 28 C49 22 50 18 52 15"
            stroke={paint('brown')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M52 18 C56 6 70 4 78 8 C72 18 60 22 52 18 Z" fill={paint('leaf')} />
          <Path d="M50 18 C44 8 32 8 26 12 C32 20 44 22 50 18 Z" fill={paint('leaf')} />
          <Gloss cx={28} cy={46} rx={5.5} ry={10} rotate={22} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Apricot({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['apricot', 'apricotFlesh', 'brown']} shadowWidth={38}>
      {(paint) => (
        <>
          {/* A whole apricot and a half with its stone, so it is not read as a peach. */}
          <Circle cx={36} cy={62} r={29} fill={paint('apricot')} />
          <Crease d="M38 34 C30 46 30 74 38 90" tone={p.apricot} opacity={0.5} width={2.2} />
          <Path
            d="M37 34 C37 29 38 26 40 23"
            stroke={paint('brown')}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={22} cy={50} rx={4.5} ry={8} rotate={22} />
          <Circle cx={68} cy={71} r={22} fill={paint('apricot')} />
          <Circle cx={68} cy={71} r={18.5} fill={paint('apricotFlesh')} />
          <Ellipse cx={68} cy={72} rx={7} ry={9} fill={paint('brown')} />
          <Gloss cx={65} cy={68} rx={1.8} ry={3.5} rotate={15} opacity={0.45} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Fig({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['fig', 'figFlesh', 'cream', 'brown']} shadowWidth={38}>
      {(paint) => (
        <>
          {/* A whole fig (teardrop) and a cut half showing the pink inside. */}
          <Path
            d="M36 16 C41 16 42 23 44 31 C47 42 63 49 63 66 C63 83 50 91 36 91 C22 91 9 83 9 66 C9 49 25 42 28 31 C30 23 31 16 36 16 Z"
            fill={paint('fig')}
          />
          <Path
            d="M36 18 C36 13 37 10 39 8"
            stroke={paint('brown')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={22} cy={60} rx={4} ry={9} rotate={18} />
          <Path
            d="M70 38 C74 38 75 45 77 51 C80 60 93 64 93 77 C93 87 83 92 70 92 C57 92 47 87 47 77 C47 64 60 60 63 51 C65 45 66 38 70 38 Z"
            fill={paint('fig')}
          />
          <Path
            d="M70 43 C72 43 73 49 74.5 54 C77 62 89 66 89 77 C89 85 81 89 70 89 C59 89 51 85 51 77 C51 66 63 62 65.5 54 C67 49 68 43 70 43 Z"
            fill={paint('figFlesh')}
          />
          <Ellipse cx={70} cy={76} rx={8} ry={9} fill={paint('cream')} />
          {[
            [67, 72],
            [73, 73],
            [70, 78],
            [66, 80],
            [74, 80],
            [70, 70],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill={t.terracotta.shade} />
          ))}
        </>
      )}
    </ProduceCanvas>
  );
}

function Plum({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['plum', 'brown']} shadowWidth={26}>
      {(paint) => (
        <>
          {/* Upright egg, deep blue-violet, a seam and a short stem; no leaves. */}
          <Path
            d="M50 24 C70 22 82 40 82 60 C82 80 68 92 50 92 C32 92 18 80 18 60 C18 40 30 22 50 24 Z"
            fill={paint('plum')}
          />
          <Crease d="M50 26 C60 42 62 70 54 90" tone={p.plum} opacity={0.6} width={2.5} />
          <Path
            d="M50 26 C50 19 52 14 56 10"
            stroke={paint('brown')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          {/* Pale bloom on the skin. */}
          <Gloss cx={34} cy={50} rx={9} ry={15} rotate={15} opacity={0.22} />
          <Gloss cx={32} cy={46} rx={4} ry={8} rotate={15} />
        </>
      )}
    </ProduceCanvas>
  );
}

/** Scale marks on the pineapple body, inside its oval. */
const PINEAPPLE_MARKS: readonly (readonly [number, number])[] = (() => {
  const marks: [number, number][] = [];
  for (let row = 0; row < 8; row += 1) {
    const y = 44 + row * 6.5;
    for (let x = 30 + (row % 2) * 5; x <= 72; x += 10) {
      if (((x - 50) / 22) ** 2 + ((y - 65) / 25) ** 2 < 1) marks.push([x, y]);
    }
  }
  return marks;
})();

function Pineapple({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['pineapple', 'darkLeaf', 'leaf']} shadowWidth={26}>
      {(paint) => (
        <>
          {/* Crown of pointed leaves. */}
          <Path d="M50 42 C40 32 30 24 24 22 C34 22 42 28 48 36 Z" fill={paint('darkLeaf')} />
          <Path d="M50 42 C60 32 70 24 76 22 C66 22 58 28 52 36 Z" fill={paint('darkLeaf')} />
          <Path d="M46 42 C40 30 38 18 40 10 C46 18 50 30 50 40 Z" fill={paint('leaf')} />
          <Path d="M54 42 C60 30 62 18 60 10 C54 18 50 30 50 40 Z" fill={paint('leaf')} />
          <Path d="M47 40 C46 26 48 12 50 4 C52 12 54 26 53 40 Z" fill={paint('darkLeaf')} />
          <Ellipse cx={50} cy={65} rx={27} ry={28} fill={paint('pineapple')} />
          {PINEAPPLE_MARKS.map(([x, y]) => (
            <Path
              key={`${x}-${y}`}
              d={`M${x - 3.5} ${y - 1.5} L${x} ${y + 1.8} L${x + 3.5} ${y - 1.5}`}
              stroke={t.ginger.shade}
              strokeOpacity={0.55}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          <Gloss cx={35} cy={56} rx={4.5} ry={10} rotate={18} />
        </>
      )}
    </ProduceCanvas>
  );
}

function HazelNut({
  x,
  y,
  scale,
  paint,
  husk = false,
}: {
  x: number;
  y: number;
  scale: number;
  paint: Paint;
  husk?: boolean;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path
        d="M0 -26 C5 -21 22 -13 22 5 C22 19 12 26 0 26 C-12 26 -22 19 -22 5 C-22 -13 -5 -21 0 -26 Z"
        fill={paint('hazel')}
      />
      {/* Pale rough base where the nut sat in its husk. */}
      <Path
        d="M-17 15 C-10 22 10 22 17 15 C14 24 7 27 0 27 C-7 27 -14 24 -17 15 Z"
        fill={paint('tan')}
      />
      <Gloss cx={-10} cy={-4} rx={3.5} ry={8} rotate={20} />
      {husk ? (
        // Frilly green husk around the bottom, as on the branch.
        <Path
          d="M-25 2 L-20 -7 L-15 1 L-10 -8 L-4 0 L1 -8 L6 0 L11 -8 L16 1 L21 -7 L25 2 C27 19 15 29 0 29 C-15 29 -27 19 -25 2 Z"
          fill={paint('leaf')}
        />
      ) : null}
    </G>
  );
}

function Hazelnut({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['hazel', 'tan', 'leaf']} shadowWidth={34}>
      {(paint) => (
        <>
          {/* One nut still in its husk, one loose with its pale base: not a chestnut. */}
          <HazelNut x={34} y={58} scale={0.95} paint={paint} husk />
          <HazelNut x={64} y={66} scale={1} paint={paint} />
        </>
      )}
    </ProduceCanvas>
  );
}

// ---------------------------------------------------------------- vegetables

function Carrot({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['orange', 'leaf', 'darkLeaf']} shadowWidth={26}>
      {(paint) => (
        <G transform="rotate(32 50 56)">
          <Path d="M49 32 C42 22 36 12 38 4 C46 10 50 20 51 30 Z" fill={paint('darkLeaf')} />
          <Path d="M51 32 C58 22 66 14 64 6 C56 12 51 20 49 30 Z" fill={paint('leaf')} />
          <Path d="M48 32 C48 22 50 10 50 2 C52 10 53 22 52 32 Z" fill={paint('leaf')} />
          <Path
            d="M34 36 C34 28 66 28 66 36 C66 54 57 82 52 92 C51 95 49 95 48 92 C43 82 34 54 34 36 Z"
            fill={paint('orange')}
          />
          <Crease d="M38 46 L44 46" tone={t.orange} />
          <Crease d="M56 54 L62 54" tone={t.orange} />
          <Crease d="M41 64 L46 64" tone={t.orange} />
          <Crease d="M53 74 L57 74" tone={t.orange} />
          <Gloss cx={41} cy={42} rx={3} ry={7} rotate={-8} />
        </G>
      )}
    </ProduceCanvas>
  );
}

function Tomato({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['red', 'leaf', 'darkLeaf']} shadowWidth={34}>
      {(paint) => (
        <>
          {/* Wider than tall, with a star of green sepals; no stem leaf (unlike the apple). */}
          <Path
            d="M50 36 C66 30 90 38 90 62 C90 82 72 92 50 92 C28 92 10 82 10 62 C10 38 34 30 50 36 Z"
            fill={paint('red')}
          />
          <Crease d="M34 38 C26 52 28 74 36 88" tone={t.red} opacity={0.3} />
          <Crease d="M66 38 C74 52 72 74 64 88" tone={t.red} opacity={0.3} />
          <Path
            d="M50 30 L56 36 L70 34 L59 40 L64 50 L50 43 L36 50 L41 40 L30 34 L44 36 Z"
            fill={paint('leaf')}
            stroke={p.leaf.face}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Path
            d="M50 38 C50 32 51 28 53 24"
            stroke={paint('darkLeaf')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={27} cy={52} rx={5} ry={9} rotate={35} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Potato({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['potato']} shadowWidth={36}>
      {(paint) => (
        <>
          <Path
            d="M12 64 C10 48 24 38 42 40 C54 41 62 33 76 36 C90 40 93 56 88 70 C82 85 64 91 44 89 C26 88 14 78 12 64 Z"
            fill={paint('potato')}
          />
          {[
            [32, 54],
            [58, 48],
            [74, 62],
            [48, 72],
            [26, 76],
            [68, 80],
          ].map(([x, y]) => (
            <Crease
              key={`${x}-${y}`}
              d={`M${x - 2.5} ${y} Q${x} ${y + 2} ${x + 2.5} ${y}`}
              tone={p.potato}
              opacity={0.7}
              width={1.8}
            />
          ))}
          <Gloss cx={28} cy={50} rx={8} ry={4} rotate={-20} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Cucumber({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['darkLeaf', 'pear']} shadowWidth={36}>
      {(paint) => (
        <G transform="rotate(-24 50 62)">
          <Path
            d="M6 62 C6 52 18 49 50 49 C78 49 94 47 94 57 C94 69 80 75 50 75 C20 75 6 72 6 62 Z"
            fill={paint('darkLeaf')}
          />
          {/* Pale flower end on the left, stem nub on the right. */}
          <Ellipse cx={9} cy={62} rx={3} ry={5} fill={paint('pear')} />
          <Ellipse cx={94} cy={57} rx={2.5} ry={3.5} fill={p.darkLeaf.shade} />
          {[
            [22, 56],
            [36, 60],
            [50, 55],
            [64, 60],
            [78, 55],
            [28, 68],
            [44, 68],
            [60, 68],
            [74, 66],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.3} fill={p.leaf.light} opacity={0.7} />
          ))}
          <Gloss cx={40} cy={54} rx={18} ry={2.5} rotate={0} opacity={0.5} />
        </G>
      )}
    </ProduceCanvas>
  );
}

function Onion({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['onion', 'tan', 'brown']} shadowWidth={28}>
      {(paint) => (
        <>
          {/* Bulb with a dry pointed tip and short roots. */}
          <Path
            d="M50 16 C52 26 58 31 70 38 C84 47 89 61 84 74 C79 85 65 89 50 89 C35 89 21 85 16 74 C11 61 16 47 30 38 C42 31 48 26 50 16 Z"
            fill={paint('onion')}
          />
          <Path
            d="M50 18 C51 12 53 8 57 5"
            stroke={paint('brown')}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
          <Crease d="M48 24 C36 40 30 64 40 88" tone={p.onion} opacity={0.4} width={1.6} />
          <Crease d="M52 24 C64 40 70 64 60 88" tone={p.onion} opacity={0.4} width={1.6} />
          <Crease d="M50 26 C50 46 50 70 50 88" tone={p.onion} opacity={0.3} width={1.6} />
          <Path
            d="M44 89 L41 93 M48 89 L47 94 M52 89 L53 94 M56 89 L59 93"
            stroke={paint('tan')}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={30} cy={56} rx={5} ry={11} rotate={20} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Pepper({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['red', 'leaf', 'darkLeaf']} shadowWidth={28}>
      {(paint) => (
        <>
          {/* Bell pepper: taller than wide, three lobes at the bottom, thick curved stem. */}
          <Path
            d="M30 32 C20 38 17 54 19 70 C21 85 29 93 38 91 C44 90 46 87 50 87 C54 87 56 90 62 91 C71 93 79 85 81 70 C83 54 80 38 70 32 C62 27 56 31 50 31 C44 31 38 27 30 32 Z"
            fill={paint('red')}
          />
          <Crease d="M40 36 C35 52 36 74 42 88" tone={t.red} opacity={0.4} width={2.5} />
          <Crease d="M60 36 C65 52 64 74 58 88" tone={t.red} opacity={0.4} width={2.5} />
          <Ellipse cx={50} cy={32} rx={13} ry={5} fill={paint('leaf')} />
          <Path
            d="M50 32 C49 24 52 16 60 11"
            stroke={paint('darkLeaf')}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={28} cy={52} rx={4} ry={11} rotate={10} />
        </>
      )}
    </ProduceCanvas>
  );
}

/** Kernel highlights on the cob, inside its oval. */
const CORN_KERNELS: readonly (readonly [number, number])[] = (() => {
  const kernels: [number, number][] = [];
  for (let row = 0; row < 12; row += 1) {
    const y = 13 + row * 6;
    for (let x = 35 + (row % 2) * 3.5; x <= 66; x += 7) {
      if (((x - 50) / 15) ** 2 + ((y - 44) / 34) ** 2 < 0.85) kernels.push([x, y]);
    }
  }
  return kernels;
})();

function Corn({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['lemon', 'leaf', 'darkLeaf']} shadowWidth={24}>
      {(paint) => (
        <G transform="rotate(-14 50 60)">
          <Path
            d="M50 8 C62 8 68 24 68 46 C68 66 62 80 50 80 C38 80 32 66 32 46 C32 24 38 8 50 8 Z"
            fill={paint('lemon')}
          />
          {CORN_KERNELS.map(([x, y]) => (
            <Ellipse
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              rx={2.6}
              ry={2.2}
              fill={t.lemon.light}
              opacity={0.75}
            />
          ))}
          {/* Husk leaves wrapping the bottom. */}
          <Path d="M50 94 C32 92 18 72 22 38 C30 56 40 70 54 82 Z" fill={paint('leaf')} />
          <Path d="M50 94 C68 92 82 72 78 40 C70 58 60 70 46 82 Z" fill={paint('darkLeaf')} />
          <Gloss cx={40} cy={30} rx={2.5} ry={9} rotate={4} />
        </G>
      )}
    </ProduceCanvas>
  );
}

const PEAS: readonly (readonly [number, number])[] = [
  [24, 56],
  [38, 54],
  [52, 52],
  [66, 50],
  [80, 48],
];

function Peas({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['leaf', 'darkLeaf', 'pea']} shadowWidth={36}>
      {(paint) => (
        <>
          <G transform="rotate(-10 50 60)">
            {/* Open pod: back half, a row of peas, front half. */}
            <Path d="M8 58 C24 34 74 32 94 44 C80 50 40 58 8 58 Z" fill={paint('darkLeaf')} />
            {PEAS.map(([x, y]) => (
              <G key={x}>
                <Circle cx={x} cy={y} r={8} fill={paint('pea')} />
                <Gloss cx={x - 3} cy={y - 3} rx={1.6} ry={2.8} rotate={30} opacity={0.6} />
              </G>
            ))}
            <Path d="M8 58 C28 62 76 54 94 44 C86 72 34 86 8 58 Z" fill={paint('leaf')} />
            <Path
              d="M94 44 C97 40 97 35 94 31"
              stroke={paint('darkLeaf')}
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
            <Gloss cx={34} cy={68} rx={12} ry={2.5} rotate={-8} opacity={0.5} />
          </G>
          <Circle cx={82} cy={85} r={7} fill={paint('pea')} />
          <Gloss cx={79.5} cy={82.5} rx={1.6} ry={2.6} rotate={30} opacity={0.6} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Mushroom({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['mushroom', 'cream', 'tan']} shadowWidth={22}>
      {(paint) => (
        <>
          {/* Brown-capped edible mushroom (no red spotted cap). */}
          <Path
            d="M38 58 C38 72 34 84 36 89 C40 93 60 93 64 89 C66 84 62 72 62 58 Z"
            fill={paint('cream')}
          />
          <Path
            d="M10 56 C10 30 28 14 50 14 C72 14 90 30 90 56 C90 63 82 65 50 65 C18 65 10 63 10 56 Z"
            fill={paint('mushroom')}
          />
          <Ellipse cx={50} cy={62} rx={34} ry={4} fill={paint('tan')} />
          <Gloss cx={30} cy={32} rx={10} ry={5} rotate={-30} />
        </>
      )}
    </ProduceCanvas>
  );
}

function Pumpkin({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['orange', 'brown', 'leaf']} shadowWidth={38}>
      {(paint) => (
        <>
          {/* Ribs: overlapping ovals, each with its own clay shading. */}
          <Ellipse cx={27} cy={64} rx={21} ry={27} fill={paint('orange')} />
          <Ellipse cx={73} cy={64} rx={21} ry={27} fill={paint('orange')} />
          <Ellipse cx={39} cy={64} rx={21} ry={28} fill={paint('orange')} />
          <Ellipse cx={61} cy={64} rx={21} ry={28} fill={paint('orange')} />
          <Ellipse cx={50} cy={64} rx={18} ry={28} fill={paint('orange')} />
          <Path d="M46 40 C45 30 49 22 57 17 L62 21 C56 25 54 32 54 40 Z" fill={paint('brown')} />
          <Path d="M46 30 C38 20 26 20 20 26 C28 34 40 34 46 30 Z" fill={paint('leaf')} />
          <Path
            d="M58 30 C66 30 70 24 66 20 C63 18 60 22 63 24"
            stroke={paint('leaf')}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={44} cy={48} rx={3.5} ry={8} rotate={10} />
          <Gloss cx={18} cy={56} rx={3} ry={7} rotate={15} opacity={0.4} />
        </>
      )}
    </ProduceCanvas>
  );
}

// ---------------------------------------------------------------- drinks

/** Glass tumbler: wider at the top. Liquid is drawn by `children` between the glass and its rim. */
function Tumbler({
  paint,
  children,
  level = 32,
}: {
  paint: Paint;
  children: (liquid: string) => ReactNode;
  level?: number;
}) {
  // Inner wall, inset from the glass by 3; x grows 6 per 70 down from the rim.
  const wall = (y: number) => 27 + ((y - 18) * 6) / 70;
  const liquid = `M${wall(level)} ${level} L${100 - wall(level)} ${level} L${100 - wall(84)} 84 L${wall(84)} 84 Z`;
  return (
    <>
      <Path
        d="M23 18 L77 18 L71 88 C71 90.5 69 92 66.5 92 L33.5 92 C31 92 29 90.5 29 88 Z"
        fill={paint('glass')}
        opacity={0.75}
      />
      {children(liquid)}
      <Ellipse
        cx={50}
        cy={18}
        rx={27}
        ry={3.5}
        fill="none"
        stroke={t.glass.shade}
        strokeOpacity={0.8}
        strokeWidth={1.6}
      />
      <Gloss cx={30} cy={52} rx={2.2} ry={22} rotate={-4} opacity={0.75} />
    </>
  );
}

function Water({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['glass', 'sky']} shadowWidth={24}>
      {(paint) => (
        <Tumbler paint={paint}>
          {(liquid) => (
            <>
              {/* Clear: light blue and see-through. */}
              <Path d={liquid} fill={paint('sky')} opacity={0.45} />
              <Ellipse cx={50} cy={32} rx={22.8} ry={3} fill={t.sky.light} opacity={0.9} />
              <Circle cx={58} cy={62} r={2} fill={artPalette.gloss} opacity={0.8} />
              <Circle cx={63} cy={72} r={1.4} fill={artPalette.gloss} opacity={0.8} />
              <Circle cx={55} cy={76} r={1.1} fill={artPalette.gloss} opacity={0.8} />
            </>
          )}
        </Tumbler>
      )}
    </ProduceCanvas>
  );
}

function Milk({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['glass', 'cream']} shadowWidth={24}>
      {(paint) => (
        <Tumbler paint={paint} level={28}>
          {(liquid) => (
            <>
              {/* White and opaque, unlike the see-through blue water. */}
              <Path d={liquid} fill={paint('cream')} />
              <Ellipse cx={50} cy={28} rx={23} ry={3} fill={t.cream.light} />
            </>
          )}
        </Tumbler>
      )}
    </ProduceCanvas>
  );
}

function Juice({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['glass', 'orange', 'berry']} shadowWidth={24}>
      {(paint) => (
        <>
          <Path
            d="M56 60 L68 14 L80 6"
            stroke={paint('berry')}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Tumbler paint={paint}>
            {(liquid) => (
              <>
                <Path d={liquid} fill={paint('orange')} opacity={0.95} />
                <Ellipse cx={50} cy={32} rx={22.8} ry={3} fill={t.orange.light} />
              </>
            )}
          </Tumbler>
        </>
      )}
    </ProduceCanvas>
  );
}

function Tea({ size }: WordArtProps) {
  return (
    <ProduceCanvas size={size} tones={['glass', 'tea', 'cream', 'tan']} shadowWidth={34}>
      {(paint) => (
        <>
          {/* Saucer with a red rim; the tan underside lifts it off the cream card. */}
          <Ellipse cx={50} cy={89} rx={31} ry={5} fill={paint('tan')} />
          <Ellipse cx={50} cy={86} rx={35} ry={6.5} fill={paint('cream')} />
          <Ellipse
            cx={50}
            cy={85.5}
            rx={30}
            ry={5}
            fill="none"
            stroke={t.red.face}
            strokeWidth={1.5}
            opacity={0.8}
          />
          {/* Thin-waisted Turkish tea glass. */}
          <Path
            d="M30 12 C30 30 41 40 41 50 C41 62 34 70 35 78 C35.5 82 40 85 50 85 C60 85 64.5 82 65 78 C66 70 59 62 59 50 C59 40 70 30 70 12 Z"
            fill={paint('glass')}
            opacity={0.75}
          />
          <Path
            d="M32.6 22 C34 33 43 41 43 50 C43 62 36.5 70 37.2 77.5 C37.7 81 41 82.5 50 82.5 C59 82.5 62.3 81 62.8 77.5 C63.5 70 57 62 57 50 C57 41 66 33 67.4 22 Z"
            fill={paint('tea')}
            opacity={0.95}
          />
          <Ellipse cx={50} cy={22} rx={17.4} ry={2.5} fill={p.tea.light} opacity={0.9} />
          <Ellipse
            cx={50}
            cy={12}
            rx={20}
            ry={2.8}
            fill="none"
            stroke={t.glass.shade}
            strokeOpacity={0.8}
            strokeWidth={1.4}
          />
          <Gloss cx={37} cy={30} rx={1.8} ry={9} rotate={-28} opacity={0.75} />
          <Gloss cx={40} cy={70} rx={1.6} ry={7} rotate={20} opacity={0.6} />
        </>
      )}
    </ProduceCanvas>
  );
}

export const produceArt = {
  'fruit.pear': Pear,
  'fruit.cherry': Cherry,
  'fruit.grapes': Grapes,
  'fruit.orange': Orange,
  'fruit.strawberry': Strawberry,
  'fruit.watermelon': Watermelon,
  'fruit.lemon': Lemon,
  'fruit.peach': Peach,
  'fruit.apricot': Apricot,
  'fruit.fig': Fig,
  'fruit.plum': Plum,
  'fruit.pineapple': Pineapple,
  'fruit.hazelnut': Hazelnut,
  'vegetable.carrot': Carrot,
  'vegetable.tomato': Tomato,
  'vegetable.potato': Potato,
  'vegetable.cucumber': Cucumber,
  'vegetable.onion': Onion,
  'vegetable.pepper': Pepper,
  'vegetable.corn': Corn,
  'vegetable.peas': Peas,
  'vegetable.mushroom': Mushroom,
  'vegetable.pumpkin': Pumpkin,
  'drink.milk': Milk,
  'drink.water': Water,
  'drink.juice': Juice,
  'drink.tea': Tea,
} satisfies WordArtMap;
