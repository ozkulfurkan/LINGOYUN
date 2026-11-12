import { useId } from 'react';
import { Circle, Defs, G, Path, Rect } from 'react-native-svg';

import { artPalette } from '@/theme/artPalette';

import { Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Number words of the 2–7 mode (Furkan's decision: the numeral AND that many
// things). Every card has a big clay numeral on top and, below it, the same
// number of beads:
//   1–5:   one row of loose beads;
//   6–10:  a row of five and the rest under it (a "ten frame");
//   11–20: a bar of ten beads for every ten, then the loose ones, so 13 is one
//          ten-bar and three beads and stays countable.
// The numerals are drawn as clay ropes (stroked paths), not with a font, so
// they look the same on every device and match the clay pictures. All digits
// share one size, so "1" on number.one is the same "1" as in number.twelve.

const { gloss } = artPalette;
const T = artPalette.tones;

/** Tones: the numeral and the beads. Kept apart so the two never blur together. */
const NUMERAL = 'berry' as const;
const BEAD = 'mint' as const;

// ---------------------------------------------------------------- numerals

/** Centre lines of the digits in a 30 × 50 cell; drawn with a thick round stroke. */
const DIGITS: Record<string, string> = {
  '0': 'M15 5 C27 5 27 45 15 45 C3 45 3 5 15 5 Z',
  '1': 'M7 14 L18 5 L18 45',
  '2': 'M5 15 C5 3 25 2 25 15 C25 26 7 34 5 45 L26 45',
  '3': 'M5 9 C10 2 25 3 24 13 C23 21 16 23 13 23 C18 23 26 26 25 35 C24 47 8 48 4 40',
  '4': 'M20 45 L20 5 L4 31 L27 31',
  '5': 'M24 5 L8 5 L6 21 C12 17 26 17 26 31 C26 46 9 48 4 40',
  '6': 'M23 5 C11 6 4 18 4 31 C4 41 9 46 15 46 C22 46 26 41 26 34 C26 26 21 21 15 21 C10 21 6 24 4 29',
  '7': 'M4 5 L26 5 C18 17 14 30 13 45',
  '8': 'M15 23 C6 23 6 5 15 5 C24 5 24 23 15 23 C3 23 3 46 15 46 C27 46 27 23 15 23 Z',
  '9': 'M26 16 C26 6 4 6 4 16 C4 27 26 27 26 16 C26 33 21 44 7 45',
};

/** Where the light falls on each digit (cell units). */
const DIGIT_GLOSS: Record<string, [number, number, number]> = {
  '0': [8, 14, -60],
  '1': [10, 11, -40],
  '2': [8, 9, -30],
  '3': [9, 6, -20],
  '4': [13, 15, -60],
  '5': [11, 5, 0],
  '6': [8, 17, -60],
  '7': [10, 5, 0],
  '8': [10, 9, -50],
  '9': [8, 12, -60],
};

const CELL = { width: 30, height: 50 };
/** Stroke of the clay rope, in cell units. */
const ROPE = 8.6;
/** Numerals are scaled by this and sit in the top band of the box. */
const NUMERAL_SCALE = 1.08;
const NUMERAL_TOP = 3;
const DIGIT_GAP = 1.5;
/** Depth of the darker rim under the numeral. */
const RIM = 2.4;

function Numeral({ value, fill }: { value: number; fill: string }) {
  const digits = String(value).split('');
  const width = digits.length * CELL.width + (digits.length - 1) * DIGIT_GAP;
  const left = 50 - (width * NUMERAL_SCALE) / 2;
  return (
    <G transform={`translate(${left} ${NUMERAL_TOP}) scale(${NUMERAL_SCALE})`}>
      {digits.map((digit, i) => {
        const x = i * (CELL.width + DIGIT_GAP);
        const [gx, gy, rot] = DIGIT_GLOSS[digit];
        return (
          <G key={`${digit}-${i}`} transform={`translate(${x} 0)`}>
            <Path
              d={DIGITS[digit]}
              stroke={T[NUMERAL].shade}
              strokeWidth={ROPE}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              transform={`translate(0 ${RIM})`}
            />
            <Path
              d={DIGITS[digit]}
              stroke={fill}
              strokeWidth={ROPE}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Gloss cx={gx} cy={gy} rx={2.6} ry={1.4} rotate={rot} opacity={0.75} />
          </G>
        );
      })}
    </G>
  );
}

// ---------------------------------------------------------------- beads

export type BeadLayout = {
  /** Bars of ten beads: left end and row of each. */
  tens: { x: number; y: number }[];
  /** Loose beads. */
  ones: { x: number; y: number }[];
  /** Radius of every bead. */
  r: number;
  /** Distance between bead centres. */
  step: number;
};

/** A row of `n` bead centres, centred on x = 50. */
function row(n: number, y: number, step: number) {
  const start = 50 - ((n - 1) * step) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: start + i * step, y }));
}

