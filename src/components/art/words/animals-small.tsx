import { useId, type ReactNode } from 'react';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Farm animals, small animals, birds and bugs of the 2–7 mode. Same rules as
// animals.tsx: lit from the top left, gloss there, one contact shadow, no
// outlines. Four-legged animals are drawn from the side facing left (like the
// elephant), so their tell-tale part (mane, ears, horns, wool, antlers) does
// the work at 64 pt.

const { ink, tongue, cheek, gloss } = artPalette;
const T = artPalette.tones;

/**
 * White fur and feathers. The `cream` tone is the card colour itself, so a
 * white animal would vanish on its card; these two are built from palette
 * stops so the edges always turn darker than the card.
 */
const LOCAL_TONES = {
  /** Cool white: hen, rabbit, cow. */
  snow: { light: T.cream.light, face: T.glass.light, shade: T.grey.face },
  /** Warm off-white wool: sheep, goat beard. */
  fleece: { light: T.cream.light, face: T.tan.light, shade: T.tan.face },
} satisfies Record<string, ClayTone>;

type LocalTone = keyof typeof LOCAL_TONES;
type Fill = (tone: ArtToneName | LocalTone) => string;

function isLocal(tone: string): tone is LocalTone {
  return Object.hasOwn(LOCAL_TONES, tone);
}

/** WordCanvas plus the local tones and a per-instance id prefix (for clip paths). */
function Canvas({
  size,
  tones,
  local = [],
  shadowWidth,
  children,
}: {
  size?: number;
  tones: readonly ArtToneName[];
  local?: readonly LocalTone[];
  shadowWidth?: number;
  children: (fill: Fill, id: string) => ReactNode;
}) {
  const id = `s${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <WordCanvas size={size} tones={tones} shadowWidth={shadowWidth}>
      {(base) => (
        <>
          {local.length > 0 ? (
            <Defs>
              {local.map((tone) => (
                <ClayGradient key={tone} id={`${id}-${tone}`} tone={LOCAL_TONES[tone]} />
              ))}
            </Defs>
          ) : null}
          {children((tone) => (isLocal(tone) ? `url(#${id}-${tone})` : base(tone)), id)}
        </>
      )}
    </WordCanvas>
  );
}

/** Mirror an absolute path (M/L/C/Z with number pairs) around x = 50. */
export function mirrorPath(d: string): string {
  let isX = true;
  return d.replace(/-?\d+(\.\d+)?|[A-Za-z]/g, (token) => {
    if (/[A-Za-z]/.test(token)) {
      isX = true;
      return token;
    }
    const out = isX ? String(100 - Number(token)) : token;
    isX = !isX;
    return out;
  });
}

/** Round dark eye with one white sparkle, the same as in animals.tsx. */
function Eye({ cx, cy, r = 3.6 }: { cx: number; cy: number; r?: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={ink} />
      <Circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.32} fill={gloss} />
    </G>
  );
}

/** Eye on a dark face (sheep, spider, ladybug): a light ring makes it readable. */
function DarkEye({ cx, cy, r = 3.2 }: { cx: number; cy: number; r?: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r + 1.6} fill={T.cream.face} />
      <Eye cx={cx} cy={cy} r={r} />
    </G>
  );
}

function Cheek({ cx, cy, r = 3.4 }: { cx: number; cy: number; r?: number }) {
  return <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.65} fill={cheek} opacity={0.55} />;
}

function Smile({ d, color = ink, width = 1.6 }: { d: string; color?: string; width?: number }) {
  return <Path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" />;
}

/** Four legs of a side-view animal: far pair darker, near pair clay, optional hooves. */
function Legs({
  far,
  near,
  top,
  width,
  fill,
  farFill,
  hoof,
}: {
  far: readonly number[];
  near: readonly number[];
  top: number;
  width: number;
  fill: string;
  farFill: string;
  hoof?: string;
}) {
  const height = 92 - top;
  return (
    <>
      {far.map((x) => (
        <Rect
          key={`f${x}`}
          x={x}
          y={top}
          width={width - 1}
          height={height}
          rx={(width - 1) / 2}
          fill={farFill}
        />
      ))}
      {near.map((x) => (
        <Rect
          key={`n${x}`}
          x={x}
          y={top}
          width={width}
          height={height}
          rx={width / 2}
          fill={fill}
        />
      ))}
      {hoof
        ? [...far, ...near].map((x) => (
            <Rect key={`h${x}`} x={x} y={87} width={width} height={5} rx={2} fill={hoof} />
          ))
        : null}
    </>
  );
}

// ─── Birds ──────────────────────────────────────────────────────────────────

/** Small round blue bird on a branch. */
function Bird({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['sky', 'orange', 'brown', 'cream', 'mint']} shadowWidth={30}>
      {(fill) => (
        <>
          <Path d="M64 60 L86 48 C90 46 93 50 91 53 L72 70 Z" fill={fill('sky')} />
          <Path
            d="M6 84 C30 80 70 80 94 84"
            stroke={fill('brown')}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M80 82 C82 72 90 70 94 72 C92 80 86 84 80 82 Z" fill={fill('mint')} />
          <Path
            d="M42 74 L42 82 M54 74 L54 82"
            stroke={T.orange.shade}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <Ellipse cx={48} cy={54} rx={25} ry={22} fill={fill('sky')} />
          <Ellipse cx={42} cy={62} rx={15} ry={12} fill={fill('cream')} />
          <Path
            d="M48 52 C62 46 76 54 72 66 C64 70 52 66 48 52 Z"
            fill={T.sky.shade}
            opacity={0.55}
          />
          <Path d="M25 46 L13 51 L25 56 Z" fill={fill('orange')} strokeLinejoin="round" />
          <Eye cx={34} cy={45} />
          <Cheek cx={32} cy={54} />
          <Gloss cx={42} cy={38} rx={8} ry={3.5} />
        </>
      )}
    </Canvas>
  );
}

