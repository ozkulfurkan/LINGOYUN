import { useId, type ReactNode } from 'react';
import { Circle, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, ClayShadow, Gloss, type ClayFill } from '../clay';
import { GROUND_Y, WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Opposites of the 2–7 mode. Each pair is one picture with both things side by
// side (Furkan's decision): the asked one in full colour and a little bigger,
// the other one faded and grey. So "big" and "small" show the same two
// elephants, only the highlight moves. The faded side is grey *and* see-through,
// so the highlight still reads in greyscale and for colour-blind children.

const { ink, gloss } = artPalette;
const T = artPalette.tones;

/** Opacity of the side that is not asked. */
export const MUTED_OPACITY = 0.32;
/** The asked side grows by this much (unless the size itself is the answer). */
export const FOCUS_GROW = 1.12;

type Stop = keyof ClayTone;

/**
 * Colours for one side of a pair. The asked side gets the real clay tones; the
 * faded side gets the same calls answered in grey, so each item is drawn once.
 */
export type Paint = {
  fill: (tone: ArtToneName) => string;
  solid: (tone: ArtToneName, stop?: Stop) => string;
  cheek: string;
  mouth: string;
};

/** One thing of a pair, drawn like a word picture in the 100×100 box on GROUND_Y. */
export type OppositeItem = {
  draw: (paint: Paint) => ReactNode;
  /** Scale in the pair; defaults to the layout's. */
  scale?: number;
  /** Where the item's ground point (50, GROUND_Y) lands; defaults to the layout's. */
  x?: number;
  y?: number;
  /** Half width of its contact shadow in item units; 0 for things in the air. */
  shadow?: number;
};

export type PairSide = 'left' | 'right';
/** `side`: next to each other. `stack`: one above the other (left = top), for lengths. */
export type PairLayout = 'side' | 'stack';

export type PairSlot = { x: number; y: number; scale: number; muted: boolean };

const LAYOUTS: Record<PairLayout, Record<PairSide, { x: number; y: number; scale: number }>> = {
  side: { left: { x: 26, y: 80, scale: 0.58 }, right: { x: 74, y: 80, scale: 0.58 } },
  stack: { left: { x: 50, y: 46, scale: 1 }, right: { x: 50, y: 88, scale: 1 } },
};

/**
 * Placement of both sides: the focused side is not muted and, when `grow` is
 * on, slightly bigger. Pure, so the highlight rule is tested on its own.
 */
export function pairSlots(
  focus: PairSide,
  left: OppositeItem,
  right: OppositeItem,
  layout: PairLayout = 'side',
  grow = true,
): Record<PairSide, PairSlot> {
  const slot = (side: PairSide, item: OppositeItem): PairSlot => {
    const base = LAYOUTS[layout][side];
    const focused = side === focus;
    const scale = (item.scale ?? base.scale) * (focused && grow ? FOCUS_GROW : 1);
    return { x: item.x ?? base.x, y: item.y ?? base.y, scale, muted: !focused };
  };
  return { left: slot('left', left), right: slot('right', right) };
}

type PairProps = {
  size?: number;
  /** Clay tones both items use. */
  tones: readonly ArtToneName[];
  left: OppositeItem;
  right: OppositeItem;
  /** The side the word asks for. */
  focus: PairSide;
  layout?: PairLayout;
  /** Grow the focused side; off when size or length is the answer. */
  grow?: boolean;
};

/** Two things of an opposite pair in one word picture, the asked one highlighted. */
export function OppositePair({
  size,
  tones,
  left,
  right,
  focus,
  layout = 'side',
  grow = true,
}: PairProps) {
  const id = `o${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const slots = pairSlots(focus, left, right, layout, grow);
  const items: Record<PairSide, OppositeItem> = { left, right };
  // Faded side first, so the asked one is drawn on top where they overlap.
  const order: PairSide[] = focus === 'left' ? ['right', 'left'] : ['left', 'right'];
  return (
    <WordCanvas size={size} tones={tones} shadowWidth={0}>
      {(fill: ClayFill) => {
        const vivid: Paint = {
          fill,
          solid: (tone, stop = 'face') => T[tone][stop],
          cheek: artPalette.cheek,
          mouth: artPalette.mouth,
        };
        const muted: Paint = {
          fill: () => `url(#${id}-muted)`,
          solid: (_tone, stop = 'face') => T.grey[stop],
          cheek: T.grey.shade,
          mouth: T.grey.shade,
        };
        return (
          <>
            <Defs>
              <ClayGradient id={`${id}-muted`} tone={T.grey} />
            </Defs>
            {order.map((side) => {
              const s = slots[side];
              const item = items[side];
              const shadow = item.shadow ?? 30;
              return (
                <G
                  key={side}
                  testID={`opposite-${side}`}
                  opacity={s.muted ? MUTED_OPACITY : 1}
                  transform={`translate(${s.x - 50 * s.scale} ${s.y - GROUND_Y * s.scale}) scale(${s.scale})`}
                >
                  {shadow > 0 ? <ClayShadow cx={50} cy={GROUND_Y + 2} rx={shadow} ry={6} /> : null}
                  {item.draw(s.muted ? muted : vivid)}
                </G>
              );
            })}
          </>
        );
      }}
    </WordCanvas>
  );
}