/**
 * Where the beads of a number go (pure, so the counting rule is tested on its
 * own): 1–5 in one row, 6–10 as five plus the rest, 11–20 as ten-bars plus
 * loose beads.
 */
export function beadLayout(value: number): BeadLayout {
  if (!Number.isInteger(value) || value < 1 || value > 20) {
    throw new RangeError(`beadLayout: ${value} is not a number from 1 to 20`);
  }
  if (value <= 5) {
    const step = 13;
    return { tens: [], ones: row(value, 80, step), r: 5.4, step };
  }
  if (value <= 10) {
    const step = 12;
    return {
      tens: [],
      ones: [...row(5, 72, step), ...row(value - 5, 85, step)],
      r: 4.9,
      step,
    };
  }
  const step = 7.6;
  const tens = Math.floor(value / 10);
  const ones = value % 10;
  const barRows = Array.from({ length: tens }, (_, i) => ({
    x: 50 - (9 * step) / 2,
    y: 72 + i * 13,
  }));
  return { tens: barRows, ones: row(ones, 85, step), r: 3.6, step };
}

function Bead({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <G testID="number-bead">
      <Circle cx={x} cy={y + r * 0.3} r={r} fill={T[BEAD].shade} />
      <Circle cx={x} cy={y} r={r} fill={fill} />
      <Circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.28} fill={gloss} opacity={0.7} />
    </G>
  );
}

/** Ten beads held in a clay tray, so a ten reads as one thing and still as ten. */
function TenBar({
  x,
  y,
  r,
  step,
  fill,
}: {
  x: number;
  y: number;
  r: number;
  step: number;
  fill: string;
}) {
  const pad = r + 1.8;
  return (
    <G testID="number-ten">
      <Rect
        x={x - pad}
        y={y - pad + 0.8}
        width={9 * step + pad * 2}
        height={pad * 2}
        rx={pad}
        fill={T[BEAD].shade}
      />
      {Array.from({ length: 10 }, (_, i) => (
        <G key={i}>
          <Circle cx={x + i * step} cy={y} r={r} fill={fill} />
          <Circle
            cx={x + i * step - r * 0.35}
            cy={y - r * 0.4}
            r={r * 0.28}
            fill={gloss}
            opacity={0.7}
          />
        </G>
      ))}
    </G>
  );
}

type NumberCardProps = WordArtProps & { value: number };

/** A clay numeral with that many beads under it (1–20). */
export function NumberCard({ size, value }: NumberCardProps) {
  const layout = beadLayout(value);
  const prefix = `n${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <WordCanvas size={size} tones={[NUMERAL, BEAD]} shadowWidth={36}>
      {(fill) => (
        <>
          <Defs />
          <Numeral value={value} fill={fill(NUMERAL)} />
          <G testID={`${prefix}-beads`}>
            {layout.tens.map((bar) => (
              <TenBar
                key={`t${bar.y}`}
                x={bar.x}
                y={bar.y}
                r={layout.r}
                step={layout.step}
                fill={fill(BEAD)}
              />
            ))}
            {layout.ones.map((bead) => (
              <Bead
                key={`o${bead.x}-${bead.y}`}
                x={bead.x}
                y={bead.y}
                r={layout.r}
                fill={fill(BEAD)}
              />
            ))}
          </G>
        </>
      )}
    </WordCanvas>
  );
}

const NAMES = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
] as const;

function numberPicture(value: number) {
  function NumberPicture({ size }: WordArtProps) {
    return <NumberCard size={size} value={value} />;
  }
  NumberPicture.displayName = `NumberCard(${value})`;
  return NumberPicture;
}

export const numberArt: WordArtMap = Object.fromEntries(
  NAMES.map((name, i) => [`number.${name}`, numberPicture(i + 1)]),
);