/** White hen, standing: small comb, round body, short tail. */
function Chicken({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['red', 'lemon', 'orange']} local={['snow']} shadowWidth={28}>
      {(fill) => (
        <>
          <Path
            d="M44 76 L44 90 L38 91 M44 90 L48 91 M58 76 L58 90 L52 91 M58 90 L62 91"
            stroke={T.orange.face}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Path d="M68 52 C74 36 90 34 90 48 C90 60 82 66 72 66 Z" fill={fill('snow')} />
          <Ellipse cx={54} cy={62} rx={27} ry={20} fill={fill('snow')} />
          <Ellipse cx={34} cy={46} rx={12} ry={14} fill={fill('snow')} />
          <Circle cx={30} cy={23} r={4.2} fill={fill('red')} />
          <Circle cx={35.5} cy={21.5} r={4.8} fill={fill('red')} />
          <Circle cx={41} cy={24} r={4.2} fill={fill('red')} />
          <Circle cx={34} cy={36} r={13} fill={fill('snow')} />
          <Path d="M22 34 L12 38.5 L22 43 Z" fill={fill('lemon')} strokeLinejoin="round" />
          <Ellipse cx={23} cy={47} rx={3.2} ry={4.6} fill={fill('red')} />
          <Path
            d="M50 58 C60 52 74 56 74 66 C66 72 54 68 50 58 Z"
            fill={T.grey.face}
            opacity={0.45}
          />
          <Eye cx={31} cy={33} />
          <Cheek cx={33} cy={42} />
          <Gloss cx={42} cy={50} rx={9} ry={4} />
        </>
      )}
    </Canvas>
  );
}

/** Rooster, standing tall: big comb and a sweeping, many-coloured tail. */
function Rooster({ size }: WordArtProps) {
  return (
    <Canvas
      size={size}
      tones={['terracotta', 'red', 'lemon', 'orange', 'charcoal', 'mint']}
      shadowWidth={28}
    >
      {(fill) => (
        <>
          <Path
            d="M64 56 C64 26 84 14 94 30"
            stroke={fill('charcoal')}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M66 60 C72 38 90 34 94 52"
            stroke={fill('mint')}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M66 66 C78 56 92 62 90 74"
            stroke={fill('charcoal')}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M46 74 L46 90 L40 91 M46 90 L50 91 M56 74 L56 90 L50 91 M56 90 L60 91"
            stroke={T.orange.face}
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Ellipse cx={52} cy={62} rx={21} ry={16} fill={fill('terracotta')} />
          <Ellipse
            cx={36}
            cy={44}
            rx={11}
            ry={17}
            fill={fill('orange')}
            transform="rotate(20 36 44)"
          />
          <Path
            d="M24 22 C22 10 30 8 32 14 C32 4 42 4 42 13 C46 7 52 12 46 22 Z"
            fill={fill('red')}
          />
          <Circle cx={34} cy={29} r={11} fill={fill('terracotta')} />
          <Path d="M24 27 L14 31 L24 35 Z" fill={fill('lemon')} strokeLinejoin="round" />
          <Ellipse cx={25} cy={41} rx={3.6} ry={5.6} fill={fill('red')} />
          <Path
            d="M48 58 C58 52 70 56 70 66 C62 72 52 68 48 58 Z"
            fill={T.terracotta.shade}
            opacity={0.5}
          />
          <Eye cx={31} cy={27} r={3.2} />
          <Gloss cx={30} cy={22} rx={4} ry={2.4} />
          <Gloss cx={46} cy={52} rx={7} ry={3} />
        </>
      )}
    </Canvas>
  );
}

/** Yellow duck floating on water, flat bill. */
function Duck({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['lemon', 'orange', 'sky']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path d="M70 64 L90 48 L86 72 Z" fill={fill('lemon')} strokeLinejoin="round" />
          <Path
            d="M22 66 C22 58 34 56 50 58 L74 58 C86 58 90 66 86 74 C80 84 64 88 48 88 C32 88 22 80 22 66 Z"
            fill={fill('lemon')}
          />
          <Ellipse cx={38} cy={52} rx={10} ry={11} fill={fill('lemon')} />
          <Circle cx={36} cy={38} r={14} fill={fill('lemon')} />
          <Path d="M24 40 C14 37 6 41 8 46 C12 49 20 49 25 46 Z" fill={fill('orange')} />
          <Path
            d="M50 66 C60 60 74 62 76 70 C68 76 56 74 50 66 Z"
            fill={T.lemon.shade}
            opacity={0.55}
          />
          <Eye cx={34} cy={35} />
          <Cheek cx={34} cy={45} />
          <Gloss cx={30} cy={29} rx={5} ry={3} />
          <Gloss cx={42} cy={64} rx={9} ry={3.5} />
          <Path
            d="M4 86 C12 82 18 90 26 86 C34 82 40 90 48 86 C56 82 62 90 70 86 C78 82 84 90 96 86 L96 94 L4 94 Z"
            fill={fill('sky')}
          />
        </>
      )}
    </Canvas>
  );
}

/** Owl, front view: big face discs, ear tufts. */
function Owl({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['brown', 'tan', 'orange', 'cream']} shadowWidth={26}>
      {(fill) => (
        <>
          <Path d="M28 34 L22 10 L44 22 Z" fill={fill('brown')} strokeLinejoin="round" />
          <Path d="M72 34 L78 10 L56 22 Z" fill={fill('brown')} strokeLinejoin="round" />
          <Path
            d="M50 16 C28 16 20 40 22 62 C24 82 36 90 50 90 C64 90 76 82 78 62 C80 40 72 16 50 16 Z"
            fill={fill('brown')}
          />
          <Ellipse cx={50} cy={70} rx={17} ry={17} fill={fill('tan')} />
          <Path
            d="M42 64 L45 67 L48 64 M52 64 L55 67 L58 64 M46 74 L49 77 L52 74 M56 74 L58 76"
            stroke={T.tan.shade}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Ellipse
            cx={25}
            cy={64}
            rx={6}
            ry={18}
            fill={T.brown.shade}
            transform="rotate(12 25 64)"
          />
          <Ellipse
            cx={75}
            cy={64}
            rx={6}
            ry={18}
            fill={T.brown.shade}
            transform="rotate(-12 75 64)"
          />
          <Circle cx={38} cy={40} r={12.5} fill={fill('cream')} />
          <Circle cx={62} cy={40} r={12.5} fill={fill('cream')} />
          <Eye cx={39} cy={40} r={6} />
          <Eye cx={61} cy={40} r={6} />
          <Path d="M45.5 49 L54.5 49 L50 57 Z" fill={fill('orange')} strokeLinejoin="round" />
          <Ellipse cx={42} cy={90} rx={5} ry={3} fill={fill('orange')} />
          <Ellipse cx={58} cy={90} rx={5} ry={3} fill={fill('orange')} />
          <Gloss cx={36} cy={24} rx={7} ry={3} />
        </>
      )}
    </Canvas>
  );
}

