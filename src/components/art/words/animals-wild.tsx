import { useId, type ReactNode } from 'react';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Wild animals of the 2–7 mode, drawn like the pilot animals (animals.tsx):
// clay shapes lit from the top left, one gloss, the shared ground shadow, no
// outlines. Look-alikes are told apart by silhouette first, colour second:
// lion (front, round mane) vs tiger (side, stripes); wolf (howling, moon) vs
// fox (front, big tail); dolphin (arched, beak) vs whale (round, spout) vs
// shark (straight, tall fin). Animals that scare small children (shark,
// crocodile, snake) smile, have big round eyes and no sharp teeth.

const { ink, tongue, cheek, gloss } = artPalette;
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

// Extra tones this group needs, derived from the art palette so they stay in
// the same family. Kept here (not in artPalette) until another group needs them.
const wildTones = {
  /** Lion's coat: between lemon and ginger. */
  gold: mixTone(T.lemon, T.ginger, 0.45),
  /** Crocodile, snake, bamboo: mint pulled towards yellow, a friendly leaf green. */
  leaf: mixTone(T.mint, T.lemon, 0.3),
  /** Whale: the deep end of sky. */
  ocean: { light: T.sky.face, face: T.sky.shade, shade: mix(T.sky.shade, T.charcoal.face, 0.35) },
  /** White fur and feathers: cooler than the cream cards, so it does not melt into them. */
  snow: { light: T.cream.light, face: mix(T.cream.face, T.grey.light, 0.6), shade: T.grey.face },
  /** Octopus. */
  lilac: mixTone(T.berry, T.sky, 0.5),
  /** Hippo: grey with a pink cast, so it is not the elephant's grey. */
  hippo: mixTone(T.grey, T.pink, 0.4),
  /** Hippo's muzzle: the light end of the same grey-pink (a pink snout would read as a pig). */
  hippoMuzzle: mixTone(mixTone(T.grey, T.pink, 0.4), T.cream, 0.45),
} satisfies Record<string, ClayTone>;

type WildToneName = keyof typeof wildTones;
type Tone = ArtToneName | WildToneName;
type Fill = (tone: Tone) => string;

const isWild = (tone: Tone): tone is WildToneName => Object.hasOwn(wildTones, tone);

/** WordCanvas that also knows the derived tones; `ref(name)` makes unique clip ids. */
function WildCanvas({
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
  const prefix = `w${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const base = tones.filter((t): t is ArtToneName => !isWild(t));
  const extra = tones.filter(isWild);
  const ref = (name: string) => `${prefix}-${name}`;
  return (
    <WordCanvas size={size} tones={base} shadowWidth={shadowWidth}>
      {(baseFill) => (
        <>
          {extra.length > 0 ? (
            <Defs>
              {extra.map((t) => (
                <ClayGradient key={t} id={ref(t)} tone={wildTones[t]} />
              ))}
            </Defs>
          ) : null}
          {children((t) => (isWild(t) ? `url(#${ref(t)})` : baseFill(t)), ref)}
        </>
      )}
    </WordCanvas>
  );
}

/** Flat colour of a tone (for far legs, spots, stripes). */
const flat = (tone: Tone, stop: keyof ClayTone = 'face') =>
  isWild(tone) ? wildTones[tone][stop] : T[tone][stop];

/** Round dark eye with one white sparkle, the same on every animal. */
function Eye({ cx, cy, r = 3.6 }: { cx: number; cy: number; r?: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={ink} />
      <Circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.32} fill={gloss} />
    </G>
  );
}

function Cheeks({ y, dx, cx = 50, r = 4 }: { y: number; dx: number; cx?: number; r?: number }) {
  return (
    <G opacity={0.55}>
      <Ellipse cx={cx - dx} cy={y} rx={r} ry={r * 0.65} fill={cheek} />
      <Ellipse cx={cx + dx} cy={y} rx={r} ry={r * 0.65} fill={cheek} />
    </G>
  );
}

function Cheek({ cx, cy, r = 3.6 }: { cx: number; cy: number; r?: number }) {
  return <Ellipse cx={cx} cy={cy} rx={r} ry={r * 0.65} fill={cheek} opacity={0.55} />;
}

/** Small closed-mouth smile. */
function Smile({
  cx,
  cy,
  w = 4,
  width = 1.6,
}: {
  cx: number;
  cy: number;
  w?: number;
  width?: number;
}) {
  return (
    <Path
      d={`M${cx - w} ${cy} Q${cx} ${cy + w * 0.9} ${cx + w} ${cy}`}
      stroke={ink}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
    />
  );
}