// ─── Items ──────────────────────────────────────────────────────────────────

function Eye({ cx, cy, r = 3.6 }: { cx: number; cy: number; r?: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={ink} />
      <Circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.32} fill={gloss} />
    </G>
  );
}

/** The pilot elephant (animals.tsx), drawn with a paint so it can fade. */
function elephant(p: Paint) {
  return (
    <>
      <Path
        d="M87 52 C93 56 94 62 92 67"
        stroke={p.fill('grey')}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      {[50, 78].map((x) => (
        <Rect
          key={x}
          x={x}
          y={62}
          width={11}
          height={30}
          rx={5.5}
          fill={p.solid('grey', 'shade')}
        />
      ))}
      {[36, 64].map((x) => (
        <Rect key={x} x={x} y={62} width={12} height={30} rx={6} fill={p.fill('grey')} />
      ))}
      <Ellipse cx={60} cy={56} rx={30} ry={24} fill={p.fill('grey')} />
      <Path
        d="M20 44 C8 56 8 74 14 80 C17 83 22 82 21 77"
        stroke={p.solid('grey')}
        strokeWidth={11}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={28} cy={44} r={19} fill={p.fill('grey')} />
      <Ellipse cx={42} cy={46} rx={12} ry={16} fill={p.fill('grey')} />
      <Ellipse cx={43} cy={48} rx={7} ry={10} fill={p.solid('grey', 'shade')} opacity={0.35} />
      <Path
        d="M20 57 C17 61 16 64 18 66"
        stroke={p.fill('cream')}
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
      />
      <Eye cx={24} cy={40} r={3.2} />
      <Gloss cx={52} cy={40} rx={9} ry={4} />
      <Gloss cx={22} cy={31} rx={5} ry={3} />
    </>
  );
}

/** Chunky coloured pencil lying down, tip to the right; `length` is the body. */
function pencil(length: number) {
  return function Pencil(p: Paint) {
    const end = 14 + length;
    return (
      <>
        <Rect x={4} y={70} width={14} height={22} rx={6} fill={p.fill('pink')} />
        <Rect x={13} y={69} width={8} height={24} rx={2} fill={p.fill('grey')} />
        <Rect x={20} y={70} width={end - 20} height={22} rx={3} fill={p.fill('sky')} />
        <Rect
          x={20}
          y={78}
          width={end - 20}
          height={6}
          fill={p.solid('sky', 'light')}
          opacity={0.5}
        />
        <Path d={`M${end} 70 L${end + 18} 81 L${end} 92 Z`} fill={p.fill('tan')} />
        <Path
          d={`M${end + 11} 76.7 L${end + 18} 81 L${end + 11} 85.3 Z`}
          fill={p.solid('sky', 'shade')}
        />
        <Gloss cx={30} cy={73} rx={7} ry={1.6} rotate={0} />
      </>
    );
  };
}