/** Red parrot on a perch: hooked beak, blue and yellow wing, long tail. */
function Parrot({ size }: WordArtProps) {
  return (
    <Canvas
      size={size}
      tones={['red', 'lemon', 'sky', 'cream', 'charcoal', 'brown']}
      shadowWidth={26}
    >
      {(fill) => (
        <>
          <Path d="M56 62 C62 74 66 82 70 92 L80 90 C76 78 72 68 66 58 Z" fill={fill('red')} />
          <Path d="M64 72 C67 80 70 86 72 92 L80 90 C78 84 76 78 72 70 Z" fill={fill('sky')} />
          <Ellipse
            cx={50}
            cy={46}
            rx={16}
            ry={24}
            fill={fill('red')}
            transform="rotate(-18 50 46)"
          />
          <Path
            d="M50 36 C62 32 70 44 70 56 C70 66 64 72 58 72 C52 62 48 48 50 36 Z"
            fill={fill('lemon')}
          />
          <Path
            d="M56 56 C62 56 70 60 70 64 C68 70 62 74 58 72 C56 66 55 60 56 56 Z"
            fill={fill('sky')}
          />
          <Rect x={8} y={69} width={84} height={6} rx={3} fill={fill('brown')} />
          <Ellipse cx={44} cy={70} rx={4} ry={3} fill={fill('charcoal')} />
          <Ellipse cx={53} cy={70} rx={4} ry={3} fill={fill('charcoal')} />
          <Circle cx={40} cy={24} r={14} fill={fill('red')} />
          <Ellipse cx={37} cy={23} rx={5.5} ry={6.5} fill={fill('cream')} />
          <Path d="M30 31 C26 31 23 34 24 38 C27 38 30 36 31 33 Z" fill={fill('charcoal')} />
          <Path
            d="M33 14 C22 12 15 19 16 29 C16 34 18 37 21 39 C21 34 25 31 32 31 Z"
            fill={fill('cream')}
          />
          <Eye cx={38} cy={21} r={3} />
          <Gloss cx={38} cy={14} rx={5} ry={2.6} />
          <Gloss cx={42} cy={38} rx={5} ry={3} rotate={-60} />
        </>
      )}
    </Canvas>
  );
}

// ─── Farm animals ───────────────────────────────────────────────────────────

/** Brown horse from the side: long head, dark mane and tail. */
function Horse({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['brown', 'charcoal', 'tan']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path
            d="M84 46 C96 50 96 66 88 80"
            stroke={fill('charcoal')}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
          <Legs
            far={[49, 77]}
            near={[39, 67]}
            top={58}
            width={9}
            fill={fill('brown')}
            farFill={T.brown.shade}
            hoof={T.charcoal.face}
          />
          <Ellipse cx={62} cy={53} rx={27} ry={15} fill={fill('brown')} />
          <Path d="M38 54 C34 42 30 32 28 22 L44 16 C46 28 50 38 58 46 Z" fill={fill('brown')} />
          <Path d="M30 20 L32 7 C33 5 36 6 37 8 L38 18 Z" fill={fill('brown')} />
          <Ellipse
            cx={23}
            cy={28}
            rx={17}
            ry={9}
            fill={fill('brown')}
            transform="rotate(-42 23 28)"
          />
          <Ellipse cx={13} cy={37} rx={7.5} ry={6.5} fill={fill('tan')} />
          <Circle cx={10} cy={36} r={1.4} fill={ink} />
          <Path
            d="M36 11 C42 18 46 30 56 42"
            stroke={fill('charcoal')}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M33 13 C28 13 25 15 25 19"
            stroke={fill('charcoal')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Eye cx={25} cy={25} r={3} />
          <Gloss cx={56} cy={44} rx={10} ry={3.5} />
          <Gloss cx={22} cy={21} rx={4} ry={2.4} rotate={-45} />
        </>
      )}
    </Canvas>
  );
}

/** Grey donkey from the side: long upright ears, pale muzzle, tufted tail. */
function Donkey({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['grey', 'charcoal', 'cream']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path
            d="M84 52 C90 58 90 66 88 72"
            stroke={T.grey.shade}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse cx={88} cy={75} rx={3.5} ry={5} fill={fill('charcoal')} />
          <Legs
            far={[50, 75]}
            near={[39, 64]}
            top={64}
            width={10}
            fill={fill('grey')}
            farFill={T.grey.shade}
            hoof={T.charcoal.face}
          />
          <Ellipse cx={61} cy={58} rx={26} ry={15} fill={fill('grey')} />
          <Ellipse cx={60} cy={67} rx={16} ry={5} fill={T.cream.face} opacity={0.8} />
          <Path d="M36 60 C32 48 30 40 30 32 L46 28 C48 38 52 46 58 50 Z" fill={fill('grey')} />
          <Ellipse
            cx={44}
            cy={17}
            rx={4}
            ry={13}
            fill={T.grey.shade}
            transform="rotate(28 44 17)"
          />
          <Ellipse
            cx={36}
            cy={15}
            rx={4.5}
            ry={14}
            fill={fill('grey')}
            transform="rotate(10 36 15)"
          />
          <Ellipse
            cx={36}
            cy={13}
            rx={2}
            ry={9}
            fill={T.charcoal.face}
            opacity={0.4}
            transform="rotate(10 36 13)"
          />
          <Path
            d="M42 27 C46 34 50 42 56 48"
            stroke={fill('charcoal')}
            strokeWidth={5}
            strokeDasharray="2.4 1.6"
            fill="none"
          />
          <Ellipse
            cx={27}
            cy={36}
            rx={16}
            ry={11}
            fill={fill('grey')}
            transform="rotate(-32 27 36)"
          />
          <Ellipse cx={16} cy={44} rx={9.5} ry={8} fill={fill('cream')} />
          <Circle cx={12} cy={42} r={1.4} fill={ink} />
          <Smile d="M12 48 C14 50 17 50 19 48" />
          <Eye cx={29} cy={31} r={3} />
          <Gloss cx={54} cy={49} rx={9} ry={3.5} />
          <Gloss cx={26} cy={28} rx={4} ry={2.4} rotate={-35} />
        </>
      )}
    </Canvas>
  );
}