/** Rounded stroke used for tails, necks and tentacles. */
function Limb({ d, color, width }: { d: string; color: string; width: number }) {
  return (
    <Path
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

/** Sitting body seen from the front (same shape as the pilot cat and dog). */
const SIT_BODY =
  'M50 52 C32 52 26 68 27 80 C28 89 34 92 41 92 L59 92 C66 92 72 89 73 80 C74 68 68 52 50 52 Z';

// ---------------------------------------------------------------- savanna

/** Lion, sitting, front view: the round scalloped mane is the whole silhouette. */
function Lion({ size }: WordArtProps) {
  const petals = 12;
  return (
    <WildCanvas size={size} tones={['gold', 'terracotta', 'cream']}>
      {(fill) => (
        <>
          <Limb d="M70 86 C84 86 90 76 86 64" color={fill('gold')} width={6} />
          <Circle cx={85} cy={61} r={5.5} fill={fill('terracotta')} />
          <Path d={SIT_BODY} fill={fill('gold')} />
          <Ellipse cx={41} cy={89} rx={7} ry={4} fill={flat('gold', 'light')} />
          <Ellipse cx={59} cy={89} rx={7} ry={4} fill={flat('gold', 'light')} />
          {/* Mane: a ring of round tufts around one disc. */}
          {Array.from({ length: petals }, (_, i) => {
            const a = (2 * Math.PI * i) / petals;
            return (
              <Circle
                key={i}
                cx={50 + Math.cos(a) * 25}
                cy={38 + Math.sin(a) * 24}
                r={10}
                fill={fill('terracotta')}
              />
            );
          })}
          <Circle cx={50} cy={38} r={27} fill={fill('terracotta')} />
          <Circle cx={34} cy={23} r={6} fill={fill('gold')} />
          <Circle cx={66} cy={23} r={6} fill={fill('gold')} />
          <Circle cx={34} cy={23} r={3} fill={tongue} />
          <Circle cx={66} cy={23} r={3} fill={tongue} />
          <Ellipse cx={50} cy={40} rx={19} ry={17.5} fill={fill('gold')} />
          <Ellipse cx={45.5} cy={48} rx={6} ry={4.6} fill={fill('cream')} />
          <Ellipse cx={54.5} cy={48} rx={6} ry={4.6} fill={fill('cream')} />
          <Eye cx={42} cy={37} />
          <Eye cx={58} cy={37} />
          <Path
            d="M46.5 43.5 C46.5 41.5 53.5 41.5 53.5 43.5 C53.5 45.5 51 47 50 47 C49 47 46.5 45.5 46.5 43.5 Z"
            fill={T.brown.face}
          />
          <Path
            d="M50 47 L50 49 M50 49 C50 52 46.5 53 45 51 M50 49 C50 52 53.5 53 55 51"
            stroke={ink}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Cheeks y={46} dx={13} r={3.4} />
          <Gloss cx={30} cy={20} rx={7} ry={4} />
        </>
      )}
    </WildCanvas>
  );
}

/** Tiger standing side-on, head turned to us: stripes, round ears, no mane. */
function Tiger({ size }: WordArtProps) {
  const body =
    'M42 50 C54 44 76 44 84 52 C90 58 90 72 82 76 C72 80 50 80 42 76 C34 72 34 54 42 50 Z';
  return (
    <WildCanvas size={size} tones={['orange', 'cream', 'charcoal']} shadowWidth={38}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('body')}>
              <Path d={body} />
            </ClipPath>
          </Defs>
          <Limb d="M84 60 C92 58 96 50 93 40" color={fill('orange')} width={5.5} />
          <Circle cx={93} cy={39} r={3.6} fill={fill('charcoal')} />
          {[48, 76].map((x) => (
            <Rect
              key={x}
              x={x}
              y={64}
              width={10}
              height={28}
              rx={5}
              fill={flat('orange', 'shade')}
            />
          ))}
          <Path d={body} fill={fill('orange')} />
          <G clipPath={`url(#${ref('body')})`}>
            <Ellipse cx={62} cy={80} rx={26} ry={8} fill={T.cream.face} opacity={0.75} />
            <Path
              d="M56 42 C53 50 55 56 58 60 M66 42 C63 50 65 56 68 61 M76 44 C73 50 75 56 78 60 M86 50 C83 54 84 60 87 62"
              stroke={T.charcoal.face}
              strokeWidth={3.4}
              strokeLinecap="round"
              fill="none"
            />
          </G>
          {[40, 68].map((x) => (
            <Rect key={x} x={x} y={64} width={11} height={28} rx={5.5} fill={fill('orange')} />
          ))}
          <Path
            d="M41 82 L49 82 M69 82 L77 82"
            stroke={T.charcoal.face}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <Circle cx={15} cy={29} r={7} fill={fill('orange')} />
          <Circle cx={45} cy={29} r={7} fill={fill('orange')} />
          <Circle cx={15} cy={29} r={3.5} fill={T.charcoal.face} />
          <Circle cx={45} cy={29} r={3.5} fill={T.charcoal.face} />
          {/* Head with fluffy cheeks. */}
          <Path
            d="M30 24 C42 24 50 32 50 44 C54 48 52 54 48 55 C44 62 36 64 30 64 C24 64 16 62 12 55 C8 54 6 48 10 44 C10 32 18 24 30 24 Z"
            fill={fill('orange')}
          />
          <Ellipse cx={30} cy={54} rx={12} ry={8.5} fill={fill('cream')} />
          <Path
            d="M30 26 L30 32 M24 28 L25.5 33 M36 28 L34.5 33 M9 45 L15 46 M9.5 50 L15 50 M51 45 L45 46 M50.5 50 L45 50"
            stroke={T.charcoal.face}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <Eye cx={23} cy={42} />
          <Eye cx={37} cy={42} />
          <Path d="M27 49 L33 49 L30 52.5 Z" fill={tongue} strokeLinejoin="round" />
          <Path
            d="M30 52.5 C30 56 26.5 57 25 55 M30 52.5 C30 56 33.5 57 35 55"
            stroke={ink}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={21} cy={32} rx={5} ry={3} />
          <Gloss cx={58} cy={52} rx={7} ry={3} />
        </>
      )}
    </WildCanvas>
  );
}

/** Monkey, sitting, front view: big ears out to the sides, heart face, curly tail. */
function Monkey({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['brown', 'tan', 'lemon']}>
      {(fill) => (
        <>
          <Limb
            d="M70 86 C88 88 94 72 86 64 C80 58 73 63 78 68"
            color={fill('brown')}
            width={5.5}
          />
          <Path d={SIT_BODY} fill={fill('brown')} />
          <Ellipse cx={50} cy={74} rx={13} ry={13} fill={fill('tan')} />
          <Ellipse cx={41} cy={89} rx={7} ry={4} fill={fill('tan')} />
          <Ellipse cx={59} cy={89} rx={7} ry={4} fill={fill('tan')} />
          <Circle cx={23} cy={38} r={9.5} fill={fill('brown')} />
          <Circle cx={77} cy={38} r={9.5} fill={fill('brown')} />
          <Circle cx={23} cy={38} r={5.5} fill={fill('tan')} />
          <Circle cx={77} cy={38} r={5.5} fill={fill('tan')} />
          <Circle cx={50} cy={38} r={24} fill={fill('brown')} />
          <Path
            d="M48 15 C45 10 50 6 54 9"
            stroke={T.brown.face}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
          {/* Heart-shaped face mask. */}
          <Circle cx={43} cy={36} r={9} fill={fill('tan')} />
          <Circle cx={57} cy={36} r={9} fill={fill('tan')} />
          <Ellipse cx={50} cy={47} rx={15} ry={11} fill={fill('tan')} />
          <Eye cx={43} cy={36} />
          <Eye cx={57} cy={36} />
          <Circle cx={48} cy={44} r={1.2} fill={ink} />
          <Circle cx={52} cy={44} r={1.2} fill={ink} />
          <Smile cx={50} cy={49} w={6} />
          <Cheeks y={47} dx={11} r={3.2} />
          <Gloss cx={38} cy={22} rx={6} ry={3.5} />
        </>
      )}
    </WildCanvas>
  );
}