/** Steaming bowl of red lentil soup. */
function soup(p: Paint) {
  return (
    <>
      <Path
        d="M36 40 C30 32 42 26 36 16 M50 38 C44 28 56 22 50 10 M64 40 C58 32 70 26 64 16"
        stroke={p.solid('grey')}
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M12 56 C12 80 30 92 50 92 C70 92 88 80 88 56 Z" fill={p.fill('sky')} />
      <Path
        d="M18 70 C30 74 70 74 82 70"
        stroke={p.solid('cream')}
        strokeWidth={3}
        strokeDasharray="3 4"
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={50} cy={56} rx={38} ry={10} fill={p.solid('sky', 'light')} />
      <Ellipse cx={50} cy={56.5} rx={33} ry={7.5} fill={p.fill('orange')} />
      <Circle cx={40} cy={55} r={1.8} fill={p.solid('red')} />
      <Circle cx={58} cy={57} r={1.6} fill={p.solid('mint')} />
      <Gloss cx={24} cy={66} rx={4} ry={8} rotate={-30} />
    </>
  );
}

/** Two ice cubes with a frosty sparkle. */
function ice(p: Paint) {
  const cube = (x: number, y: number, s: number) => (
    <G>
      <Path
        d={`M${x} ${y} L${x + 8} ${y - 8} L${x + s + 8} ${y - 8} L${x + s} ${y} Z`}
        fill={p.solid('glass', 'light')}
      />
      <Path
        d={`M${x + s} ${y} L${x + s + 8} ${y - 8} L${x + s + 8} ${y + s - 8} L${x + s} ${y + s} Z`}
        fill={p.solid('sky', 'face')}
        opacity={0.7}
      />
      <Rect x={x} y={y} width={s} height={s} rx={3} fill={p.fill('glass')} />
      <Rect
        x={x}
        y={y}
        width={s}
        height={s}
        rx={3}
        stroke={p.solid('sky', 'face')}
        strokeWidth={1.6}
        fill="none"
      />
      <Path
        d={`M${x + 5} ${y + s - 6} L${x + 5} ${y + 8} L${x + 12} ${y + 5}`}
        stroke={gloss}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.9}
      />
    </G>
  );
  return (
    <>
      {cube(16, 60, 32)}
      {cube(50, 62, 30)}
      {cube(32, 30, 30)}
      <Path
        d="M80 14 L80 38 M70 20 L90 32 M70 32 L90 20"
        stroke={p.solid('sky', 'face')}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Circle cx={80} cy={26} r={3} fill={p.solid('sky', 'face')} />
    </>
  );
}

/** Red balloon high in the air (no ground shadow). */
function balloon(p: Paint) {
  return (
    <>
      <Path
        d="M50 68 C46 76 56 80 50 88 C47 92 52 94 50 98"
        stroke={p.solid('grey', 'shade')}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M44 70 L56 70 L50 62 Z" fill={p.fill('red')} />
      <Path
        d="M50 4 C68 4 80 18 80 34 C80 52 64 66 50 66 C36 66 20 52 20 34 C20 18 32 4 50 4 Z"
        fill={p.fill('red')}
      />
      <Gloss cx={36} cy={20} rx={8} ry={4.5} rotate={-40} />
    </>
  );
}

/** Ball resting on the ground. */
function ball(p: Paint) {
  return (
    <>
      <Circle cx={50} cy={62} r={30} fill={p.fill('sky')} />
      <Path
        d="M24 48 C40 58 60 58 76 48 M22 70 C40 80 60 80 78 70"
        stroke={p.fill('lemon')}
        strokeWidth={7}
        fill="none"
      />
      <Gloss cx={38} cy={44} rx={8} ry={4.5} />
    </>
  );
}

