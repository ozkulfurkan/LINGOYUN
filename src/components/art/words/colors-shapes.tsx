import { useId, type ReactNode } from 'react';
import { Circle, Defs, Path } from 'react-native-svg';

import { artPalette, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Colour and shape words of the 2–7 mode.
//
// Colours: every colour is the same clay paint blob (the irregular drop is the
// kids theme's signature shape), so the only thing that changes is the colour
// and the child learns the colour's name, not an object's. The blob is a thick
// lump: a darker rim under the face gives it depth. White gets a grey rim and a
// thin outline so it does not melt into the cream card; black is a cool
// charcoal, not pure black, and cooler than brown so the two stay apart.
//
// Shapes: every shape is the same sky-blue clay slab, so the child learns the
// outline, not the colour. Look-alikes have clearly different proportions:
// circle 1:1 vs oval ~1.7:1, square 1:1 vs rectangle ~1.9:1.

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

// Tones of this group, derived from the art palette so they stay in the same
// family. Kept here (not in artPalette) until another group needs them.
const deepBlue: ClayTone = {
  light: T.sky.face,
  face: T.sky.shade,
  shade: mix(T.sky.shade, T.charcoal.face, 0.4),
};

const paints = {
  red: T.red,
  /** A clear mid blue: the deep end of sky (sky itself is too pale for "blue"). */
  blue: deepBlue,
  yellow: T.lemon,
  /** Grass green: mint pulled towards yellow, so it is not read as turquoise. */
  green: mixTone(T.mint, T.lemon, 0.3),
  orange: T.orange,
  /** Purple: berry and deep blue, half and half. */
  purple: mixTone(T.berry, deepBlue, 0.55),
  pink: T.pink,
  brown: T.brown,
  /** Black: charcoal cooled with grey, so it is darker and less warm than brown. */
  black: {
    light: mix(T.charcoal.light, T.grey.shade, 0.3),
    face: mix(T.keremHair.face, T.grey.shade, 0.12),
    shade: T.keremHair.shade,
  },
  /** White: cream with a grey rim, so the blob stands out on the cream card. */
  white: {
    light: T.cream.light,
    face: mix(T.cream.light, T.grey.light, 0.35),
    shade: T.grey.face,
  },
  gray: T.grey,
  /** One tone for every shape. */
  shape: T.sky,
} satisfies Record<string, ClayTone>;

type PaintName = keyof typeof paints;

/** WordCanvas with the group's own tones; `fill(name)` is the gradient of a tone. */
function PaintCanvas({
  size,
  tone,
  shadowWidth,
  children,
}: {
  size?: number;
  tone: PaintName;
  shadowWidth?: number;
  children: (fill: string, flat: ClayTone) => ReactNode;
}) {
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}-${tone}`;
  return (
    <WordCanvas size={size} tones={[]} shadowWidth={shadowWidth}>
      {() => (
        <>
          <Defs>
            <ClayGradient id={id} tone={paints[tone]} />
          </Defs>
          {children(`url(#${id})`, paints[tone])}
        </>
      )}
    </WordCanvas>
  );
}

/** Depth of the darker rim under every blob and shape, in box units. */
const RIM = 3.5;

// ---------------------------------------------------------------- colours

/**
 * Closed smooth path through points around (cx, cy): radius `r` with `lobes`
 * soft bumps. Catmull-Rom through the samples, written as cubic Béziers.
 */