/** Giraffe from the side: the long neck and the two horn knobs. */
function Giraffe({ size }: WordArtProps) {
  const body =
    'M44 56 C50 48 76 48 84 54 C90 60 88 70 80 72 C70 75 52 75 46 72 C40 68 40 60 44 56 Z';
  const neck = 'M42 62 L26 26 C25 22 30 18 34 20 L54 56 Z';
  return (
    <WildCanvas size={size} tones={['lemon', 'orange', 'brown', 'tan']} shadowWidth={30}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('spots')}>
              <Path d={body} />
              <Path d={neck} />
            </ClipPath>
          </Defs>
          <Limb d="M86 58 C90 62 91 68 89 74" color={fill('lemon')} width={2.5} />
          <Ellipse cx={89} cy={75} rx={2.4} ry={3.2} fill={T.brown.face} />
          {[54, 80].map((x) => (
            <Rect
              key={x}
              x={x}
              y={64}
              width={7}
              height={28}
              rx={3.5}
              fill={flat('lemon', 'shade')}
            />
          ))}
          <Path
            d="M38 50 L26 23"
            stroke={T.brown.face}
            strokeWidth={10}
            strokeLinecap="round"
            transform="translate(4 -1)"
          />
          <Path d={neck} fill={fill('lemon')} strokeLinejoin="round" />
          <Path d={body} fill={fill('lemon')} />
          <G clipPath={`url(#${ref('spots')})`} fill={T.orange.face} opacity={0.9}>
            <Path d="M54 52 C60 50 64 54 62 58 C60 62 54 62 52 58 C51 55 51 53 54 52 Z" />
            <Path d="M68 52 C74 51 77 55 75 59 C72 62 66 61 66 57 C66 54 66 53 68 52 Z" />
            <Path d="M80 56 C84 56 86 60 84 63 C81 65 78 63 78 60 C78 58 78 56 80 56 Z" />
            <Path d="M58 64 C63 63 66 66 64 70 C61 72 56 71 56 68 C56 66 56 65 58 64 Z" />
            <Path d="M70 64 C75 63 78 67 76 70 C73 73 68 71 68 68 C68 66 68 65 70 64 Z" />
            <Path d="M44 56 C48 56 49 60 47 62 C45 63 42 62 42 60 C42 58 42 56 44 56 Z" />
            <Path d="M38 44 C42 43 44 47 42 49 C40 51 37 50 36 48 C36 46 36 45 38 44 Z" />
            <Path d="M33 32 C36 32 38 35 36 37 C34 39 31 38 31 36 C31 34 31 33 33 32 Z" />
          </G>
          {[48, 72].map((x) => (
            <Rect key={x} x={x} y={64} width={8} height={28} rx={4} fill={fill('lemon')} />
          ))}
          <Path
            d="M48 90 L56 90 M72 90 L80 90"
            stroke={T.brown.face}
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* Horn knobs and ear behind the head. */}
          <Path
            d="M29 14 L28 6 M36 14 L37 6.5"
            stroke={fill('lemon')}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Circle cx={28} cy={5.5} r={2.8} fill={fill('brown')} />
          <Circle cx={37} cy={6} r={2.8} fill={fill('brown')} />
          <Ellipse
            cx={42}
            cy={17}
            rx={6}
            ry={3}
            fill={fill('lemon')}
            transform="rotate(-20 42 17)"
          />
          <Ellipse cx={30} cy={20} rx={12} ry={9} fill={fill('lemon')} />
          <Ellipse cx={20} cy={24} rx={8} ry={6.5} fill={fill('tan')} />
          <Circle cx={16.5} cy={22.5} r={1.1} fill={ink} />
          <Eye cx={30} cy={18} r={3.2} />
          <Path
            d="M15 27 C18 29 21 29 23 27"
            stroke={ink}
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />
          <Cheek cx={26} cy={25} r={3} />
          <Gloss cx={26} cy={14} rx={5} ry={2.6} />
          <Gloss cx={58} cy={53} rx={7} ry={2.6} />
        </>
      )}
    </WildCanvas>
  );
}

/** Zebra from the side: a chubby striped pony with a brush mane. */
function Zebra({ size }: WordArtProps) {
  const body =
    'M40 52 C48 44 76 44 84 52 C90 58 88 70 80 72 C70 75 50 75 42 72 C34 68 34 58 40 52 Z';
  const neck = 'M30 22 C38 18 46 24 50 34 L54 52 L36 58 Z';
  return (
    <WildCanvas size={size} tones={['snow', 'charcoal', 'grey']} shadowWidth={36}>
      {(fill, ref) => (
        <>
          <Defs>
            <ClipPath id={ref('stripes')}>
              <Path d={body} />
              <Path d={neck} />
            </ClipPath>
          </Defs>
          <Limb d="M86 56 C91 60 92 66 90 72" color={fill('snow')} width={2.6} />
          <Ellipse cx={90} cy={73} rx={2.6} ry={4} fill={fill('charcoal')} />
          {[50, 78].map((x) => (
            <Rect
              key={x}
              x={x}
              y={64}
              width={9}
              height={28}
              rx={4.5}
              fill={flat('snow', 'shade')}
            />
          ))}
          {/* Brush mane along the neck. */}
          <Path
            d="M28 18 C34 10 44 14 46 20 C50 20 54 26 52 30 C56 32 58 38 56 42 L48 40 L34 24 Z"
            fill={fill('charcoal')}
          />
          <Path d={neck} fill={fill('snow')} />
          <Path d={body} fill={fill('snow')} />
          <G clipPath={`url(#${ref('stripes')})`}>
            <Path
              d="M56 44 C54 52 56 58 60 62 M66 44 C64 52 66 58 70 62 M76 46 C74 52 76 58 80 61 M86 52 C83 56 84 62 88 64 M46 46 C44 54 46 60 50 64 M38 34 C42 34 46 36 50 38 M40 42 C44 42 48 44 52 46"
              stroke={T.charcoal.face}
              strokeWidth={3.6}
              strokeLinecap="round"
              fill="none"
            />
          </G>
          {[42, 70].map((x) => (
            <Rect key={x} x={x} y={64} width={10} height={28} rx={5} fill={fill('snow')} />
          ))}
          <Path
            d="M43 76 L51 76 M71 76 L79 76"
            stroke={T.charcoal.face}
            strokeWidth={3}
            strokeLinecap="round"
          />
          {[42, 70].map((x) => (
            <Rect key={x} x={x} y={86} width={10} height={6} rx={3} fill={fill('charcoal')} />
          ))}
          <Ellipse
            cx={31}
            cy={11}
            rx={3.6}
            ry={6}
            fill={fill('snow')}
            transform="rotate(-15 31 11)"
          />
          <Ellipse
            cx={31}
            cy={11.5}
            rx={1.6}
            ry={3.4}
            fill={T.charcoal.face}
            transform="rotate(-15 31 11.5)"
          />
          {/* Long pony head, dark nose at the tip. */}
          <Path
            d="M22 14 C32 12 38 20 36 30 C35 38 30 44 22 44 C14 44 10 38 11 32 C12 26 16 16 22 14 Z"
            fill={fill('snow')}
          />
          <Path
            d="M24 18 C28 17 32 19 34 22 M25 23 C29 22 33 24 35 27"
            stroke={T.charcoal.face}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse cx={18} cy={38} rx={8.5} ry={6.5} fill={fill('charcoal')} />
          <Circle cx={15} cy={36} r={1.2} fill={T.grey.light} />
          <Path
            d="M14 41 C17 42.5 20 42.5 22 41"
            stroke={T.grey.light}
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
          />
          <Eye cx={24} cy={27} r={3.2} />
          <Cheek cx={29} cy={33} r={3} />
          <Gloss cx={20} cy={19} rx={5} ry={2.6} />
          <Gloss cx={54} cy={50} rx={7} ry={2.6} />
        </>
      )}
    </WildCanvas>
  );
}

/** Two-humped camel from the side. */
function Camel({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['tan', 'brown']} shadowWidth={36}>
      {(fill) => (
        <>
          <Limb d="M86 56 C90 60 91 66 89 72" color={fill('tan')} width={2.6} />
          <Ellipse cx={89} cy={73} rx={2.4} ry={3.4} fill={T.brown.face} />
          {[52, 78].map((x) => (
            <Rect key={x} x={x} y={62} width={8} height={30} rx={4} fill={flat('tan', 'shade')} />
          ))}
          <Circle cx={56} cy={46} r={11} fill={fill('tan')} />
          <Circle cx={74} cy={46} r={11} fill={fill('tan')} />
          <Ellipse cx={64} cy={60} rx={25} ry={13} fill={fill('tan')} />
          <Limb d="M44 58 C34 60 28 54 26 40" color={fill('tan')} width={12} />
          {[44, 70].map((x) => (
            <Rect key={x} x={x} y={62} width={9} height={30} rx={4.5} fill={fill('tan')} />
          ))}
          <Ellipse cx={48.5} cy={90.5} rx={6} ry={2.5} fill={flat('tan', 'shade')} />
          <Ellipse cx={74.5} cy={90.5} rx={6} ry={2.5} fill={flat('tan', 'shade')} />
          <Ellipse
            cx={30}
            cy={28}
            rx={3}
            ry={4.5}
            fill={fill('tan')}
            transform="rotate(25 30 28)"
          />
          <Path
            d="M22 26 C30 26 34 30 33 36 C32 42 26 44 18 43 C12 42 9 38 10 34 C11 29 16 26 22 26 Z"
            fill={fill('tan')}
          />
          <Path
            d="M50 36 C54 33 60 34 62 37 M68 36 C72 33 78 34 80 37"
            stroke={T.brown.face}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            opacity={0.6}
          />
          <Eye cx={24} cy={32} r={3} />
          <Path
            d="M20.5 29 C22.5 27.5 25.5 27.5 27.5 29"
            stroke={ink}
            strokeWidth={1.3}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M12 33.5 L14 34.5" stroke={ink} strokeWidth={1.4} strokeLinecap="round" />
          <Path
            d="M12 39 C15 40.5 18 40.5 20 39"
            stroke={ink}
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />
          <Cheek cx={27} cy={37.5} r={3} />
          <Gloss cx={52} cy={40} rx={4.5} ry={2.6} />
          <Gloss cx={18} cy={29} rx={4} ry={2.2} />
        </>
      )}
    </WildCanvas>
  );
}

