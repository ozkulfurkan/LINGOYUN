import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette } from '@/theme/artPalette';

import { type ClayFill, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Toys and playground things of the 2–7 mode. Same rules as toys.tsx (the
// pilot ball): lit from the top left, gloss there, one contact shadow, no
// outlines. Toy versions of real things (car, train) are drawn so they never
// pass for the real thing: bright toy colours, a wind-up key, wooden wheels.

const { ink, cheek, gloss } = artPalette;
const T = artPalette.tones;

/** Round dark eye with one white sparkle, the same as on the animals. */
function Eye({ cx, cy, r = 3 }: { cx: number; cy: number; r?: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={ink} />
      <Circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.32} fill={gloss} />
    </G>
  );
}

function Cheek({ cx, cy, r = 3.4 }: { cx: number; cy: number; r?: number }) {
  return <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.65} fill={cheek} opacity={0.6} />;
}

/** Closed path of a star with `points` tips around (cx, cy). */
export function starPath(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (Math.PI * i) / points;
    out.push(`${(cx + Math.cos(angle) * r).toFixed(1)} ${(cy + Math.sin(angle) * r).toFixed(1)}`);
  }
  return `M${out.join(' L')} Z`;
}

/** Tab of a jigsaw edge: 0 flat, 1 sticks out, -1 cut in. */
export type PuzzleEdge = -1 | 0 | 1;

/**
 * Jigsaw piece of side `s` at (x, y); edges are listed clockwise from the top.
 * Each tab is a bulb with a narrow neck, so the piece reads as a puzzle piece.
 */
export function puzzlePiecePath(
  x: number,
  y: number,
  s: number,
  edges: readonly [PuzzleEdge, PuzzleEdge, PuzzleEdge, PuzzleEdge],
): string {
  const corners: [number, number][] = [
    [x, y],
    [x + s, y],
    [x + s, y + s],
    [x, y + s],
  ];
  const normals: [number, number][] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  const f = (n: number) => String(Number(n.toFixed(2)));
  const parts = [`M${f(x)} ${f(y)}`];
  edges.forEach((tab, i) => {
    const [x0, y0] = corners[i];
    const [x1, y1] = corners[(i + 1) % 4];
    if (tab === 0) {
      parts.push(`L${f(x1)} ${f(y1)}`);
      return;
    }
    const [nx, ny] = normals[i];
    const at = (t: number, push = 0) =>
      `${f(x0 + (x1 - x0) * t + nx * push * tab)} ${f(y0 + (y1 - y0) * t + ny * push * tab)}`;
    const h = s * 0.4;
    parts.push(`L${at(0.36)}`, `C${at(0.2, h)} ${at(0.8, h)} ${at(0.64)}`, `L${f(x1)} ${f(y1)}`);
  });
  return `${parts.join(' ')} Z`;
}

// ─── Toys ───────────────────────────────────────────────────────────────────