function lobedPath(cx: number, cy: number, r: number, lobes: number, depth: number): string {
  const n = lobes * 4;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    // Uneven bumps (a second, slower wave) so the blob looks hand-made.
    const rr = r * (1 + depth * Math.cos(lobes * a) + depth * 0.5 * Math.sin(2 * a + 1));
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92];
  });
  const f = (v: number) => v.toFixed(2);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d} Z`;
}

const BLOB = lobedPath(48, 52, 31, 6, 0.07);

/** A drop of paint, tip up, at (x, y) with width s. */
const drop = (x: number, y: number, s: number) =>
  `M${x} ${y} C${x + s * 0.2} ${y + s * 0.5} ${x + s * 0.5} ${y + s * 0.8} ${x + s * 0.5} ${y + s * 1.1} ` +
  `A${s * 0.5} ${s * 0.5} 0 0 1 ${x - s * 0.5} ${y + s * 1.1} ` +
  `C${x - s * 0.5} ${y + s * 0.8} ${x - s * 0.2} ${y + s * 0.5} ${x} ${y} Z`;

/** The same paint blob for every colour; only the tone changes. */
function paintBlob(tone: PaintName) {
  // White needs an outline to stay visible on the cream card.
  const outline = tone === 'white' ? T.grey.face : undefined;
  function Blob({ size }: WordArtProps) {
    return (
      <PaintCanvas size={size} tone={tone} shadowWidth={30}>
        {(fill, flat) => (
          <>
            <Path d={BLOB} fill={flat.shade} transform={`translate(0 ${RIM})`} />
            <Path d={BLOB} fill={fill} stroke={outline} strokeWidth={outline ? 1.2 : 0} />
            {/* Splashes: a drop flying off the top right, a dot beside it. */}
            <Path
              d={drop(84, 14, 9)}
              fill={fill}
              stroke={outline}
              strokeWidth={outline ? 1 : 0}
              transform="rotate(35 84 20)"
            />
            <Circle
              cx={88}
              cy={36}
              r={3.2}
              fill={fill}
              stroke={outline}
              strokeWidth={outline ? 0.8 : 0}
            />
            <Circle
              cx={14}
              cy={84}
              r={3.6}
              fill={fill}
              stroke={outline}
              strokeWidth={outline ? 0.8 : 0}
            />
            <Gloss cx={34} cy={36} rx={9} ry={5.5} />
            <Gloss cx={54} cy={30} rx={3.4} ry={2} opacity={0.45} />
          </>
        )}
      </PaintCanvas>
    );
  }
  Blob.displayName = `ColorBlob(${tone})`;
  return Blob;
}

// ---------------------------------------------------------------- shapes

/** Rounded five-pointed star centred on (cx, cy). */
function starPath(cx: number, cy: number, r: number): string {
  const points = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.48;
    return `${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`;
  });
  return `M${points.join(' L')} Z`;
}

type ShapeSpec = {
  /** Outline of the slab. */
  d: string;
  /** Extra round stroke that softens sharp corners (triangle, star). */
  round?: number;
  /** Gloss position on the lit top-left. */
  gloss: { cx: number; cy: number; rx: number; ry: number; rotate?: number };
  shadowWidth: number;
};

const SHAPES = {
  circle: {
    d: 'M50 18 A34 34 0 1 1 49.99 18 Z',
    gloss: { cx: 36, cy: 34, rx: 9, ry: 5.5 },
    shadowWidth: 28,
  },
  /** 1:1 (62 × 62). */
  square: {
    d: 'M31 22 H69 A12 12 0 0 1 81 34 V72 A12 12 0 0 1 69 84 H31 A12 12 0 0 1 19 72 V34 A12 12 0 0 1 31 22 Z',
    gloss: { cx: 32, cy: 33, rx: 7, ry: 4, rotate: -35 },
    shadowWidth: 32,
  },
  triangle: {
    d: 'M50 18 L84 80 L16 80 Z',
    round: 10,
    gloss: { cx: 40, cy: 44, rx: 7, ry: 3.4, rotate: -60 },
    shadowWidth: 36,
  },
  star: {
    d: starPath(50, 54, 38),
    round: 7,
    gloss: { cx: 40, cy: 40, rx: 5, ry: 3, rotate: -40 },
    shadowWidth: 30,
  },
  heart: {
    d: 'M50 84 C34 72 12 58 12 38 C12 24 22 16 32 16 C40 16 46 20 50 28 C54 20 60 16 68 16 C78 16 88 24 88 38 C88 58 66 72 50 84 Z',
    gloss: { cx: 26, cy: 30, rx: 7, ry: 4.5, rotate: -40 },
    shadowWidth: 22,
  },
  /** ~1.9:1 (86 × 46): unmistakably wider than the square. */
  rectangle: {
    d: 'M17 32 H83 A10 10 0 0 1 93 42 V68 A10 10 0 0 1 83 78 H17 A10 10 0 0 1 7 68 V42 A10 10 0 0 1 17 32 Z',
    gloss: { cx: 20, cy: 40, rx: 7, ry: 3, rotate: -15 },
    shadowWidth: 42,
  },
  /** ~1.7:1 (84 × 50): unmistakably flatter than the circle. */
  oval: {
    d: 'M8 56 A42 25 0 1 1 92 56 A42 25 0 1 1 8 56 Z',
    gloss: { cx: 26, cy: 44, rx: 9, ry: 4.5, rotate: -18 },
    shadowWidth: 40,
  },
} satisfies Record<string, ShapeSpec>;

type ShapeName = keyof typeof SHAPES;

function clayShape(name: ShapeName) {
  const spec: ShapeSpec = SHAPES[name];
  function Shape({ size }: WordArtProps) {
    return (
      <PaintCanvas size={size} tone="shape" shadowWidth={spec.shadowWidth}>
        {(fill, flat) => (
          <>
            <Path
              d={spec.d}
              fill={flat.shade}
              stroke={spec.round ? flat.shade : undefined}
              strokeWidth={spec.round ?? 0}
              strokeLinejoin="round"
              transform={`translate(0 ${RIM})`}
            />
            <Path
              d={spec.d}
              fill={fill}
              stroke={spec.round ? fill : undefined}
              strokeWidth={spec.round ?? 0}
              strokeLinejoin="round"
            />
            <Gloss {...spec.gloss} />
          </>
        )}
      </PaintCanvas>
    );
  }
  Shape.displayName = `ClayShape(${name})`;
  return Shape;
}

export const colorShapeArt = {
  'color.red': paintBlob('red'),
  'color.blue': paintBlob('blue'),
  'color.yellow': paintBlob('yellow'),
  'color.green': paintBlob('green'),
  'color.orange': paintBlob('orange'),
  'color.purple': paintBlob('purple'),
  'color.pink': paintBlob('pink'),
  'color.brown': paintBlob('brown'),
  'color.black': paintBlob('black'),
  'color.white': paintBlob('white'),
  'color.gray': paintBlob('gray'),
  'shape.circle': clayShape('circle'),
  'shape.square': clayShape('square'),
  'shape.triangle': clayShape('triangle'),
  'shape.star': clayShape('star'),
  'shape.heart': clayShape('heart'),
  'shape.rectangle': clayShape('rectangle'),
  'shape.oval': clayShape('oval'),
} satisfies WordArtMap;