/** Kangaroo standing on its big feet and tail, a joey in the pouch. */
function Kangaroo({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['ginger', 'tan', 'charcoal']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path d="M62 74 C76 80 88 84 96 90 C92 93 78 93 64 88 Z" fill={fill('ginger')} />
          <Ellipse cx={56} cy={88.5} rx={18} ry={4.5} fill={fill('ginger')} />
          <Ellipse
            cx={56}
            cy={56}
            rx={17}
            ry={24}
            fill={fill('ginger')}
            transform="rotate(14 56 56)"
          />
          <Ellipse cx={62} cy={74} rx={14} ry={14} fill={fill('ginger')} />
          {/* Pouch with a joey peeking out. */}
          <Circle cx={47} cy={60} r={6} fill={fill('ginger')} />
          <Ellipse
            cx={45}
            cy={54.5}
            rx={2}
            ry={3.6}
            fill={fill('ginger')}
            transform="rotate(-15 45 54.5)"
          />
          <Circle cx={45.5} cy={60} r={1.6} fill={ink} />
          <Path d="M40 62 C46 70 56 70 60 62 C58 74 44 74 40 62 Z" fill={fill('tan')} />
          <Ellipse
            cx={36}
            cy={56}
            rx={3}
            ry={6}
            fill={flat('ginger', 'shade')}
            transform="rotate(-30 36 56)"
          />
          {/* Head with tall ears. */}
          <Ellipse
            cx={46}
            cy={14}
            rx={4}
            ry={10}
            fill={fill('ginger')}
            transform="rotate(20 46 14)"
          />
          <Ellipse cx={46} cy={14} rx={1.8} ry={6} fill={tongue} transform="rotate(20 46 14)" />
          <Ellipse
            cx={38}
            cy={13}
            rx={4}
            ry={10}
            fill={fill('ginger')}
            transform="rotate(-6 38 13)"
          />
          <Ellipse cx={38} cy={13} rx={1.8} ry={6} fill={tongue} transform="rotate(-6 38 13)" />
          <Path
            d="M40 22 C48 22 52 28 50 35 C48 41 42 43 32 42 C24 41 20 38 21 34 C22 30 28 30 31 27 C33 24 36 22 40 22 Z"
            fill={fill('ginger')}
          />
          <Ellipse cx={24} cy={35} rx={5} ry={4.5} fill={fill('tan')} />
          <Ellipse cx={21.5} cy={33.5} rx={2.4} ry={1.8} fill={fill('charcoal')} />
          <Eye cx={38} cy={30} r={3.2} />
          <Path
            d="M24 39.5 C26 41 29 41 31 39.5"
            stroke={ink}
            strokeWidth={1.4}
            strokeLinecap="round"
            fill="none"
          />
          <Cheek cx={39} cy={36.5} r={3} />
          <Gloss cx={36} cy={26} rx={4} ry={2.2} />
          <Gloss cx={52} cy={42} rx={5} ry={3} />
        </>
      )}
    </WildCanvas>
  );
}

/** Hippo, front view: wide muzzle with big nostrils, tiny ears on top. */
function Hippo({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['hippo', 'hippoMuzzle']} shadowWidth={36}>
      {(fill) => (
        <>
          <Ellipse cx={50} cy={72} rx={32} ry={19} fill={fill('hippo')} />
          {[32, 56].map((x) => (
            <Rect key={x} x={x} y={76} width={12} height={16} rx={6} fill={fill('hippo')} />
          ))}
          <Ellipse cx={38} cy={89.5} rx={5} ry={2.4} fill={flat('hippo', 'light')} />
          <Ellipse cx={62} cy={89.5} rx={5} ry={2.4} fill={flat('hippo', 'light')} />
          <Ellipse
            cx={31}
            cy={19}
            rx={4.5}
            ry={5.5}
            fill={fill('hippo')}
            transform="rotate(-25 31 19)"
          />
          <Ellipse
            cx={69}
            cy={19}
            rx={4.5}
            ry={5.5}
            fill={fill('hippo')}
            transform="rotate(25 69 19)"
          />
          <Ellipse cx={31} cy={19.5} rx={2} ry={3} fill={tongue} transform="rotate(-25 31 19.5)" />
          <Ellipse cx={69} cy={19.5} rx={2} ry={3} fill={tongue} transform="rotate(25 69 19.5)" />
          <Circle cx={40} cy={26} r={7.5} fill={fill('hippo')} />
          <Circle cx={60} cy={26} r={7.5} fill={fill('hippo')} />
          <Ellipse cx={50} cy={36} rx={21} ry={15} fill={fill('hippo')} />
          <Ellipse cx={50} cy={53} rx={27} ry={15} fill={fill('hippoMuzzle')} />
          <Ellipse cx={42} cy={47} rx={2.6} ry={3.6} fill={flat('hippo', 'shade')} />
          <Ellipse cx={58} cy={47} rx={2.6} ry={3.6} fill={flat('hippo', 'shade')} />
          <Path
            d="M36 57 C44 63 56 63 64 57"
            stroke={ink}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Rect x={41} y={58.5} width={4} height={4.5} rx={1.6} fill={T.cream.light} />
          <Rect x={55} y={58.5} width={4} height={4.5} rx={1.6} fill={T.cream.light} />
          <Eye cx={40} cy={26} r={3.4} />
          <Eye cx={60} cy={26} r={3.4} />
          <Cheeks y={54} dx={20} r={3.4} />
          <Gloss cx={38} cy={44} rx={7} ry={3} />
          <Gloss cx={36} cy={20} rx={3} ry={1.8} />
        </>
      )}
    </WildCanvas>
  );
}