/** Rag doll: yarn pigtails with bows, button eyes, dotted dress. */
function Doll({ size }: WordArtProps) {
  return (
    <WordCanvas
      size={size}
      tones={['tan', 'terracotta', 'berry', 'lemon', 'cream', 'sky']}
      shadowWidth={26}
    >
      {(fill) => (
        <>
          <Rect x={40} y={74} width={7} height={16} rx={3.5} fill={fill('cream')} />
          <Rect x={53} y={74} width={7} height={16} rx={3.5} fill={fill('cream')} />
          <Ellipse cx={42} cy={90} rx={6} ry={3.4} fill={fill('sky')} />
          <Ellipse cx={58} cy={90} rx={6} ry={3.4} fill={fill('sky')} />
          <Path
            d="M38 54 L25 66 M62 54 L75 66"
            stroke={fill('tan')}
            strokeWidth={7}
            strokeLinecap="round"
          />
          <Path
            d="M50 46 C41 46 37 52 35 62 L27 80 C38 86 62 86 73 80 L65 62 C63 52 59 46 50 46 Z"
            fill={fill('berry')}
          />
          {[
            [42, 62],
            [56, 60],
            [48, 72],
            [36, 76],
            [62, 74],
          ].map(([cx, cy]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.2} fill={T.cream.face} />
          ))}
          <Path d="M42 47 C44 53 56 53 58 47 C55 45 45 45 42 47 Z" fill={fill('cream')} />
          {/* Yarn pigtails behind the head, tied with bows. */}
          <Circle cx={29} cy={34} r={8} fill={fill('terracotta')} />
          <Circle cx={71} cy={34} r={8} fill={fill('terracotta')} />
          <Path d="M30 24 L23 19 L23 29 Z M30 24 L37 19 L37 29 Z" fill={fill('lemon')} />
          <Path d="M70 24 L63 19 L63 29 Z M70 24 L77 19 L77 29 Z" fill={fill('lemon')} />
          <Circle cx={50} cy={32} r={16} fill={fill('tan')} />
          <Path
            d="M34 32 C33 20 40 14 50 14 C60 14 67 20 66 32 C62 26 58 24 56 22 C52 26 44 28 34 32 Z"
            fill={fill('terracotta')}
          />
          {/* Button eyes and a stitched smile: a toy, not a child. */}
          <Circle cx={44} cy={33} r={3.2} fill={ink} />
          <Circle cx={56} cy={33} r={3.2} fill={ink} />
          <Circle cx={43} cy={32} r={1} fill={gloss} />
          <Circle cx={55} cy={32} r={1} fill={gloss} />
          <Path
            d="M44 39 C47 43 53 43 56 39"
            stroke={ink}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="2 1.6"
            fill="none"
          />
          <Cheek cx={39} cy={38} />
          <Cheek cx={61} cy={38} />
          <Gloss cx={42} cy={19} rx={5} ry={2.4} />
          <Gloss cx={42} cy={54} rx={4} ry={2} opacity={0.4} />
        </>
      )}
    </WordCanvas>
  );
}

/** Sitting teddy bear: round ears, light muzzle and belly, bow tie. */
function TeddyBear({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['brown', 'tan', 'berry']} shadowWidth={32}>
      {(fill) => (
        <>
          <Ellipse cx={50} cy={68} rx={23} ry={21} fill={fill('brown')} />
          <Ellipse cx={50} cy={71} rx={13} ry={13} fill={fill('tan')} />
          <Ellipse
            cx={27}
            cy={62}
            rx={7}
            ry={12}
            fill={fill('brown')}
            transform="rotate(30 27 62)"
          />
          <Ellipse
            cx={73}
            cy={62}
            rx={7}
            ry={12}
            fill={fill('brown')}
            transform="rotate(-30 73 62)"
          />
          <Ellipse cx={33} cy={84} rx={12} ry={8} fill={fill('brown')} />
          <Ellipse cx={67} cy={84} rx={12} ry={8} fill={fill('brown')} />
          <Ellipse cx={30} cy={85} rx={6} ry={5} fill={fill('tan')} />
          <Ellipse cx={70} cy={85} rx={6} ry={5} fill={fill('tan')} />
          <Circle cx={32} cy={19} r={8.5} fill={fill('brown')} />
          <Circle cx={68} cy={19} r={8.5} fill={fill('brown')} />
          <Circle cx={32} cy={19} r={4.5} fill={fill('tan')} />
          <Circle cx={68} cy={19} r={4.5} fill={fill('tan')} />
          <Circle cx={50} cy={34} r={19} fill={fill('brown')} />
          <Ellipse cx={50} cy={42} rx={9.5} ry={7.5} fill={fill('tan')} />
          <Ellipse cx={50} cy={39} rx={3.6} ry={2.6} fill={ink} />
          <Path
            d="M50 41.5 L50 44 M46 45 C48 47 52 47 54 45"
            stroke={ink}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Eye cx={42} cy={31} />
          <Eye cx={58} cy={31} />
          <Cheek cx={37} cy={40} r={3} />
          <Cheek cx={63} cy={40} r={3} />
          <Path d="M50 55 L39 49 L39 61 Z M50 55 L61 49 L61 61 Z" fill={fill('berry')} />
          <Circle cx={50} cy={55} r={3.4} fill={fill('berry')} />
          <Gloss cx={42} cy={22} rx={6} ry={3} />
          <Gloss cx={40} cy={58} rx={5} ry={2.4} opacity={0.4} />
        </>
      )}
    </WordCanvas>
  );
}