/** Round clay face; `happy` decides eyes, mouth and a tear. */
function face(happy: boolean) {
  return function Face(p: Paint) {
    return (
      <>
        <Circle cx={50} cy={58} r={34} fill={p.fill('lemon')} />
        {happy ? (
          <>
            <Path
              d="M32 54 C34 46 42 46 44 54 M56 54 C58 46 66 46 68 54"
              stroke={ink}
              strokeWidth={3.6}
              strokeLinecap="round"
              fill="none"
            />
            <Path d="M32 64 C34 82 66 82 68 64 Z" fill={p.mouth} strokeLinejoin="round" />
            <Ellipse cx={30} cy={66} rx={5} ry={3.2} fill={p.cheek} opacity={0.7} />
            <Ellipse cx={70} cy={66} rx={5} ry={3.2} fill={p.cheek} opacity={0.7} />
          </>
        ) : (
          <>
            <Path
              d="M30 46 C34 44 38 42 42 40 M70 46 C66 44 62 42 58 40"
              stroke={ink}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Eye cx={38} cy={54} r={4} />
            <Eye cx={62} cy={54} r={4} />
            <Path
              d="M36 78 C42 68 58 68 64 78"
              stroke={ink}
              strokeWidth={3.6}
              strokeLinecap="round"
              fill="none"
            />
            <Path d="M33 62 C29 70 31 74 34 74 C37 74 38 70 33 62 Z" fill={p.solid('sky')} />
          </>
        )}
        <Gloss cx={36} cy={38} rx={9} ry={4.5} />
      </>
    );
  };
}

/** Rabbit stretched out mid-hop, ears back, speed lines behind. */
function rabbit(p: Paint) {
  return (
    <>
      <Path
        d="M88 46 L96 46 M92 58 L100 58 M90 70 L98 70"
        stroke={p.solid('grey', 'shade')}
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Ellipse cx={86} cy={80} rx={13} ry={5} fill={p.fill('tan')} transform="rotate(18 86 80)" />
      <Ellipse
        cx={14}
        cy={80}
        rx={11}
        ry={4.5}
        fill={p.fill('tan')}
        transform="rotate(-24 14 80)"
      />
      <Ellipse cx={56} cy={64} rx={27} ry={16} fill={p.fill('tan')} transform="rotate(-6 56 64)" />
      <Circle cx={83} cy={56} r={6} fill={p.solid('cream', 'light')} />
      <Ellipse cx={48} cy={30} rx={6} ry={18} fill={p.fill('tan')} transform="rotate(62 48 30)" />
      <Ellipse cx={50} cy={22} rx={5.6} ry={17} fill={p.fill('tan')} transform="rotate(70 50 22)" />
      <Ellipse
        cx={50}
        cy={22}
        rx={2.6}
        ry={12}
        fill={p.fill('pink')}
        transform="rotate(70 50 22)"
      />
      <Circle cx={30} cy={48} r={15} fill={p.fill('tan')} />
      <Circle cx={16} cy={50} r={2.6} fill={p.solid('pink', 'shade')} />
      <Eye cx={25} cy={44} r={3.2} />
      <Ellipse cx={26} cy={54} rx={3.6} ry={2.4} fill={p.cheek} opacity={0.6} />
      <Gloss cx={46} cy={53} rx={10} ry={3.5} rotate={-10} />
    </>
  );
}

/** Turtle from the side, plodding: high shell, head out. */
function turtle(p: Paint) {
  return (
    <>
      <Path d="M86 76 L96 80 L86 84 Z" fill={p.fill('mint')} />
      <Rect x={46} y={72} width={11} height={20} rx={5.5} fill={p.solid('mint', 'shade')} />
      <Rect x={76} y={72} width={11} height={20} rx={5.5} fill={p.solid('mint', 'shade')} />
      <Rect x={34} y={72} width={12} height={20} rx={6} fill={p.fill('mint')} />
      <Rect x={64} y={72} width={12} height={20} rx={6} fill={p.fill('mint')} />
      <Path d="M30 72 C26 66 20 64 16 64 L18 78 C24 80 30 78 32 76 Z" fill={p.fill('mint')} />
      <Circle cx={15} cy={62} r={11} fill={p.fill('mint')} />
      <Path d="M26 78 C26 50 40 34 58 34 C76 34 90 50 90 78 Z" fill={p.fill('brown')} />
      <Path
        d="M50 42 L66 42 L72 56 L64 68 L52 68 L44 56 Z M30 62 L40 56 L46 70 L32 74 Z M76 56 L86 62 L86 74 L72 70 Z"
        fill={p.solid('brown', 'light')}
        opacity={0.6}
      />
      <Rect x={22} y={74} width={72} height={8} rx={4} fill={p.fill('tan')} />
      <Eye cx={13} cy={59} r={3.2} />
      <Gloss cx={44} cy={42} rx={8} ry={3.5} />
    </>
  );
}