/** Crocodile from the side: long and low, bumpy back, a big friendly grin. */
function Crocodile({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['leaf', 'lemon', 'cream']} shadowWidth={42}>
      {(fill) => (
        <>
          {[44, 72].map((x) => (
            <Rect
              key={x}
              x={x}
              y={74}
              width={9}
              height={18}
              rx={4.5}
              fill={flat('leaf', 'shade')}
            />
          ))}
          <Path d="M78 64 C88 64 94 58 98 50 C100 60 94 76 80 80 Z" fill={fill('leaf')} />
          {/* Rounded scutes along the back. */}
          {[46, 54, 62, 70, 78, 86].map((x, i) => (
            <Circle key={x} cx={x} cy={i === 5 ? 60 : 59} r={3.4} fill={flat('leaf', 'shade')} />
          ))}
          <Path
            d="M40 62 C50 58 74 58 84 64 C90 68 88 78 80 80 C68 83 50 83 42 80 C34 76 34 66 40 62 Z"
            fill={fill('leaf')}
          />
          <Path
            d="M42 79 C52 82 70 82 82 79 C72 76 52 76 42 79 Z"
            fill={flat('lemon', 'light')}
            opacity={0.8}
          />
          {[38, 66].map((x) => (
            <Rect key={x} x={x} y={74} width={10} height={18} rx={5} fill={fill('leaf')} />
          ))}
          {/* Head: lower jaw, then the long snout on top. */}
          <Path d="M10 66 C14 72 30 74 44 72 L46 64 L12 63 Z" fill={flat('leaf', 'shade')} />
          <Path
            d="M8 60 C8 54 14 52 22 52 L36 50 C44 48 50 54 50 62 C50 68 44 70 36 68 L16 67 C11 67 8 64 8 60 Z"
            fill={fill('leaf')}
          />
          {/* Eye bumps sit on top of the head. */}
          <Circle cx={34} cy={48} r={7} fill={fill('leaf')} />
          <Circle cx={34} cy={47.5} r={4.6} fill={T.cream.light} />
          <Eye cx={34.5} cy={48} r={3} />
          <Circle cx={11} cy={56} r={1.2} fill={ink} />
          <Circle cx={15} cy={55.5} r={1.2} fill={ink} />
          <Path
            d="M10 63 C18 67 30 67 40 64 C43 63 45 61 46 59"
            stroke={ink}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
          {/* Two round little teeth, not a row of fangs. */}
          <Path
            d="M18 66 L20 69 L22 66 Z M28 66 L30 69 L32 66 Z"
            fill={T.cream.light}
            strokeLinejoin="round"
          />
          <Cheek cx={42} cy={58} r={3.2} />
          <Gloss cx={22} cy={55} rx={6} ry={2} rotate={-8} />
          <Gloss cx={56} cy={66} rx={7} ry={2.4} rotate={-8} />
        </>
      )}
    </WildCanvas>
  );
}

/** Snake coiled up, head raised, smiling. */
function Snake({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['leaf', 'lemon']} shadowWidth={32}>
      {(fill) => (
        <>
          <Limb d="M76 84 C86 86 92 82 92 76 C92 72 88 71 86 74" color={fill('leaf')} width={6} />
          <Ellipse cx={50} cy={81} rx={30} ry={10.5} fill={fill('leaf')} />
          <Ellipse cx={51} cy={69} rx={24} ry={9.5} fill={fill('leaf')} />
          <Ellipse cx={53} cy={58} rx={17} ry={8} fill={fill('leaf')} />
          <Limb d="M60 56 C68 46 62 38 52 38 C42 38 38 34 40 28" color={fill('leaf')} width={11} />
          {[
            [30, 81],
            [46, 85],
            [64, 84],
            [36, 69],
            [56, 72],
            [46, 59],
            [62, 58],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={2.4} fill={fill('lemon')} />
          ))}
          <Ellipse cx={39} cy={25} rx={15} ry={11.5} fill={fill('leaf')} />
          <Path
            d="M27 32 L22 35 M22 35 L19 34 M22 35 L20.5 38"
            stroke={tongue}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Eye cx={34} cy={22} r={3.8} />
          <Eye cx={47} cy={22} r={3.8} />
          <Smile cx={39} cy={29} w={5} />
          <Cheeks cx={40.5} y={28} dx={11} r={3} />
          <Gloss cx={33} cy={16} rx={5} ry={2.6} />
          <Gloss cx={34} cy={76} rx={7} ry={2.4} rotate={-8} />
        </>
      )}
    </WildCanvas>
  );
}

// ---------------------------------------------------------------- forest

/** Bear, sitting like a teddy: round ears on top, light muzzle, paw pads. */
function Bear({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['brown', 'tan', 'charcoal']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path
            d="M50 50 C30 50 22 66 23 79 C24 89 32 92 40 92 L60 92 C68 92 76 89 77 79 C78 66 70 50 50 50 Z"
            fill={fill('brown')}
          />
          <Ellipse cx={50} cy={74} rx={14} ry={13} fill={fill('tan')} />
          <Ellipse
            cx={26}
            cy={66}
            rx={6}
            ry={10}
            fill={fill('brown')}
            transform="rotate(20 26 66)"
          />
          <Ellipse
            cx={74}
            cy={66}
            rx={6}
            ry={10}
            fill={fill('brown')}
            transform="rotate(-20 74 66)"
          />
          <Ellipse cx={34} cy={86} rx={9.5} ry={7} fill={fill('brown')} />
          <Ellipse cx={66} cy={86} rx={9.5} ry={7} fill={fill('brown')} />
          <Ellipse cx={34} cy={87} rx={5} ry={3.6} fill={flat('tan', 'light')} />
          <Ellipse cx={66} cy={87} rx={5} ry={3.6} fill={flat('tan', 'light')} />
          <Circle cx={30} cy={20} r={8.5} fill={fill('brown')} />
          <Circle cx={70} cy={20} r={8.5} fill={fill('brown')} />
          <Circle cx={30} cy={20} r={4.5} fill={fill('tan')} />
          <Circle cx={70} cy={20} r={4.5} fill={fill('tan')} />
          <Ellipse cx={50} cy={37} rx={25} ry={22} fill={fill('brown')} />
          <Ellipse cx={50} cy={47} rx={11.5} ry={8.5} fill={fill('tan')} />
          <Eye cx={40} cy={34} />
          <Eye cx={60} cy={34} />
          <Ellipse cx={50} cy={43.5} rx={4.4} ry={3.2} fill={fill('charcoal')} />
          <Path
            d="M50 46.5 L50 48.5 M50 48.5 C50 51.5 46.5 52.5 45 50.5 M50 48.5 C50 51.5 53.5 52.5 55 50.5"
            stroke={ink}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
          />
          <Cheeks y={45} dx={16} r={3.4} />
          <Gloss cx={37} cy={23} rx={6} ry={3.5} />
        </>
      )}
    </WildCanvas>
  );
}