function ToyWheel({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: ClayFill }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={fill('charcoal')} />
      <Circle cx={cx} cy={cy} r={r * 0.5} fill={fill('lemon')} />
      <Circle cx={cx} cy={cy} r={r * 0.16} fill={T.lemon.shade} />
    </G>
  );
}

/**
 * Wind-up toy car: short and round, red, a big key on the roof and wheels too
 * big for it. The real car (vehicles.tsx) is long, blue and has two windows.
 */
function ToyCar({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['red', 'lemon', 'glass', 'charcoal', 'cream']} shadowWidth={34}>
      {(fill) => (
        <>
          {/* Butterfly key: stem into the roof, two round wings. */}
          <Rect x={47.5} y={14} width={5} height={16} rx={2} fill={fill('lemon')} />
          <Ellipse
            cx={42}
            cy={12}
            rx={7}
            ry={5}
            fill={fill('lemon')}
            transform="rotate(-12 42 12)"
          />
          <Ellipse
            cx={58}
            cy={12}
            rx={7}
            ry={5}
            fill={fill('lemon')}
            transform="rotate(12 58 12)"
          />
          <Path
            d="M16 72 C16 56 24 48 34 46 C38 34 44 28 56 28 C68 28 74 36 76 48 C86 50 90 58 90 68 C90 76 86 80 80 80 L22 80 C18 80 16 77 16 72 Z"
            fill={fill('red')}
          />
          <Path d="M42 47 C44 38 48 34 56 34 C64 34 68 40 69 47 Z" fill={fill('glass')} />
          <Path d="M18 64 L88 64" stroke={fill('lemon')} strokeWidth={5} strokeLinecap="round" />
          <Circle cx={84} cy={56} r={3.6} fill={fill('cream')} />
          <ToyWheel cx={32} cy={80} r={12} fill={fill} />
          <ToyWheel cx={72} cy={80} r={12} fill={fill} />
          <Gloss cx={48} cy={32} rx={6} ry={2.6} rotate={-15} />
          <Gloss cx={26} cy={54} rx={7} ry={3} rotate={-20} />
        </>
      )}
    </WordCanvas>
  );
}

function WoodWheel({ cx, fill }: { cx: number; fill: ClayFill }) {
  return (
    <G>
      <Circle cx={cx} cy={84} r={8} fill={fill('ginger')} />
      <Circle cx={cx} cy={84} r={2.6} fill={T.brown.face} />
    </G>
  );
}

/** Wooden pull-along train: an engine with a chimney and one wagon of blocks. */
function ToyTrain({ size }: WordArtProps) {
  return (
    <WordCanvas
      size={size}
      tones={['tan', 'ginger', 'berry', 'sky', 'mint', 'lemon', 'glass', 'orange']}
      shadowWidth={44}
    >
      {(fill) => (
        <>
          {/* Wagon with two building blocks. */}
          <Rect x={10} y={52} width={14} height={14} rx={3} fill={fill('lemon')} />
          <Rect x={26} y={52} width={12} height={14} rx={3} fill={fill('mint')} />
          <Rect x={17} y={39} width={13} height={13} rx={3} fill={fill('orange')} />
          <Rect x={4} y={64} width={38} height={12} rx={4} fill={fill('tan')} />
          <Rect x={38} y={68} width={12} height={4} rx={2} fill={T.brown.face} />
          {/* Engine. */}
          <Rect x={74} y={28} width={10} height={24} rx={3} fill={fill('lemon')} />
          <Rect x={71} y={24} width={16} height={7} rx={3.5} fill={fill('lemon')} />
          <Rect x={62} y={46} width={34} height={22} rx={10} fill={fill('mint')} />
          <Rect x={46} y={30} width={22} height={38} rx={4} fill={fill('berry')} />
          <Rect x={43} y={24} width={28} height={8} rx={4} fill={fill('sky')} />
          <Rect x={51} y={37} width={12} height={11} rx={3} fill={fill('glass')} />
          <Circle cx={95} cy={58} r={3} fill={fill('lemon')} />
          <Rect x={44} y={64} width={52} height={12} rx={4} fill={fill('tan')} />
          {[14, 32, 56, 84].map((cx) => (
            <WoodWheel key={cx} cx={cx} fill={fill} />
          ))}
          <Gloss cx={50} cy={34} rx={3} ry={1.6} rotate={-60} />
          <Gloss cx={70} cy={50} rx={6} ry={2.4} rotate={-10} />
          <Gloss cx={12} cy={66} rx={5} ry={1.6} rotate={0} opacity={0.5} />
        </>
      )}
    </WordCanvas>
  );
}