// ─── Pairs ──────────────────────────────────────────────────────────────────

const BIG: OppositeItem = { draw: elephant, scale: 0.76, x: 36, y: 84, shadow: 36 };
const SMALL: OppositeItem = { draw: elephant, scale: 0.32, x: 85, y: 84, shadow: 36 };
const LONG: OppositeItem = { draw: pencil(64), shadow: 40 };
const SHORT: OppositeItem = { draw: pencil(24), shadow: 24 };
const HOT: OppositeItem = { draw: soup, shadow: 36 };
const COLD: OppositeItem = { draw: ice, shadow: 34 };
const UP: OppositeItem = { draw: balloon, y: 62, shadow: 0 };
const DOWN: OppositeItem = { draw: ball, shadow: 28 };
const HAPPY: OppositeItem = { draw: face(true), shadow: 28 };
const SAD: OppositeItem = { draw: face(false), shadow: 28 };
const FAST: OppositeItem = { draw: rabbit, x: 26, scale: 0.52, shadow: 34 };
const SLOW: OppositeItem = { draw: turtle, x: 75, scale: 0.52, shadow: 38 };

const SIZE_TONES: ArtToneName[] = ['grey', 'cream'];
const LENGTH_TONES: ArtToneName[] = ['pink', 'grey', 'sky', 'tan'];
const HEAT_TONES: ArtToneName[] = ['sky', 'orange', 'glass'];
const HEIGHT_TONES: ArtToneName[] = ['red', 'sky', 'lemon'];
const MOOD_TONES: ArtToneName[] = ['lemon'];
const SPEED_TONES: ArtToneName[] = ['tan', 'pink', 'mint', 'brown'];

function pair(
  left: OppositeItem,
  right: OppositeItem,
  focus: PairSide,
  tones: readonly ArtToneName[],
  options: { layout?: PairLayout; grow?: boolean } = {},
) {
  return function OppositeArt({ size }: WordArtProps) {
    return (
      <OppositePair
        size={size}
        tones={tones}
        left={left}
        right={right}
        focus={focus}
        {...options}
      />
    );
  };
}

const sized = { grow: false };
const lengths = { layout: 'stack', grow: false } as const;

export const oppositeArt: WordArtMap = {
  'opposite.big': pair(BIG, SMALL, 'left', SIZE_TONES, sized),
  'opposite.small': pair(BIG, SMALL, 'right', SIZE_TONES, sized),
  'opposite.long': pair(LONG, SHORT, 'left', LENGTH_TONES, lengths),
  'opposite.short': pair(LONG, SHORT, 'right', LENGTH_TONES, lengths),
  'opposite.hot': pair(HOT, COLD, 'left', HEAT_TONES),
  'opposite.cold': pair(HOT, COLD, 'right', HEAT_TONES),
  'opposite.up': pair(UP, DOWN, 'left', HEIGHT_TONES),
  'opposite.down': pair(UP, DOWN, 'right', HEIGHT_TONES),
  'opposite.happy': pair(HAPPY, SAD, 'left', MOOD_TONES),
  'opposite.sad': pair(HAPPY, SAD, 'right', MOOD_TONES),
  'opposite.fast': pair(FAST, SLOW, 'left', SPEED_TONES),
  'opposite.slow': pair(FAST, SLOW, 'right', SPEED_TONES),
};