/** Panda sitting with a bamboo stalk: black ears, eye patches and arms. */
function Panda({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['snow', 'charcoal', 'leaf']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path
            d="M50 50 C30 50 22 66 23 79 C24 89 32 92 40 92 L60 92 C68 92 76 89 77 79 C78 66 70 50 50 50 Z"
            fill={fill('snow')}
          />
          <Ellipse cx={34} cy={85} rx={10} ry={7.5} fill={fill('charcoal')} />
          <Ellipse cx={66} cy={85} rx={10} ry={7.5} fill={fill('charcoal')} />
          <Ellipse cx={34} cy={86} rx={5} ry={3.6} fill={T.charcoal.light} />
          <Ellipse cx={66} cy={86} rx={5} ry={3.6} fill={T.charcoal.light} />
          {/* Bamboo held in front, leaves sticking out at the top. */}
          <Path d="M74 22 C80 16 88 16 92 18 C88 22 80 24 74 22 Z" fill={fill('leaf')} />
          <Path d="M76 30 C80 34 86 36 92 34 C88 30 82 28 76 30 Z" fill={fill('leaf')} />
          <Limb d="M64 84 L76 22" color={fill('leaf')} width={6} />
          <Path
            d="M69 58 L74 59 M72.5 40 L77.5 41"
            stroke={flat('leaf', 'shade')}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Ellipse
            cx={30}
            cy={64}
            rx={7}
            ry={11}
            fill={fill('charcoal')}
            transform="rotate(30 30 64)"
          />
          <Ellipse
            cx={68}
            cy={62}
            rx={7}
            ry={11}
            fill={fill('charcoal')}
            transform="rotate(-40 68 62)"
          />
          <Circle cx={31} cy={20} r={8} fill={fill('charcoal')} />
          <Circle cx={69} cy={20} r={8} fill={fill('charcoal')} />
          <Ellipse cx={50} cy={37} rx={25} ry={21} fill={fill('snow')} />
          <Ellipse
            cx={40}
            cy={37}
            rx={6}
            ry={8}
            fill={fill('charcoal')}
            transform="rotate(35 40 37)"
          />
          <Ellipse
            cx={60}
            cy={37}
            rx={6}
            ry={8}
            fill={fill('charcoal')}
            transform="rotate(-35 60 37)"
          />
          <Circle cx={41} cy={36} r={3.6} fill={T.cream.light} />
          <Circle cx={59} cy={36} r={3.6} fill={T.cream.light} />
          <Eye cx={41.3} cy={36.3} r={2.6} />
          <Eye cx={58.7} cy={36.3} r={2.6} />
          <Ellipse cx={50} cy={44.5} rx={3.6} ry={2.6} fill={fill('charcoal')} />
          <Smile cx={50} cy={48} w={3.6} width={1.5} />
          <Cheeks y={46} dx={15} r={3.2} />
          <Gloss cx={37} cy={23} rx={6} ry={3.5} />
        </>
      )}
    </WildCanvas>
  );
}

/** Wolf sitting side-on, howling at a small moon. */
function Wolf({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['grey', 'snow', 'lemon', 'charcoal']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path
            d="M84 18 C78 18 74 23 74 28 C74 34 79 38 85 38 C81 35 79 32 79 28 C79 23 81 20 84 18 Z"
            fill={fill('lemon')}
          />
          {/* Bushy tail along the ground. */}
          <Path
            d="M68 86 C80 90 92 86 94 74 C95 68 90 66 88 70 C86 78 78 80 68 78 Z"
            fill={fill('grey')}
          />
          <Path
            d="M94 74 C95 68 90 66 88 70 C88 73 89 75 91 76 C93 76 94 75 94 74 Z"
            fill={fill('snow')}
          />
          <Ellipse cx={62} cy={74} rx={20} ry={18} fill={fill('grey')} />
          <Ellipse cx={66} cy={89} rx={12} ry={3.6} fill={flat('grey', 'shade')} />
          <Path d="M34 46 C26 58 28 78 33 92 L57 92 C61 76 60 54 54 42 Z" fill={fill('grey')} />
          <Path d="M36 50 C31 60 32 72 37 80 C45 76 50 64 47 50 Z" fill={fill('snow')} />
          <Rect x={34} y={74} width={10} height={18} rx={5} fill={fill('grey')} />
          <Rect x={46} y={74} width={10} height={18} rx={5} fill={fill('grey')} />
          {/* Pointed ear laid back while it howls. */}
          <Path d="M46 26 L60 12 C62 10 65 12 64 15 L58 34 Z" fill={fill('grey')} />
          <Path d="M51 25 L60 16 L57 29 Z" fill={tongue} />
          {/* Round head, chunky snout pointing up to the moon. */}
          <Path
            d="M46 26 C38 20 28 12 22 10 C17 9 14 13 16 17 C20 25 26 35 32 42 Z"
            fill={fill('grey')}
          />
          <Circle cx={44} cy={36} r={14} fill={fill('grey')} />
          <Path d="M30 30 C34 40 42 48 52 48 C44 52 34 48 30 40 Z" fill={fill('snow')} />
          <Ellipse
            cx={18.5}
            cy={12.5}
            rx={3.8}
            ry={3.2}
            fill={fill('charcoal')}
            transform="rotate(30 18.5 12.5)"
          />
          <Ellipse cx={23} cy={27} rx={2} ry={2.8} fill={ink} transform="rotate(-35 23 27)" />
          <Path
            d="M39 31 C40.5 33.5 44 33.5 46 31"
            stroke={ink}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Cheek cx={46} cy={39} r={3} />
          <Gloss cx={42} cy={27} rx={5} ry={2.4} rotate={-35} />
          <Gloss cx={58} cy={62} rx={6} ry={3} />
        </>
      )}
    </WildCanvas>
  );
}

/** Fox sitting, front view: pointed face with white cheeks, huge white-tipped tail. */
function Fox({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['orange', 'snow', 'charcoal']}>
      {(fill) => (
        <>
          <Path
            d="M64 90 C84 94 98 78 92 58 C89 48 80 46 76 54 C72 64 80 76 64 80 Z"
            fill={fill('orange')}
          />
          <Path
            d="M92 58 C89 48 80 46 76 54 C78 58 82 60 86 60 C89 60 91 59 92 58 Z"
            fill={fill('snow')}
          />
          <Path d={SIT_BODY} fill={fill('orange')} />
          <Ellipse cx={50} cy={70} rx={11} ry={15} fill={fill('snow')} />
          <Ellipse cx={42} cy={89} rx={6.5} ry={4} fill={fill('charcoal')} />
          <Ellipse cx={58} cy={89} rx={6.5} ry={4} fill={fill('charcoal')} />
          {/* Tall pointed ears with dark tips. */}
          <Path d="M26 38 L22 10 C22 6 26 5 29 8 L46 26 Z" fill={fill('orange')} />
          <Path d="M74 38 L78 10 C78 6 74 5 71 8 L54 26 Z" fill={fill('orange')} />
          <Path d="M22.6 14 L22 10 C22 6 26 5 29 8 L31.5 10.5 Z" fill={T.charcoal.face} />
          <Path d="M77.4 14 L78 10 C78 6 74 5 71 8 L68.5 10.5 Z" fill={T.charcoal.face} />
          <Path d="M28 32 L26 16 L38 27 Z" fill={tongue} />
          <Path d="M72 32 L74 16 L62 27 Z" fill={tongue} />
          <Path
            d="M50 22 C64 22 76 30 79 42 C72 52 60 58 50 60 C40 58 28 52 21 42 C24 30 36 22 50 22 Z"
            fill={fill('orange')}
          />
          <Path
            d="M21 42 C30 43 42 46 50 50 C58 46 70 43 79 42 C72 52 60 58 50 60 C40 58 28 52 21 42 Z"
            fill={fill('snow')}
          />
          <Eye cx={40} cy={39} />
          <Eye cx={60} cy={39} />
          <Ellipse cx={50} cy={53} rx={3.6} ry={2.8} fill={fill('charcoal')} />
          <Smile cx={50} cy={56.5} w={3} width={1.4} />
          <Cheeks y={47} dx={15} r={3.2} />
          <Gloss cx={38} cy={28} rx={6} ry={3} />
        </>
      )}
    </WildCanvas>
  );
}