/** White cow with black patches; face turned to us with horns and a pink muzzle. */
function Cow({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['charcoal', 'pink', 'tan']} local={['snow']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path
            d="M88 46 C94 52 94 62 92 68"
            stroke={T.grey.face}
            strokeWidth={2.6}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse cx={92} cy={71} rx={3} ry={4.5} fill={fill('charcoal')} />
          <Legs
            far={[48, 76]}
            near={[37, 66]}
            top={60}
            width={10}
            fill={fill('snow')}
            farFill={T.grey.face}
            hoof={T.charcoal.face}
          />
          <Rect x={32} y={36} width={60} height={32} rx={15} fill={fill('snow')} />
          <Path
            d="M54 37 C62 36 68 42 66 50 C64 56 56 57 52 51 C48 45 48 38 54 37 Z"
            fill={fill('charcoal')}
          />
          <Path
            d="M78 37 C86 37 91 44 91 52 C85 55 78 51 77 45 C76 41 76 38 78 37 Z"
            fill={fill('charcoal')}
          />
          <Path d="M70 58 C76 56 80 60 79 65 C74 67 68 64 70 58 Z" fill={fill('charcoal')} />
          <Ellipse cx={72} cy={70} rx={7} ry={4.5} fill={fill('pink')} />
          <G transform="translate(5 0)">
            <Path
              d="M12 26 C8 22 8 16 12 14 M36 26 C40 22 40 16 36 14"
              stroke={fill('tan')}
              strokeWidth={4.5}
              strokeLinecap="round"
              fill="none"
            />
            <Ellipse
              cx={7}
              cy={36}
              rx={7.5}
              ry={4}
              fill={fill('snow')}
              transform="rotate(-20 7 36)"
            />
            <Ellipse
              cx={41}
              cy={36}
              rx={7.5}
              ry={4}
              fill={fill('snow')}
              transform="rotate(20 41 36)"
            />
            <Ellipse cx={24} cy={42} rx={14} ry={16} fill={fill('snow')} />
            <Path d="M28 28 C36 28 38 38 36 44 C32 46 28 42 27 36 Z" fill={fill('charcoal')} />
            <Ellipse cx={24} cy={55} rx={13} ry={9} fill={fill('pink')} />
            <Circle cx={19} cy={55} r={1.8} fill={T.pink.shade} />
            <Circle cx={29} cy={55} r={1.8} fill={T.pink.shade} />
            <Eye cx={18} cy={40} r={3} />
            <DarkEye cx={31} cy={39} r={2.6} />
            <Gloss cx={18} cy={32} rx={4} ry={2.4} />
          </G>
          <Gloss cx={44} cy={42} rx={9} ry={3} rotate={-10} />
        </>
      )}
    </Canvas>
  );
}

/** Fluffy sheep: a cloud of wool, dark face and legs. */
function Sheep({ size }: WordArtProps) {
  const wool: readonly (readonly [number, number, number])[] = [
    [40, 58, 13],
    [52, 46, 14],
    [67, 45, 14],
    [80, 54, 13],
    [78, 67, 12],
    [63, 70, 13],
    [47, 70, 12],
    [60, 58, 17],
  ];
  return (
    <Canvas size={size} tones={['charcoal']} local={['fleece']} shadowWidth={34}>
      {(fill) => (
        <>
          <Legs
            far={[50, 72]}
            near={[40, 62]}
            top={72}
            width={7}
            fill={fill('charcoal')}
            farFill={T.charcoal.shade}
          />
          {wool.map(([cx, cy, r]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={fill('fleece')} />
          ))}
          <Ellipse
            cx={12}
            cy={46}
            rx={7.5}
            ry={3.6}
            fill={fill('charcoal')}
            transform="rotate(25 12 46)"
          />
          <Ellipse cx={26} cy={52} rx={12} ry={14.5} fill={fill('charcoal')} />
          <Circle cx={22} cy={38} r={6.5} fill={fill('fleece')} />
          <Circle cx={30} cy={37} r={6.5} fill={fill('fleece')} />
          <DarkEye cx={21} cy={49} r={2.8} />
          <DarkEye cx={32} cy={49} r={2.8} />
          <Smile d="M23 59 C25 61 28 61 30 59" color={T.cream.face} />
          <Gloss cx={52} cy={38} rx={7} ry={3} />
          <Gloss cx={20} cy={44} rx={3} ry={1.8} opacity={0.35} />
        </>
      )}
    </Canvas>
  );
}

/** Goat from the side: horns curving back, beard, short tail up. */
function Goat({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['tan', 'grey', 'charcoal']} local={['fleece']} shadowWidth={32}>
      {(fill) => (
        <>
          <Path d="M82 48 L92 36 C94 34 96 37 94 40 L86 52 Z" fill={fill('tan')} />
          <Legs
            far={[51, 76]}
            near={[41, 67]}
            top={60}
            width={8}
            fill={fill('tan')}
            farFill={T.tan.shade}
            hoof={T.charcoal.face}
          />
          <Ellipse cx={63} cy={55} rx={25} ry={13} fill={fill('tan')} />
          <Path d="M40 58 C36 46 32 38 30 30 L44 26 C47 36 51 44 58 50 Z" fill={fill('tan')} />
          <Path
            d="M31 24 C31 16 37 10 45 14 M36 25 C37 18 43 15 49 19"
            stroke={fill('grey')}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse
            cx={42}
            cy={30}
            rx={8}
            ry={3.4}
            fill={fill('tan')}
            transform="rotate(25 42 30)"
          />
          <Ellipse
            cx={25}
            cy={32}
            rx={14}
            ry={8.5}
            fill={fill('tan')}
            transform="rotate(-38 25 32)"
          />
          <Path d="M17 40 C14 46 14 52 16 56 C20 52 24 46 24 42 Z" fill={fill('fleece')} />
          <Circle cx={15} cy={39} r={1.4} fill={ink} />
          <Eye cx={27} cy={27} r={3} />
          <Gloss cx={58} cy={47} rx={9} ry={3} />
          <Gloss cx={24} cy={24} rx={4} ry={2.2} rotate={-40} />
        </>
      )}
    </Canvas>
  );
}