/** A cube in a light three-quarter view: front face, lit top, shaded side. */
function Cube({
  x,
  y,
  s,
  depth,
  tone,
  fill,
}: {
  x: number;
  y: number;
  s: number;
  depth: number;
  tone: 'berry' | 'sky' | 'lemon';
  fill: ClayFill;
}) {
  const d = depth;
  return (
    <G>
      <Path
        d={`M${x} ${y} L${x + d} ${y - d} L${x + s + d} ${y - d} L${x + s} ${y} Z`}
        fill={T[tone].light}
      />
      <Path
        d={`M${x + s} ${y} L${x + s + d} ${y - d} L${x + s + d} ${y + s - d} L${x + s} ${y + s} Z`}
        fill={T[tone].shade}
      />
      <Rect x={x} y={y} width={s} height={s} rx={2} fill={fill(tone)} />
    </G>
  );
}

/** Three toy building blocks, two side by side and one on top, with raised shapes. */
function Blocks({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['berry', 'sky', 'lemon']} shadowWidth={38}>
      {(fill) => (
        <>
          <Cube x={12} y={62} s={30} depth={7} tone="berry" fill={fill} />
          <Cube x={48} y={62} s={30} depth={7} tone="sky" fill={fill} />
          <Cube x={30} y={28} s={30} depth={7} tone="lemon" fill={fill} />
          <Circle cx={27} cy={77} r={8} fill={T.berry.light} opacity={0.8} />
          <Path
            d="M63 69 L72 85 L54 85 Z"
            fill={T.sky.light}
            opacity={0.8}
            strokeLinejoin="round"
          />
          <Path d={starPath(45, 44, 10, 4.4)} fill={T.lemon.shade} opacity={0.7} />
          <Gloss cx={18} cy={67} rx={4} ry={2} />
          <Gloss cx={36} cy={33} rx={4} ry={2} />
        </>
      )}
    </WordCanvas>
  );
}

const PUZZLE = { x: 18, y: 40, s: 26 };

/** Jigsaw puzzle: three pieces in place, the fourth lifted out above its gap. */
function Puzzle({ size }: WordArtProps) {
  const { x, y, s } = PUZZLE;
  return (
    <WordCanvas size={size} tones={['mint', 'sky', 'berry', 'lemon']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path d={puzzlePiecePath(x, y, s, [0, 1, -1, 0])} fill={fill('mint')} />
          <Path d={puzzlePiecePath(x, y + s, s, [1, -1, 0, 0])} fill={fill('sky')} />
          <Path d={puzzlePiecePath(x + s, y + s, s, [-1, 0, 0, 1])} fill={fill('berry')} />
          {/* The empty spot: a soft dent where the last piece goes. */}
          <Path
            d={puzzlePiecePath(x + s, y, s, [0, 0, 1, -1])}
            fill={T.cream.shade}
            opacity={0.5}
          />
          <G transform={`translate(18 -30) rotate(14 ${x + s * 1.5} ${y + s / 2})`}>
            <Path d={puzzlePiecePath(x + s, y, s, [0, 0, 1, -1])} fill={fill('lemon')} />
            <Gloss cx={x + s + 7} cy={y + 6} rx={4} ry={2} />
          </G>
          <Gloss cx={x + 7} cy={y + 6} rx={5} ry={2.4} />
        </>
      )}
    </WordCanvas>
  );
}

/** Diamond kite in four colours with a bow tail, flying on its string. */
function Kite({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['berry', 'lemon', 'sky', 'orange', 'brown']} shadowWidth={16}>
      {(fill) => (
        <>
          <Path d="M50 36 C44 54 30 70 6 90" stroke={T.brown.light} strokeWidth={1.2} fill="none" />
          <Path
            d="M56 66 C50 74 64 78 58 86"
            stroke={T.brown.face}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M52 72 L58 76 L52 78 Z M66 74 L60 76 L64 80 Z" fill={fill('berry')} />
          <Path d="M53 84 L58 86 L54 90 Z M64 82 L59 86 L64 89 Z" fill={fill('sky')} />
          <G transform="rotate(-14 50 36)">
            <Path d="M50 6 L50 36 L24 36 Z" fill={fill('berry')} />
            <Path d="M50 6 L76 36 L50 36 Z" fill={fill('lemon')} />
            <Path d="M24 36 L50 36 L50 72 Z" fill={fill('sky')} />
            <Path d="M50 36 L76 36 L50 72 Z" fill={fill('orange')} />
            <Path
              d="M50 6 L50 72 M24 36 L76 36"
              stroke={T.brown.face}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          </G>
          <Gloss cx={42} cy={22} rx={5} ry={2.4} rotate={-50} />
        </>
      )}
    </WordCanvas>
  );
}