/** Eagle, front view, wings spread: white head, yellow hooked beak. */
function Eagle({ size }: WordArtProps) {
  // Rotation of each flight feather around the shoulder; drawn lowest first.
  const wingFeathers = [-26, -9, 8, 25];
  return (
    <WildCanvas size={size} tones={['brown', 'snow', 'lemon']} shadowWidth={26}>
      {(fill) => (
        <>
          <Path
            d="M42 76 L36 90 C44 93 56 93 64 90 L58 76 Z"
            fill={fill('snow')}
            strokeLinejoin="round"
          />
          {/* Wings: round-tipped flight feathers fanned out, a covert on top. */}
          {['', 'translate(100 0) scale(-1 1)'].map((mirror) => (
            <G key={mirror || 'left'} transform={mirror || undefined}>
              {wingFeathers.map((angle) => (
                <Ellipse
                  key={angle}
                  cx={21}
                  cy={52}
                  rx={19}
                  ry={7}
                  fill={fill('brown')}
                  transform={`rotate(${angle} 40 52)`}
                />
              ))}
              <Ellipse
                cx={31}
                cy={46}
                rx={16}
                ry={11}
                fill={fill('brown')}
                transform="rotate(20 31 46)"
              />
            </G>
          ))}
          <Ellipse cx={50} cy={60} rx={16} ry={21} fill={fill('brown')} />
          <Path
            d="M43 80 L41 88 M46 80 L46 88 M54 80 L54 88 M57 80 L59 88"
            stroke={T.lemon.shade}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <Ellipse cx={44} cy={80} rx={4.5} ry={3} fill={fill('lemon')} />
          <Ellipse cx={56} cy={80} rx={4.5} ry={3} fill={fill('lemon')} />
          <Circle cx={50} cy={30} r={16} fill={fill('snow')} />
          <Path d="M34 36 C38 46 62 46 66 36 C62 44 38 44 34 36 Z" fill={fill('snow')} />
          <Path
            d="M44 35 C44 31 56 31 56 35 C56 40 53 44 50 46 C48.5 44 47 42 47 40 C45 39 44 37 44 35 Z"
            fill={fill('lemon')}
          />
          <Eye cx={43} cy={28} />
          <Eye cx={57} cy={28} />
          <Cheeks y={36} dx={11} r={2.8} />
          <Gloss cx={43} cy={20} rx={5} ry={2.8} />
          <Gloss cx={16} cy={38} rx={6} ry={2.4} rotate={10} />
        </>
      )}
    </WildCanvas>
  );
}

// ---------------------------------------------------------------- cold & sea

/** Penguin standing, front view: black egg with a white face and belly. */
function Penguin({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['charcoal', 'snow', 'orange']} shadowWidth={26}>
      {(fill) => (
        <>
          <Ellipse cx={40} cy={89} rx={8} ry={4} fill={fill('orange')} />
          <Ellipse cx={60} cy={89} rx={8} ry={4} fill={fill('orange')} />
          <Ellipse
            cx={24}
            cy={58}
            rx={6}
            ry={15}
            fill={fill('charcoal')}
            transform="rotate(25 24 58)"
          />
          <Ellipse
            cx={76}
            cy={58}
            rx={6}
            ry={15}
            fill={fill('charcoal')}
            transform="rotate(-25 76 58)"
          />
          <Path
            d="M50 10 C32 10 25 32 25 56 C25 76 35 88 50 88 C65 88 75 76 75 56 C75 32 68 10 50 10 Z"
            fill={fill('charcoal')}
          />
          <Path
            d="M50 40 C40 40 33 52 33 64 C33 76 40 84 50 84 C60 84 67 76 67 64 C67 52 60 40 50 40 Z"
            fill={fill('snow')}
          />
          <Circle cx={42} cy={33} r={10} fill={fill('snow')} />
          <Circle cx={58} cy={33} r={10} fill={fill('snow')} />
          <Ellipse cx={50} cy={44} rx={12} ry={8} fill={fill('snow')} />
          <Eye cx={43} cy={32} />
          <Eye cx={57} cy={32} />
          <Path
            d="M45 38.5 C45 36.5 55 36.5 55 38.5 C55 41 52 43.5 50 43.5 C48 43.5 45 41 45 38.5 Z"
            fill={fill('orange')}
          />
          <Cheeks y={41} dx={11} r={3} />
          <Gloss cx={38} cy={18} rx={6} ry={3.2} />
        </>
      )}
    </WildCanvas>
  );
}

/** Dolphin leaping in an arch: beak, curved fin, tail flukes. */
function Dolphin({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['sky', 'snow', 'glass']} shadowWidth={26}>
      {(fill) => (
        <>
          <G transform="rotate(-12 50 50)">
            <Path d="M50 32 C52 22 58 16 66 15 C63 21 62 28 64 35 Z" fill={fill('sky')} />
            <Path
              d="M82 52 C86 44 92 38 98 38 C97 44 94 50 88 54 C94 56 98 62 97 68 C91 66 86 62 82 56 Z"
              fill={fill('sky')}
            />
            <Path
              d="M8 54 C8 50 14 48 21 47 C25 37 36 30 50 31 C66 32 78 40 86 50 C88 53 86 56 83 56 C73 58 63 68 48 68 C34 68 24 62 18 58 C13 58 8 58 8 54 Z"
              fill={fill('sky')}
            />
            <Path
              d="M10 56 C16 58 22 58 26 58 C34 64 44 66 54 64 C62 62 70 58 78 56 C68 62 58 68 46 68 C34 68 24 62 18 58 C13 58 10 58 10 56 Z"
              fill={fill('snow')}
            />
            <Path d="M42 62 C38 70 42 76 48 78 C50 72 49 66 47 62 Z" fill={flat('sky', 'shade')} />
            <Eye cx={30} cy={46} r={3.4} />
            <Path
              d="M10 53.5 C16 56 23 55.5 28 52"
              stroke={ink}
              strokeWidth={1.5}
              strokeLinecap="round"
              fill="none"
            />
            <Cheek cx={33} cy={53} r={3} />
            <Gloss cx={44} cy={36} rx={9} ry={3} rotate={-10} />
          </G>
          <Circle cx={18} cy={78} r={3.4} fill={fill('glass')} />
          <Circle cx={26} cy={84} r={2.4} fill={fill('glass')} />
          <Circle cx={80} cy={80} r={2.8} fill={fill('glass')} />
        </>
      )}
    </WildCanvas>
  );
}

/** Whale: a big round body, tail up, a fountain on top. */
function Whale({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['ocean', 'snow', 'glass', 'sky']} shadowWidth={34}>
      {(fill) => (
        <>
          {/* Water fountain. */}
          <Path d="M36 30 L36 20" stroke={flat('sky')} strokeWidth={4} strokeLinecap="round" />
          <Path
            d="M36 20 C32 12 24 12 22 18 M36 20 C40 12 48 12 50 18"
            stroke={fill('sky')}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={22} cy={22} r={2.6} fill={fill('glass')} />
          <Circle cx={50} cy={22} r={2.6} fill={fill('glass')} />
          <Path
            d="M70 62 C78 56 82 48 84 40 C78 36 76 28 80 24 C84 28 88 30 92 30 C96 26 98 28 98 32 C96 38 92 40 88 42 C86 54 82 66 74 72 Z"
            fill={fill('ocean')}
          />
          <Path
            d="M10 60 C8 42 22 30 42 30 C60 30 74 42 78 56 C80 64 78 72 70 78 C60 84 40 86 26 82 C16 78 11 70 10 60 Z"
            fill={fill('ocean')}
          />
          <Path
            d="M12 66 C18 76 30 82 44 82 C56 82 66 78 72 74 C62 76 46 78 34 76 C24 74 16 70 12 66 Z"
            fill={fill('snow')}
          />
          <Path
            d="M24 72 L22 76 M32 75 L31 79 M40 76 L40 80 M48 76 L49 80"
            stroke={flat('snow', 'shade')}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
          <Ellipse
            cx={46}
            cy={70}
            rx={8}
            ry={4}
            fill={flat('ocean', 'shade')}
            transform="rotate(20 46 70)"
          />
          <Circle cx={26} cy={52} r={4.6} fill={T.cream.light} />
          <Eye cx={26.4} cy={52.4} r={3.2} />
          <Path
            d="M12 62 C18 66 26 66 32 62"
            stroke={ink}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
          <Cheek cx={34} cy={60} r={3.2} />
          <Gloss cx={30} cy={38} rx={10} ry={4} />
        </>
      )}
    </WildCanvas>
  );
}