/** Deer from the side: slim legs, white spots, branching antlers. */
function Deer({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['ginger', 'brown', 'cream', 'charcoal']} shadowWidth={32}>
      {(fill) => (
        <>
          <Legs
            far={[53, 77]}
            near={[43, 68]}
            top={56}
            width={7}
            fill={fill('ginger')}
            farFill={T.ginger.shade}
            hoof={T.charcoal.face}
          />
          <Ellipse
            cx={85}
            cy={45}
            rx={4}
            ry={6}
            fill={fill('cream')}
            transform="rotate(30 85 45)"
          />
          <Ellipse cx={64} cy={51} rx={24} ry={13} fill={fill('ginger')} />
          {[
            [58, 45],
            [67, 43],
            [76, 46],
            [63, 52],
            [72, 52],
          ].map(([cx, cy]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.2} fill={T.cream.face} />
          ))}
          <Path d="M43 52 C39 42 37 34 37 26 L49 24 C49 32 52 42 58 46 Z" fill={fill('ginger')} />
          <Path
            d="M38 20 L35 6 M36 12 L28 7 M44 19 L50 6 M47 12 L56 9"
            stroke={fill('brown')}
            strokeWidth={3.4}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse
            cx={50}
            cy={22}
            rx={8}
            ry={3.8}
            fill={fill('ginger')}
            transform="rotate(-20 50 22)"
          />
          <Ellipse
            cx={50}
            cy={22}
            rx={4.5}
            ry={1.8}
            fill={tongue}
            opacity={0.7}
            transform="rotate(-20 50 22)"
          />
          <Ellipse
            cx={33}
            cy={27}
            rx={12}
            ry={8}
            fill={fill('ginger')}
            transform="rotate(-28 33 27)"
          />
          <Ellipse cx={24} cy={32} rx={6} ry={4.6} fill={fill('cream')} />
          <Circle cx={20.5} cy={31} r={2.4} fill={ink} />
          <Eye cx={33} cy={24} r={3} />
          <Gloss cx={58} cy={41} rx={8} ry={2.8} />
        </>
      )}
    </Canvas>
  );
}

// ─── Small animals ──────────────────────────────────────────────────────────

/** White rabbit sitting, front view: long ears. */
function Rabbit({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['pink']} local={['snow']} shadowWidth={26}>
      {(fill) => (
        <>
          <Ellipse cx={40} cy={89} rx={8} ry={4} fill={fill('snow')} />
          <Ellipse cx={60} cy={89} rx={8} ry={4} fill={fill('snow')} />
          <Path
            d="M50 54 C33 54 28 68 29 80 C30 89 36 92 42 92 L58 92 C64 92 70 89 71 80 C72 68 67 54 50 54 Z"
            fill={fill('snow')}
          />
          <Ellipse cx={44} cy={74} rx={5} ry={4} fill={fill('snow')} />
          <Ellipse cx={56} cy={74} rx={5} ry={4} fill={fill('snow')} />
          <Ellipse
            cx={39}
            cy={23}
            rx={7.5}
            ry={17}
            fill={fill('snow')}
            transform="rotate(-10 39 23)"
          />
          <Ellipse
            cx={61}
            cy={23}
            rx={7.5}
            ry={17}
            fill={fill('snow')}
            transform="rotate(10 61 23)"
          />
          <Ellipse
            cx={39}
            cy={24}
            rx={3.6}
            ry={11.5}
            fill={fill('pink')}
            transform="rotate(-10 39 24)"
          />
          <Ellipse
            cx={61}
            cy={24}
            rx={3.6}
            ry={11.5}
            fill={fill('pink')}
            transform="rotate(10 61 24)"
          />
          <Ellipse cx={50} cy={46} rx={21} ry={17} fill={fill('snow')} />
          <Eye cx={42} cy={44} />
          <Eye cx={58} cy={44} />
          <Path d="M47 50 L53 50 L50 53 Z" fill={tongue} strokeLinejoin="round" />
          <Smile d="M50 53 C50 56 47 57 45 55 M50 53 C50 56 53 57 55 55" />
          <Cheek cx={38} cy={52} />
          <Cheek cx={62} cy={52} />
          <Gloss cx={40} cy={36} rx={6} ry={3.2} />
        </>
      )}
    </Canvas>
  );
}

/** Grey mouse from the side: round ears, pointed nose, long pink tail. */
function Mouse({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['grey', 'pink']} shadowWidth={30}>
      {(fill) => (
        <>
          <Path
            d="M76 84 C92 86 96 70 88 64 C84 61 80 64 82 68"
            stroke={fill('pink')}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={56} cy={46} r={9} fill={T.grey.shade} />
          <Ellipse cx={60} cy={72} rx={23} ry={19} fill={fill('grey')} />
          <Path
            d="M12 66 C18 58 30 50 42 50 C54 50 58 62 54 72 C50 80 40 80 30 78 C20 76 14 72 12 66 Z"
            fill={fill('grey')}
          />
          <Circle cx={43} cy={43} r={12} fill={fill('grey')} />
          <Circle cx={43} cy={43} r={7.5} fill={fill('pink')} />
          <Circle cx={12.5} cy={66} r={3} fill={tongue} />
          <Path
            d="M20 66 L8 61 M20 68 L7 70"
            stroke={ink}
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={0.5}
          />
          <Eye cx={30} cy={61} r={3.2} />
          <Cheek cx={34} cy={69} />
          <Ellipse cx={42} cy={90} rx={6} ry={2.6} fill={fill('pink')} />
          <Ellipse cx={66} cy={90} rx={6} ry={2.6} fill={fill('pink')} />
          <Gloss cx={56} cy={60} rx={9} ry={3.5} />
          <Gloss cx={30} cy={55} rx={4} ry={2} />
        </>
      )}
    </Canvas>
  );
}