/** One red party balloon with a knot and a curly string. */
function Balloon({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['red']} shadowWidth={14}>
      {(fill) => (
        <>
          <Path
            d="M50 68 C46 74 56 78 50 84 C46 88 52 90 50 92"
            stroke={T.grey.shade}
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M45 69 L55 69 L50 63 Z" fill={fill('red')} strokeLinejoin="round" />
          <Path
            d="M50 6 C66 6 76 18 76 33 C76 50 62 64 50 64 C38 64 24 50 24 33 C24 18 34 6 50 6 Z"
            fill={fill('red')}
          />
          <Gloss cx={38} cy={20} rx={7} ry={4} rotate={-40} />
          <Gloss cx={34} cy={34} rx={2} ry={3.6} rotate={10} opacity={0.4} />
        </>
      )}
    </WordCanvas>
  );
}

/** Toy drum from the side: drumhead on top, zig-zag cords, two sticks. */
function Drum({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['berry', 'lemon', 'cream', 'tan', 'sky']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path
            d="M43 46 L28 16 M57 46 L72 16"
            stroke={fill('tan')}
            strokeWidth={3.6}
            strokeLinecap="round"
          />
          <Circle cx={28} cy={15} r={4.4} fill={fill('sky')} />
          <Circle cx={72} cy={15} r={4.4} fill={fill('sky')} />
          <Path d="M17 50 L17 82 A33 9 0 0 0 83 82 L83 50 Z" fill={fill('berry')} />
          <Path
            d="M21 58 L30 82 L40 60 L50 85 L60 60 L70 82 L79 58"
            stroke={T.cream.face}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M17 82 A33 9 0 0 0 83 82" stroke={fill('lemon')} strokeWidth={6} fill="none" />
          <Ellipse cx={50} cy={50} rx={33} ry={9} fill={fill('lemon')} />
          <Ellipse cx={50} cy={49.5} rx={29} ry={6.5} fill={fill('cream')} />
          <Gloss cx={26} cy={62} rx={3} ry={8} rotate={0} opacity={0.45} />
          <Gloss cx={40} cy={47} rx={8} ry={1.8} rotate={0} />
        </>
      )}
    </WordCanvas>
  );
}

/** Friendly toy robot: boxy head with antenna, round eyes, buttons on the chest. */
function Robot({ size }: WordArtProps) {
  return (
    <WordCanvas
      size={size}
      tones={['grey', 'sky', 'berry', 'lemon', 'charcoal', 'cream']}
      shadowWidth={28}
    >
      {(fill) => (
        <>
          <Path d="M50 18 L50 9" stroke={T.grey.shade} strokeWidth={2.4} strokeLinecap="round" />
          <Circle cx={50} cy={8} r={4.4} fill={fill('berry')} />
          <Rect x={38} y={74} width={9} height={14} rx={3} fill={fill('grey')} />
          <Rect x={53} y={74} width={9} height={14} rx={3} fill={fill('grey')} />
          <Rect x={35} y={86} width={14} height={6} rx={3} fill={fill('charcoal')} />
          <Rect x={51} y={86} width={14} height={6} rx={3} fill={fill('charcoal')} />
          <Path
            d="M32 56 L21 64 L21 72 M68 56 L79 64 L79 72"
            stroke={fill('grey')}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx={21} cy={75} r={4.4} fill={fill('lemon')} />
          <Circle cx={79} cy={75} r={4.4} fill={fill('lemon')} />
          <Rect x={30} y={48} width={40} height={30} rx={8} fill={fill('sky')} />
          <Rect x={38} y={54} width={24} height={16} rx={4} fill={fill('cream')} />
          <Circle cx={45} cy={62} r={3.6} fill={fill('berry')} />
          <Circle cx={55} cy={62} r={3.6} fill={fill('lemon')} />
          <Rect x={27} y={26} width={6} height={12} rx={3} fill={fill('lemon')} />
          <Rect x={67} y={26} width={6} height={12} rx={3} fill={fill('lemon')} />
          <Rect x={31} y={17} width={38} height={30} rx={10} fill={fill('grey')} />
          <Circle cx={42} cy={30} r={6} fill={fill('cream')} />
          <Circle cx={58} cy={30} r={6} fill={fill('cream')} />
          <Eye cx={42} cy={30} r={3.4} />
          <Eye cx={58} cy={30} r={3.4} />
          <Rect x={42} y={39} width={16} height={4} rx={2} fill={T.charcoal.face} />
          <Path
            d="M46 39 L46 43 M50 39 L50 43 M54 39 L54 43"
            stroke={T.grey.light}
            strokeWidth={1}
          />
          <Gloss cx={38} cy={21} rx={5} ry={2} rotate={-10} />
          <Gloss cx={36} cy={51} rx={4} ry={1.6} rotate={-10} />
        </>
      )}
    </WordCanvas>
  );
}