/** Shark side-on: tall triangle fin, crescent tail, a closed friendly smile. */
function Shark({ size }: WordArtProps) {
  return (
    <WildCanvas size={size} tones={['grey', 'snow']} shadowWidth={30}>
      {(fill) => (
        <>
          <Path d="M42 40 C46 28 52 18 62 12 C62 22 62 32 66 40 Z" fill={fill('grey')} />
          <Path
            d="M80 52 L90 30 C92 26 97 27 96 32 L92 52 L96 72 C97 77 92 78 90 74 Z"
            fill={fill('grey')}
            strokeLinejoin="round"
          />
          <Path
            d="M6 54 C12 42 28 36 48 36 C64 36 78 42 86 52 C78 60 66 68 48 68 C28 68 12 64 6 54 Z"
            fill={fill('grey')}
          />
          <Path
            d="M7 56 C18 62 32 64 48 64 C62 64 74 60 84 54 C78 60 66 68 48 68 C28 68 12 64 7 56 Z"
            fill={fill('snow')}
          />
          <Path d="M40 62 C36 72 38 80 44 82 C48 74 48 68 47 62 Z" fill={flat('grey', 'shade')} />
          <Path
            d="M34 46 C32 50 32 54 34 57 M39 46 C37 50 37 54 39 57"
            stroke={flat('grey', 'shade')}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Eye cx={20} cy={48} r={3.6} />
          <Path
            d="M9 56 C14 60 21 60 26 56"
            stroke={ink}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
          <Cheek cx={26} cy={53} r={3.2} />
          <Gloss cx={34} cy={41} rx={10} ry={3} rotate={-8} />
        </>
      )}
    </WildCanvas>
  );
}

/** Crab, front view: wide red shell, eyes on stalks, claws up. */
function Crab({ size }: WordArtProps) {
  // A round claw with an open notch (like a pac-man) facing up and outwards.
  const claw = (cx: number, cy: number, open: number) => {
    const r = 10;
    const a1 = ((open - 34) * Math.PI) / 180;
    const a2 = ((open + 34) * Math.PI) / 180;
    return `M${cx} ${cy} L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} A${r} ${r} 0 1 0 ${cx + r * Math.cos(a2)} ${cy + r * Math.sin(a2)} Z`;
  };
  return (
    <WildCanvas size={size} tones={['red', 'cream']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path
            d="M26 66 L13 76 M28 72 L17 86 M33 76 L27 91 M74 66 L87 76 M72 72 L83 86 M67 76 L73 91"
            stroke={flat('red', 'shade')}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
          <Limb d="M28 58 C20 54 18 48 18 42" color={fill('red')} width={6} />
          <Limb d="M72 58 C80 54 82 48 82 42" color={fill('red')} width={6} />
          <Path
            d={claw(18, 34, -125)}
            fill={fill('red')}
            stroke={fill('red')}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path
            d={claw(82, 34, -55)}
            fill={fill('red')}
            stroke={fill('red')}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path
            d="M42 52 L41 38 M58 52 L59 38"
            stroke={fill('red')}
            strokeWidth={3.4}
            strokeLinecap="round"
          />
          <Ellipse cx={50} cy={66} rx={29} ry={19} fill={fill('red')} />
          <Circle cx={41} cy={36} r={6} fill={fill('cream')} />
          <Circle cx={59} cy={36} r={6} fill={fill('cream')} />
          <Eye cx={41.5} cy={36.5} r={3.4} />
          <Eye cx={59.5} cy={36.5} r={3.4} />
          <Smile cx={50} cy={66} w={6} width={1.8} />
          <Cheeks y={64} dx={15} r={3.6} />
          <Gloss cx={37} cy={55} rx={8} ry={3.6} />
          <Gloss cx={14} cy={29} rx={3} ry={2} />
        </>
      )}
    </WildCanvas>
  );
}

/** Octopus: a round head and curly arms. */
function Octopus({ size }: WordArtProps) {
  const arms = [
    'M30 56 C22 64 14 70 12 78 C11 84 17 86 19 82',
    'M38 62 C34 72 28 80 30 87 C31 91 36 90 35 86',
    'M46 64 C45 74 44 82 47 88 C49 91 53 89 51 86',
    'M54 64 C55 74 56 82 53 88 C51 91 47 89 49 86',
    'M62 62 C66 72 72 80 70 87 C69 91 64 90 65 86',
    'M70 56 C78 64 86 70 88 78 C89 84 83 86 81 82',
  ];
  return (
    <WildCanvas size={size} tones={['lilac', 'pink']} shadowWidth={34}>
      {(fill) => (
        <>
          {arms.map((d) => (
            <Limb key={d} d={d} color={fill('lilac')} width={8} />
          ))}
          <Path
            d="M50 10 C70 10 80 26 78 44 C77 56 66 64 50 64 C34 64 23 56 22 44 C20 26 30 10 50 10 Z"
            fill={fill('lilac')}
          />
          <Circle cx={63} cy={22} r={3.4} fill={flat('lilac', 'light')} opacity={0.8} />
          <Circle cx={69} cy={30} r={2.2} fill={flat('lilac', 'light')} opacity={0.8} />
          <Eye cx={41} cy={42} r={4} />
          <Eye cx={59} cy={42} r={4} />
          <Smile cx={50} cy={50} w={5} />
          <Cheeks y={49} dx={16} r={3.6} />
          <Gloss cx={37} cy={22} rx={8} ry={4.5} />
        </>
      )}
    </WildCanvas>
  );
}

export const animalWildArt = {
  'animal.lion': Lion,
  'animal.tiger': Tiger,
  'animal.monkey': Monkey,
  'animal.giraffe': Giraffe,
  'animal.zebra': Zebra,
  'animal.bear': Bear,
  'animal.wolf': Wolf,
  'animal.fox': Fox,
  'animal.snake': Snake,
  'animal.penguin': Penguin,
  'animal.dolphin': Dolphin,
  'animal.whale': Whale,
  'animal.shark': Shark,
  'animal.crab': Crab,
  'animal.octopus': Octopus,
  'animal.camel': Camel,
  'animal.kangaroo': Kangaroo,
  'animal.panda': Panda,
  'animal.eagle': Eagle,
  'animal.crocodile': Crocodile,
  'animal.hippo': Hippo,
} satisfies WordArtMap;