/** Squirrel sitting up with an acorn; the big curled tail is the clue. */
function Squirrel({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['terracotta', 'cream', 'brown', 'tan']} shadowWidth={30}>
      {(fill) => (
        <>
          <Path
            d="M58 90 C82 92 96 72 88 52 C82 38 92 26 82 14 C72 4 54 10 60 26 C64 36 74 44 70 60 C68 72 56 78 58 90 Z"
            fill={fill('terracotta')}
          />
          <Path
            d="M78 22 C86 30 80 40 84 50 M80 62 C78 72 72 78 66 82"
            stroke={T.terracotta.light}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
            opacity={0.8}
          />
          <Path
            d="M46 50 C32 50 26 66 28 80 C29 88 34 92 42 92 L54 92 C62 92 66 86 64 76 C62 62 60 50 46 50 Z"
            fill={fill('terracotta')}
          />
          <Ellipse cx={42} cy={76} rx={8} ry={12} fill={fill('cream')} />
          <Ellipse cx={40} cy={90} rx={9} ry={3.6} fill={fill('terracotta')} />
          <Path d="M42 32 L45 15 C46 13 48 13 49 15 L52 32 Z" fill={fill('terracotta')} />
          <Ellipse cx={40} cy={40} rx={15} ry={13} fill={fill('terracotta')} />
          <Ellipse cx={27} cy={45} rx={8} ry={6.5} fill={fill('terracotta')} />
          <Ellipse cx={30} cy={48} rx={7} ry={4} fill={T.cream.face} opacity={0.7} />
          <Circle cx={20} cy={44} r={2.4} fill={ink} />
          <Eye cx={35} cy={38} />
          <Cheek cx={34} cy={47} />
          <Ellipse cx={31} cy={66} rx={6} ry={7.5} fill={fill('tan')} />
          <Path d="M24 62 C24 56 38 56 38 62 Z" fill={fill('brown')} />
          <Ellipse cx={34} cy={62} rx={4} ry={3.2} fill={fill('terracotta')} />
          <Ellipse cx={28} cy={70} rx={4} ry={3.2} fill={fill('terracotta')} />
          <Gloss cx={36} cy={32} rx={6} ry={3} />
          <Gloss cx={66} cy={18} rx={5} ry={2.6} rotate={-60} />
        </>
      )}
    </Canvas>
  );
}

/** Spiky back built from points on a half ellipse, alternating long and short. */
function spikePath(cx: number, cy: number, rx: number, ry: number, count: number): string {
  const points: string[] = [];
  for (let i = 0; i <= count * 2; i++) {
    const angle = Math.PI + (Math.PI * i) / (count * 2);
    const k = i % 2 === 0 ? 0.84 : 1;
    const x = cx + Math.cos(angle) * rx * k;
    const y = cy + Math.sin(angle) * ry * k;
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${points.join(' L')} Z`;
}

const HEDGEHOG_SPIKES = spikePath(58, 82, 36, 46, 11);

/** Hedgehog from the side: spiky brown back, pointed light face. */
function Hedgehog({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['brown', 'tan']} shadowWidth={34}>
      {(fill) => (
        <>
          <Ellipse cx={46} cy={90} rx={5} ry={2.8} fill={T.tan.shade} />
          <Ellipse cx={72} cy={90} rx={5} ry={2.8} fill={T.tan.shade} />
          <Path d={HEDGEHOG_SPIKES} fill={fill('brown')} strokeLinejoin="round" />
          <Ellipse cx={58} cy={84} rx={32} ry={6} fill={fill('tan')} />
          <Path
            d="M48 54 L54 48 M62 50 L68 46 M56 64 L62 60 M70 62 L76 58 M44 68 L50 64"
            stroke={T.brown.light}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Path
            d="M38 62 C30 62 16 70 9 76 C6 79 8 83 12 83 L28 84 C38 84 44 78 44 72 C44 66 42 62 38 62 Z"
            fill={fill('tan')}
          />
          <Circle cx={36} cy={62} r={4.5} fill={fill('tan')} />
          <Circle cx={8.5} cy={78} r={3.2} fill={ink} />
          <Eye cx={25} cy={71} r={3} />
          <Cheek cx={29} cy={78} r={3} />
          <Gloss cx={46} cy={44} rx={8} ry={3} />
        </>
      )}
    </Canvas>
  );
}

/** Green frog sitting, front view: eyes on top, wide smile. */
function Frog({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['mint', 'cream']} shadowWidth={34}>
      {(fill) => (
        <>
          <Ellipse cx={22} cy={82} rx={14} ry={9} fill={fill('mint')} />
          <Ellipse cx={78} cy={82} rx={14} ry={9} fill={fill('mint')} />
          <Ellipse cx={50} cy={68} rx={28} ry={22} fill={fill('mint')} />
          <Ellipse cx={50} cy={74} rx={16} ry={13} fill={T.mint.light} opacity={0.85} />
          <Ellipse cx={38} cy={89} rx={7.5} ry={3.6} fill={fill('mint')} />
          <Ellipse cx={62} cy={89} rx={7.5} ry={3.6} fill={fill('mint')} />
          <Ellipse cx={50} cy={46} rx={31} ry={18} fill={fill('mint')} />
          <Circle cx={33} cy={30} r={11} fill={fill('mint')} />
          <Circle cx={67} cy={30} r={11} fill={fill('mint')} />
          <Circle cx={33} cy={30} r={7.5} fill={fill('cream')} />
          <Circle cx={67} cy={30} r={7.5} fill={fill('cream')} />
          <Eye cx={34} cy={31} r={4.4} />
          <Eye cx={66} cy={31} r={4.4} />
          <Circle cx={46} cy={44} r={1.2} fill={ink} opacity={0.6} />
          <Circle cx={54} cy={44} r={1.2} fill={ink} opacity={0.6} />
          <Smile d="M30 50 C40 60 60 60 70 50" width={2.2} />
          <Cheek cx={28} cy={53} r={4} />
          <Cheek cx={72} cy={53} r={4} />
          <Gloss cx={28} cy={22} rx={4} ry={2.4} />
          <Gloss cx={38} cy={38} rx={8} ry={3} rotate={-10} />
        </>
      )}
    </Canvas>
  );
}

/** Turtle from the side: high brown shell with plates, green head and legs. */
function Turtle({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['mint', 'brown', 'tan']} shadowWidth={38}>
      {(fill) => (
        <>
          <Path d="M86 76 L96 80 L86 84 Z" fill={fill('mint')} strokeLinejoin="round" />
          <Rect x={46} y={72} width={11} height={20} rx={5.5} fill={T.mint.shade} />
          <Rect x={76} y={72} width={11} height={20} rx={5.5} fill={T.mint.shade} />
          <Rect x={34} y={72} width={12} height={20} rx={6} fill={fill('mint')} />
          <Rect x={64} y={72} width={12} height={20} rx={6} fill={fill('mint')} />
          <Path d="M30 72 C26 66 20 64 16 64 L18 78 C24 80 30 78 32 76 Z" fill={fill('mint')} />
          <Circle cx={15} cy={62} r={11} fill={fill('mint')} />
          <Path d="M26 78 C26 50 40 34 58 34 C76 34 90 50 90 78 Z" fill={fill('brown')} />
          <Path
            d="M50 42 L66 42 L72 56 L64 68 L52 68 L44 56 Z M30 62 L40 56 L46 70 L32 74 Z M76 56 L86 62 L86 74 L72 70 Z"
            fill={T.brown.light}
            opacity={0.6}
            strokeLinejoin="round"
          />
          <Rect x={22} y={74} width={72} height={8} rx={4} fill={fill('tan')} />
          <Eye cx={13} cy={59} r={3.2} />
          <Smile d="M6 66 C8 68 11 68 13 66" />
          <Cheek cx={17} cy={66} r={2.8} />
          <Gloss cx={44} cy={42} rx={8} ry={3.5} />
          <Gloss cx={12} cy={54} rx={3.4} ry={2} />
        </>
      )}
    </Canvas>
  );
}

// ─── Bugs ───────────────────────────────────────────────────────────────────

/** Bee flying left: yellow body with dark stripes, clear wings, stinger. */
function Bee({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['lemon', 'charcoal', 'glass']} shadowWidth={20}>
      {(fill, id) => (
        <>
          <Defs>
            <ClipPath id={`${id}-bee`}>
              <Ellipse cx={52} cy={58} rx={32} ry={21} />
            </ClipPath>
          </Defs>
          <Path d="M84 58 L94 60 L84 63 Z" fill={fill('charcoal')} strokeLinejoin="round" />
          <Ellipse cx={52} cy={58} rx={32} ry={21} fill={fill('lemon')} />
          <G clipPath={`url(#${id}-bee)`}>
            <Rect x={50} y={30} width={9} height={60} rx={3} fill={T.charcoal.face} />
            <Rect x={67} y={30} width={9} height={60} rx={3} fill={T.charcoal.face} />
            <Rect x={83} y={30} width={9} height={60} fill={T.charcoal.face} />
          </G>
          <Ellipse
            cx={56}
            cy={30}
            rx={10}
            ry={17}
            fill={fill('glass')}
            opacity={0.9}
            transform="rotate(-20 56 30)"
          />
          <Ellipse
            cx={70}
            cy={32}
            rx={8}
            ry={14}
            fill={fill('glass')}
            opacity={0.9}
            transform="rotate(20 70 32)"
          />
          <Path
            d="M28 42 C24 32 18 28 12 30 M36 40 C36 30 32 22 26 20"
            stroke={T.charcoal.face}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={12} cy={30} r={2.8} fill={fill('charcoal')} />
          <Circle cx={26} cy={20} r={2.8} fill={fill('charcoal')} />
          <Eye cx={32} cy={54} r={4} />
          <Smile d="M26 64 C29 67 33 67 36 64" />
          <Cheek cx={38} cy={62} />
          <Gloss cx={38} cy={45} rx={7} ry={3} />
        </>
      )}
    </Canvas>
  );
}