/** Yo-yo seen a little from the side, hanging from its string and finger loop. */
function Yoyo({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['berry', 'lemon']} shadowWidth={22}>
      {(fill) => (
        <>
          <Path d="M50 40 L50 12" stroke={T.charcoal.face} strokeWidth={1.6} />
          <Ellipse
            cx={50}
            cy={8}
            rx={5}
            ry={4}
            stroke={T.charcoal.face}
            strokeWidth={1.6}
            fill="none"
          />
          <Ellipse cx={59} cy={62} rx={16} ry={27} fill={T.berry.shade} />
          <Rect x={44} y={56} width={14} height={12} rx={2} fill={T.charcoal.face} />
          <Ellipse cx={41} cy={62} rx={16} ry={27} fill={fill('berry')} />
          <Ellipse cx={42} cy={62} rx={9} ry={16} fill={fill('lemon')} />
          <Ellipse cx={42} cy={62} rx={3.4} ry={6} fill={fill('berry')} />
          <Gloss cx={34} cy={44} rx={3} ry={7} rotate={10} />
        </>
      )}
    </WordCanvas>
  );
}

const BUBBLES: readonly (readonly [number, number, number])[] = [
  [62, 40, 18],
  [84, 66, 10],
  [40, 17, 9],
  [84, 18, 6.5],
  [64, 76, 6],
];

/**
 * Soap bubbles from a wand. Bubbles are see-through: a thin blue rim, a pink
 * and yellow sheen and a gloss, so they do not vanish on the light card.
 */
function Bubbles({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['berry', 'glass']} shadowWidth={22}>
      {(fill) => (
        <>
          <Path d="M14 90 L29 64" stroke={fill('berry')} strokeWidth={5} strokeLinecap="round" />
          <Circle cx={33} cy={55} r={9} fill={T.glass.face} opacity={0.5} />
          <Circle cx={33} cy={55} r={9} stroke={fill('berry')} strokeWidth={3.6} fill="none" />
          {BUBBLES.map(([cx, cy, r]) => (
            <G key={`${cx}-${cy}`}>
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                fill={fill('glass')}
                fillOpacity={0.55}
                stroke={T.sky.face}
                strokeWidth={Math.max(1.2, r * 0.09)}
              />
              <Path
                d={`M${cx + r * 0.75} ${cy + r * 0.2} A${r * 0.78} ${r * 0.78} 0 0 1 ${cx + r * 0.1} ${cy + r * 0.77}`}
                stroke={T.pink.face}
                strokeWidth={Math.max(1, r * 0.14)}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={`M${cx + r * 0.2} ${cy - r * 0.76} A${r * 0.78} ${r * 0.78} 0 0 1 ${cx + r * 0.72} ${cy - r * 0.3}`}
                stroke={T.lemon.face}
                strokeWidth={Math.max(1, r * 0.12)}
                strokeLinecap="round"
                fill="none"
                opacity={0.8}
              />
              <Gloss
                cx={cx - r * 0.4}
                cy={cy - r * 0.42}
                rx={r * 0.3}
                ry={r * 0.16}
                opacity={0.9}
              />
            </G>
          ))}
        </>
      )}
    </WordCanvas>
  );
}