const WING_TOP = 'M47 48 C40 20 18 10 11 26 C6 40 24 54 47 54 Z';
const WING_BOTTOM = 'M47 56 C30 56 16 68 22 80 C28 90 44 80 47 62 Z';

/** Butterfly from the front: pink top wings, orange lower wings, yellow dots. */
function Butterfly({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['berry', 'orange', 'lemon', 'charcoal']} shadowWidth={22}>
      {(fill) => (
        <>
          <Path d={WING_BOTTOM} fill={fill('orange')} />
          <Path d={mirrorPath(WING_BOTTOM)} fill={fill('orange')} />
          <Path d={WING_TOP} fill={fill('berry')} />
          <Path d={mirrorPath(WING_TOP)} fill={fill('berry')} />
          <Circle cx={24} cy={30} r={6} fill={fill('lemon')} />
          <Circle cx={76} cy={30} r={6} fill={fill('lemon')} />
          <Circle cx={34} cy={42} r={3.2} fill={fill('lemon')} />
          <Circle cx={66} cy={42} r={3.2} fill={fill('lemon')} />
          <Circle cx={31} cy={72} r={3.8} fill={fill('lemon')} />
          <Circle cx={69} cy={72} r={3.8} fill={fill('lemon')} />
          <Path
            d="M47 32 C44 22 40 18 36 18 M53 32 C56 22 60 18 64 18"
            stroke={T.charcoal.face}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={36} cy={18} r={2.6} fill={fill('charcoal')} />
          <Circle cx={64} cy={18} r={2.6} fill={fill('charcoal')} />
          <Rect x={45} y={38} width={10} height={44} rx={5} fill={fill('charcoal')} />
          <Circle cx={50} cy={35} r={7} fill={fill('charcoal')} />
          <DarkEye cx={47} cy={34} r={1.6} />
          <DarkEye cx={53} cy={34} r={1.6} />
          <Gloss cx={22} cy={22} rx={6} ry={2.6} />
          <Gloss cx={64} cy={22} rx={5} ry={2.4} opacity={0.4} />
        </>
      )}
    </Canvas>
  );
}

/** Ant from the side: three body parts in a row, six legs, bent antennae. */
function Ant({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['brown']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path
            d="M50 64 L46 76 L42 88 M56 64 L62 76 L64 88"
            stroke={T.brown.shade}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Ellipse cx={75} cy={62} rx={18} ry={14} fill={fill('brown')} />
          <Ellipse cx={53} cy={62} rx={9} ry={7} fill={fill('brown')} />
          <Path
            d="M48 66 L36 76 L26 90 M53 68 L52 80 L48 90 M58 66 L70 78 L78 90"
            stroke={T.brown.face}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx={30} cy={54} r={13} fill={fill('brown')} />
          <Path
            d="M28 42 L22 30 L10 26 M36 43 L36 30 L26 20"
            stroke={T.brown.face}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <DarkEye cx={25} cy={52} r={3.2} />
          <Smile d="M20 61 C23 63 26 63 28 61" color={T.cream.face} />
          <Gloss cx={68} cy={54} rx={7} ry={3} />
          <Gloss cx={26} cy={45} rx={4} ry={2.2} />
        </>
      )}
    </Canvas>
  );
}

const SPIDER_LEG = 'M42 54 C32 40 22 38 12 46';
const SPIDER_LEGS = [
  SPIDER_LEG,
  'M40 60 C28 52 16 54 8 64',
  'M40 66 C30 64 20 70 14 80',
  'M43 70 C38 74 32 82 30 90',
];