/** Playground slide from the side: ladder up, platform, curved chute down. */
function Slide({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['sky', 'lemon', 'orange', 'berry']} shadowWidth={44}>
      {(fill) => (
        <>
          <Rect x={13} y={22} width={5} height={70} rx={2.5} fill={T.sky.shade} />
          <Path
            d="M20 34 L36 34 M20 48 L36 48 M20 62 L36 62 M20 76 L36 76"
            stroke={T.sky.face}
            strokeWidth={3.6}
            strokeLinecap="round"
          />
          <Rect x={32} y={22} width={5} height={70} rx={2.5} fill={fill('sky')} />
          <Rect x={62} y={58} width={5} height={34} rx={2.5} fill={fill('sky')} />
          <Path d="M10 24 C10 12 40 12 40 24" stroke={fill('berry')} strokeWidth={4} fill="none" />
          <Rect x={9} y={22} width={32} height={6} rx={3} fill={fill('berry')} />
          <Path
            d="M38 22 C56 24 62 66 92 74 C96 75 97 84 92 85 C56 80 50 40 38 34 Z"
            fill={fill('lemon')}
          />
          <Path
            d="M38 22 C56 24 62 66 92 74"
            stroke={fill('orange')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={52} cy={36} rx={7} ry={2.2} rotate={60} />
          <Gloss cx={18} cy={23} rx={5} ry={1.4} rotate={0} />
        </>
      )}
    </WordCanvas>
  );
}

/** Swing set from the front: a frame, two ropes and a seat swinging forward. */
function Swing({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['berry', 'orange', 'brown']} shadowWidth={44}>
      {(fill) => (
        <>
          <Path
            d="M16 14 L6 92 M16 14 L26 92 M84 14 L74 92 M84 14 L94 92"
            stroke={fill('berry')}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <Rect x={8} y={9} width={84} height={8} rx={4} fill={fill('berry')} />
          <G transform="rotate(-14 50 15)">
            <Path
              d="M38 15 L38 70 M62 15 L62 70"
              stroke={T.brown.face}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Rect x={32} y={68} width={36} height={8} rx={4} fill={fill('orange')} />
            <Gloss cx={40} cy={70} rx={5} ry={1.4} rotate={0} />
          </G>
          <Gloss cx={22} cy={11} rx={8} ry={1.6} rotate={0} />
        </>
      )}
    </WordCanvas>
  );
}

/** Skipping rope: two handles up, the rope hanging in a loop between them. */
function JumpRope({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['berry', 'tan', 'orange']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path
            d="M22 54 C18 104 82 104 78 54"
            stroke={fill('orange')}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M22 54 C18 104 82 104 78 54"
            stroke={T.orange.light}
            strokeWidth={1.6}
            strokeDasharray="2 3"
            fill="none"
          />
          <G transform="rotate(-14 22 38)">
            <Rect x={16} y={20} width={12} height={34} rx={6} fill={fill('berry')} />
            <Rect x={17} y={50} width={10} height={6} rx={3} fill={fill('tan')} />
            <Gloss cx={20} cy={28} rx={1.8} ry={5} rotate={0} />
          </G>
          <G transform="rotate(14 78 38)">
            <Rect x={72} y={20} width={12} height={34} rx={6} fill={fill('berry')} />
            <Rect x={73} y={50} width={10} height={6} rx={3} fill={fill('tan')} />
            <Gloss cx={76} cy={28} rx={1.8} ry={5} rotate={0} />
          </G>
        </>
      )}
    </WordCanvas>
  );
}

export const playthingArt: WordArtMap = {
  'toy.doll': Doll,
  'toy.teddy_bear': TeddyBear,
  'toy.toy_car': ToyCar,
  'toy.toy_train': ToyTrain,
  'toy.blocks': Blocks,
  'toy.puzzle': Puzzle,
  'toy.kite': Kite,
  'toy.balloon': Balloon,
  'toy.drum': Drum,
  'toy.robot': Robot,
  'toy.yoyo': Yoyo,
  'toy.bubbles': Bubbles,
  'toy.slide': Slide,
  'toy.swing': Swing,
  'toy.jump_rope': JumpRope,
};