/** Spider hanging from its thread, eight legs, friendly eyes. */
function Spider({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['charcoal', 'grey']} shadowWidth={18}>
      {(fill) => (
        <>
          <Path d="M50 2 L50 44" stroke={T.grey.face} strokeWidth={1.6} strokeLinecap="round" />
          {SPIDER_LEGS.map((d) => (
            <G key={d}>
              <Path
                d={d}
                stroke={T.charcoal.face}
                strokeWidth={3.6}
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d={mirrorPath(d)}
                stroke={T.charcoal.face}
                strokeWidth={3.6}
                strokeLinecap="round"
                fill="none"
              />
            </G>
          ))}
          <Circle cx={50} cy={62} r={18} fill={fill('charcoal')} />
          <DarkEye cx={43} cy={58} r={3.6} />
          <DarkEye cx={57} cy={58} r={3.6} />
          <Smile d="M45 69 C48 72 52 72 55 69" color={T.cream.face} width={1.8} />
          <Cheek cx={39} cy={67} />
          <Cheek cx={61} cy={67} />
          <Gloss cx={42} cy={50} rx={6} ry={3} opacity={0.45} />
        </>
      )}
    </Canvas>
  );
}

/** Ladybug from above: red shell split in two, black dots, dark head. */
function Ladybug({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['red', 'charcoal']} shadowWidth={30}>
      {(fill) => (
        <>
          <Path
            d="M24 48 L14 44 M22 62 L10 62 M24 76 L14 82 M76 48 L86 44 M78 62 L90 62 M76 76 L86 82"
            stroke={T.charcoal.face}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Path
            d="M42 18 C40 10 34 6 30 8 M58 18 C60 10 66 6 70 8"
            stroke={T.charcoal.face}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={30} cy={8} r={2.6} fill={fill('charcoal')} />
          <Circle cx={70} cy={8} r={2.6} fill={fill('charcoal')} />
          <Circle cx={50} cy={28} r={13} fill={fill('charcoal')} />
          <Circle cx={50} cy={60} r={31} fill={fill('red')} />
          <Path d="M50 30 L50 91" stroke={T.charcoal.face} strokeWidth={2.4} />
          <Circle cx={36} cy={50} r={6} fill={T.charcoal.face} />
          <Circle cx={64} cy={50} r={6} fill={T.charcoal.face} />
          <Circle cx={33} cy={70} r={5} fill={T.charcoal.face} />
          <Circle cx={67} cy={70} r={5} fill={T.charcoal.face} />
          <Circle cx={45} cy={81} r={3.6} fill={T.charcoal.face} />
          <Circle cx={55} cy={81} r={3.6} fill={T.charcoal.face} />
          <DarkEye cx={44.5} cy={24} r={2.6} />
          <DarkEye cx={55.5} cy={24} r={2.6} />
          <Gloss cx={36} cy={40} rx={8} ry={3.5} />
        </>
      )}
    </Canvas>
  );
}

/** Snail from the side: spiral shell, eyes on stalks. */
function Snail({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['tan', 'terracotta']} shadowWidth={38}>
      {(fill) => (
        <>
          <Path
            d="M23 54 L18 36 M30 54 L32 36"
            stroke={T.tan.face}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Path
            d="M14 92 C8 92 6 86 10 80 C14 72 14 62 20 56 C26 50 36 54 36 64 L36 76 L86 82 C94 84 94 92 86 92 Z"
            fill={fill('tan')}
          />
          <Circle cx={18} cy={34} r={4.6} fill={fill('tan')} />
          <Circle cx={32} cy={34} r={4.6} fill={fill('tan')} />
          <Eye cx={18} cy={34} r={2.8} />
          <Eye cx={32} cy={34} r={2.8} />
          <Smile d="M16 66 C19 69 23 69 26 66" />
          <Cheek cx={28} cy={64} r={2.8} />
          <Circle cx={62} cy={58} r={26} fill={fill('terracotta')} />
          <Path
            d="M64 60 C60 62 56 58 58 54 C60 49 68 50 70 56 C72 64 64 70 56 68 C46 66 44 52 52 46 C62 38 78 44 80 56 C82 70 72 80 60 80"
            stroke={T.terracotta.shade}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={50} cy={42} rx={8} ry={3.5} />
          <Gloss cx={14} cy={66} rx={2.6} ry={4} rotate={20} opacity={0.4} />
        </>
      )}
    </Canvas>
  );
}

/** Pink worm wiggling out of a small mound of soil. */
function Worm({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['pink', 'brown']} shadowWidth={30}>
      {(fill) => (
        <>
          <Path
            d="M60 82 C62 66 34 72 36 52 C38 38 56 36 54 24"
            stroke={fill('pink')}
            strokeWidth={15}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M50 70 L58 64 M38 58 L46 56 M42 42 L50 46"
            stroke={T.pink.shade}
            strokeWidth={1.8}
            strokeLinecap="round"
            opacity={0.7}
          />
          <Circle cx={53} cy={23} r={10} fill={fill('pink')} />
          <Eye cx={49} cy={21} r={2.8} />
          <Eye cx={58} cy={21} r={2.8} />
          <Smile d="M50 28 C52 30 55 30 57 28" />
          <Cheek cx={46} cy={27} r={2.6} />
          <Gloss cx={47} cy={16} rx={3.4} ry={2} />
          <Path
            d="M30 92 C32 82 42 78 52 82 C56 78 66 78 72 82 C80 82 86 86 86 92 Z"
            fill={fill('brown')}
          />
          <Circle cx={44} cy={88} r={1.6} fill={T.brown.light} />
          <Circle cx={70} cy={87} r={1.4} fill={T.brown.light} />
        </>
      )}
    </Canvas>
  );
}

export const animalSmallArt: WordArtMap = {
  'animal.bird': Bird,
  'animal.horse': Horse,
  'animal.cow': Cow,
  'animal.sheep': Sheep,
  'animal.goat': Goat,
  'animal.chicken': Chicken,
  'animal.rooster': Rooster,
  'animal.duck': Duck,
  'animal.donkey': Donkey,
  'animal.rabbit': Rabbit,
  'animal.mouse': Mouse,
  'animal.frog': Frog,
  'animal.turtle': Turtle,
  'animal.bee': Bee,
  'animal.butterfly': Butterfly,
  'animal.ant': Ant,
  'animal.spider': Spider,
  'animal.ladybug': Ladybug,
  'animal.snail': Snail,
  'animal.worm': Worm,
  'animal.squirrel': Squirrel,
  'animal.hedgehog': Hedgehog,
  'animal.deer': Deer,
  'animal.owl': Owl,
  'animal.parrot': Parrot,
};
