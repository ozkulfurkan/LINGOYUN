import { useId, type ReactNode } from 'react';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Things in the house of the 2–7 mode: furniture, bathroom, kitchen, tableware,
// school things. Same clay rules as the pilot (home.tsx): light from the top
// left, gloss there, one shared ground shadow, no outlines.
//
// Look-alike pairs are kept apart by shape, not only colour:
// cup (opaque mug with a handle) ↔ glass (empty, see-through, ribbed, no
// handle; the water/milk tumblers are tapered and full) · plate (flat, seen
// from above) ↔ bowl (deep, from the side) · spoon (oval bowl) ↔ fork (tines)
// · pillow (one puffy pinched square) ↔ blanket (folded plaid stack) ↔ towel
// (hangs on a rail) · sink (on a pedestal, tall) ↔ bathtub (long, low, foam)
// · mirror (oval, on a stand) ↔ window (square, four panes, curtains) · phone
// (tall, narrow, app tiles) ↔ television (wide, antennas, legs) · pencil
// (one thin yellow with an eraser) ↔ crayons (three thick, wrapped).

const { ink, gloss } = artPalette;
const T = artPalette.tones;

const mixHex = (a: string, b: string, t: number) => {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
};

const mixTone = (a: ClayTone, b: ClayTone, t: number): ClayTone => ({
  light: mixHex(a.light, b.light, t),
  face: mixHex(a.face, b.face, t),
  shade: mixHex(a.shade, b.shade, t),
});

/**
 * Colours the shared palette does not have, mixed from it. White things
 * (porcelain, pillow) use `snow`: the `cream` tone is the card colour itself,
 * so a white object would vanish on its card.
 */
const LOCAL_TONES = {
  /** Porcelain, enamel, pillow: cool white whose edges turn grey. */
  snow: { light: T.cream.light, face: T.glass.light, shade: T.grey.face },
  /** Book pages: warm off-white paper. */
  paper: { light: T.cream.light, face: T.tan.light, shade: T.tan.face },
  /** Furniture wood: between ginger and brown. */
  wood: mixTone(T.ginger, T.brown, 0.35),
  /** Retro fridge: pale ice blue. */
  frost: mixTone(T.glass, T.sky, 0.45),
  /** Cardboard. */
  card: mixTone(T.tan, T.ginger, 0.45),
} satisfies Record<string, ClayTone>;

type LocalTone = keyof typeof LOCAL_TONES;
type Tone = ArtToneName | LocalTone;
type Fill = (tone: Tone) => string;

const isLocal = (tone: Tone): tone is LocalTone => Object.hasOwn(LOCAL_TONES, tone);

/** WordCanvas plus the local tones and a per-instance id prefix (for clip paths). */
function Canvas({
  size,
  tones,
  shadowWidth,
  children,
}: {
  size?: number;
  tones: readonly Tone[];
  shadowWidth?: number;
  children: (fill: Fill, id: string) => ReactNode;
}) {
  const id = `h${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const shared = tones.filter((tone): tone is ArtToneName => !isLocal(tone));
  const own = tones.filter(isLocal);
  return (
    <WordCanvas size={size} tones={shared} shadowWidth={shadowWidth}>
      {(base) => (
        <>
          {own.length > 0 ? (
            <Defs>
              {own.map((tone) => (
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

/** Thin line in a darker stop (seams, creases, grooves). */
function Line({
  d,
  color,
  width = 2,
  opacity = 0.5,
}: {
  d: string;
  color: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <Path
      d={d}
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

const W = LOCAL_TONES.wood;
const S = LOCAL_TONES.snow;

// ---------------------------------------------------------------- rooms

function Door({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['tan', 'wood', 'glass', 'lemon', 'berry']} shadowWidth={34}>
      {(fill) => (
        <>
          <Rect x={20} y={6} width={60} height={86} rx={7} fill={fill('tan')} />
          <Path
            d="M27 92 L27 20 C27 15 30 12 35 12 L65 12 C70 12 73 15 73 20 L73 92 Z"
            fill={fill('wood')}
          />
          {/* Small arched window on top, a panel below. */}
          <Path d="M36 42 L36 28 C36 18 64 18 64 28 L64 42 Z" fill={fill('glass')} />
          <Rect
            x={35}
            y={52}
            width={30}
            height={32}
            rx={4}
            fill="none"
            stroke={W.shade}
            strokeOpacity={0.55}
            strokeWidth={2}
          />
          <Circle cx={66} cy={56} r={3.6} fill={fill('lemon')} />
          <Rect x={14} y={88} width={72} height={5} rx={2.5} fill={fill('berry')} />
          <Gloss cx={34} cy={30} rx={2.5} ry={9} rotate={10} />
          <Gloss cx={43} cy={28} rx={2} ry={5} rotate={20} opacity={0.8} />
        </>
      )}
    </Canvas>
  );
}

function Window({ size }: WordArtProps) {
  const panes = [
    [24, 22],
    [52, 22],
    [24, 51],
    [52, 51],
  ];
  return (
    <Canvas size={size} tones={['tan', 'sky', 'berry', 'brown', 'lemon', 'wood']} shadowWidth={30}>
      {(fill) => (
        <>
          <Rect x={18} y={16} width={64} height={66} rx={6} fill={fill('tan')} />
          {panes.map(([x, y]) => (
            <Rect key={`${x}-${y}`} x={x} y={y} width={24} height={25} rx={3} fill={fill('sky')} />
          ))}
          {/* Outside: sun and a cloud. */}
          <Circle cx={66} cy={33} r={6} fill={fill('lemon')} />
          <Ellipse cx={34} cy={36} rx={7} ry={4} fill={T.cream.light} />
          <Circle cx={36} cy={32} r={4.5} fill={T.cream.light} />
          <Gloss cx={30} cy={56} rx={1.8} ry={6} rotate={30} opacity={0.7} />
          <Gloss cx={58} cy={56} rx={1.8} ry={6} rotate={30} opacity={0.7} />
          {/* Curtains tied back on both sides. */}
          <Path
            d="M11 10 L31 10 C29 30 22 40 25 54 C20 62 15 70 14 82 L11 82 Z"
            fill={fill('berry')}
          />
          <Path
            d="M89 10 L69 10 C71 30 78 40 75 54 C80 62 85 70 86 82 L89 82 Z"
            fill={fill('berry')}
          />
          <Rect x={7} y={6} width={86} height={5} rx={2.5} fill={fill('brown')} />
          <Rect x={10} y={80} width={80} height={9} rx={4.5} fill={fill('wood')} />
          <Gloss cx={17} cy={24} rx={2} ry={8} rotate={5} />
        </>
      )}
    </Canvas>
  );
}

function Table({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['wood', 'brown']} shadowWidth={42}>
      {(fill) => (
        <>
          <Rect x={23} y={46} width={6} height={36} rx={3} fill={fill('brown')} />
          <Rect x={71} y={46} width={6} height={36} rx={3} fill={fill('brown')} />
          <Path
            d="M20 32 L80 32 C84 32 86 34 88 37 L94 46 L6 46 L12 37 C14 34 16 32 20 32 Z"
            fill={fill('wood')}
          />
          <Rect x={5} y={44} width={90} height={9} rx={4} fill={fill('wood')} />
          <Rect x={11} y={50} width={9} height={42} rx={4} fill={fill('wood')} />
          <Rect x={80} y={50} width={9} height={42} rx={4} fill={fill('wood')} />
          <Line d="M10 48 L90 48" color={W.light} width={1.4} opacity={0.6} />
          <Gloss cx={30} cy={37} rx={10} ry={2} rotate={-4} />
        </>
      )}
    </Canvas>
  );
}

function Chair({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['wood', 'brown', 'berry']} shadowWidth={30}>
      {(fill) => (
        <>
          <Rect x={27} y={8} width={8} height={78} rx={4} fill={fill('brown')} />
          <Rect x={65} y={8} width={8} height={78} rx={4} fill={fill('brown')} />
          <Rect x={25} y={9} width={50} height={13} rx={6.5} fill={fill('wood')} />
          <Rect x={31} y={27} width={38} height={7} rx={3.5} fill={fill('wood')} />
          <Path d="M28 50 L72 50 L82 60 L18 60 Z" fill={fill('wood')} />
          <Ellipse cx={50} cy={54} rx={25} ry={5.5} fill={fill('berry')} />
          <Rect x={17} y={58} width={66} height={8} rx={4} fill={fill('wood')} />
          <Rect x={19} y={64} width={8} height={28} rx={4} fill={fill('wood')} />
          <Rect x={73} y={64} width={8} height={28} rx={4} fill={fill('wood')} />
          <Gloss cx={36} cy={14} rx={6} ry={2} rotate={-4} />
          <Gloss cx={40} cy={52} rx={6} ry={1.6} rotate={-4} />
        </>
      )}
    </Canvas>
  );
}

function Bed({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['wood', 'brown', 'snow', 'sky', 'cream']} shadowWidth={44}>
      {(fill) => (
        <>
          <Rect x={7} y={22} width={16} height={70} rx={8} fill={fill('wood')} />
          <Rect x={80} y={44} width={13} height={48} rx={6.5} fill={fill('wood')} />
          <Rect x={14} y={66} width={74} height={12} rx={5} fill={fill('brown')} />
          <Rect x={20} y={54} width={64} height={15} rx={6} fill={fill('snow')} />
          <Path
            d="M23 46 C28 43 40 43 45 46 C47 50 47 56 45 60 C40 62 28 62 23 60 C21 56 21 50 23 46 Z"
            fill={fill('snow')}
          />
          <Path
            d="M44 54 C46 49 52 47 58 47 L80 47 C84 47 86 49 86 53 L86 74 C86 77 84 79 81 79 L47 79 C44 79 43 77 43 74 Z"
            fill={fill('sky')}
          />
          {/* Turned-down edge of the blanket. */}
          <Path
            d="M43 54 C45 49 49 47 54 47 L54 79 L47 79 C44 79 43 77 43 74 Z"
            fill={fill('cream')}
          />
          <Circle cx={66} cy={58} r={1.8} fill={T.cream.light} />
          <Circle cx={75} cy={66} r={1.8} fill={T.cream.light} />
          <Circle cx={63} cy={71} r={1.8} fill={T.cream.light} />
          <Gloss cx={13} cy={32} rx={2} ry={7} rotate={5} />
          <Gloss cx={64} cy={51} rx={8} ry={1.8} rotate={-3} />
        </>
      )}
    </Canvas>
  );
}

function Sofa({ size }: WordArtProps) {
  const M = T.mint;
  return (
    <Canvas size={size} tones={['mint', 'brown']} shadowWidth={44}>
      {(fill) => (
        <>
          <Rect x={13} y={82} width={7} height={10} rx={3} fill={fill('brown')} />
          <Rect x={80} y={82} width={7} height={10} rx={3} fill={fill('brown')} />
          <Rect x={14} y={26} width={72} height={40} rx={13} fill={fill('mint')} />
          <Rect x={21} y={31} width={28} height={30} rx={9} fill={fill('mint')} />
          <Rect x={51} y={31} width={28} height={30} rx={9} fill={fill('mint')} />
          <Rect x={10} y={66} width={80} height={18} rx={7} fill={fill('mint')} />
          <Rect x={20} y={58} width={30} height={13} rx={6} fill={fill('mint')} />
          <Rect x={50} y={58} width={30} height={13} rx={6} fill={fill('mint')} />
          <Rect x={4} y={46} width={18} height={38} rx={9} fill={fill('mint')} />
          <Rect x={78} y={46} width={18} height={38} rx={9} fill={fill('mint')} />
          <Line d="M50 60 L50 70" color={M.shade} opacity={0.5} />
          <Gloss cx={24} cy={33} rx={6} ry={2} rotate={-10} />
          <Gloss cx={9} cy={52} rx={1.8} ry={5} rotate={0} />
        </>
      )}
    </Canvas>
  );
}

function Lamp({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['lemon', 'ginger', 'terracotta', 'grey']} shadowWidth={26}>
      {(fill) => (
        <>
          <Ellipse cx={50} cy={58} rx={26} ry={8} fill={T.lemon.light} opacity={0.75} />
          <Rect x={47} y={48} width={6} height={32} rx={3} fill={fill('ginger')} />
          <Path d="M30 92 C30 81 40 77 50 77 C60 77 70 81 70 92 Z" fill={fill('terracotta')} />
          <Path
            d="M37 13 C37 11 39 10 41 10 L59 10 C61 10 63 11 63 13 L80 47 C81 50 79 52 76 52 L24 52 C21 52 19 50 20 47 Z"
            fill={fill('lemon')}
          />
          <Line d="M22 46 L78 46" color={T.lemon.shade} width={1.6} opacity={0.5} />
          <Line d="M67 52 L67 62" color={T.grey.shade} width={1.4} opacity={0.9} />
          <Circle cx={67} cy={63.5} r={2} fill={fill('grey')} />
          <Gloss cx={36} cy={26} rx={3} ry={10} rotate={24} />
          <Gloss cx={39} cy={82} rx={4} ry={1.6} rotate={-15} />
        </>
      )}
    </Canvas>
  );
}

function Clock({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['red', 'lemon', 'snow']} shadowWidth={28}>
      {(fill) => (
        <>
          <Line d="M36 78 L29 90" color={T.red.shade} width={6} opacity={1} />
          <Line d="M64 78 L71 90" color={T.red.shade} width={6} opacity={1} />
          <Line d="M38 18 C44 10 56 10 62 18" color={T.red.shade} width={3.5} opacity={1} />
          <Ellipse
            cx={29}
            cy={22}
            rx={13}
            ry={9}
            fill={fill('lemon')}
            transform="rotate(-38 29 22)"
          />
          <Ellipse
            cx={71}
            cy={22}
            rx={13}
            ry={9}
            fill={fill('lemon')}
            transform="rotate(38 71 22)"
          />
          <Circle cx={50} cy={53} r={32} fill={fill('red')} />
          <Circle cx={50} cy={53} r={24.5} fill={fill('snow')} />
          {[
            [50, 33],
            [70, 53],
            [50, 73],
            [30, 53],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={2} fill={ink} />
          ))}
          <Line d="M50 53 L50 38" color={ink} width={3.4} opacity={1} />
          <Line d="M50 53 L62 59" color={ink} width={3.4} opacity={1} />
          <Circle cx={50} cy={53} r={3} fill={T.red.face} />
          <Gloss cx={31} cy={36} rx={7} ry={3} rotate={-45} />
          <Gloss cx={24} cy={17} rx={4} ry={1.8} rotate={-38} />
        </>
      )}
    </Canvas>
  );
}

function Mirror({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['lemon', 'glass', 'ginger']} shadowWidth={26}>
      {(fill, id) => (
        <>
          <Line d="M40 74 L31 91" color={T.ginger.shade} width={5} opacity={1} />
          <Line d="M60 74 L69 91" color={T.ginger.shade} width={5} opacity={1} />
          <Circle cx={50} cy={6} r={4} fill={fill('lemon')} />
          <Ellipse cx={50} cy={43} rx={27} ry={36} fill={fill('lemon')} />
          <Defs>
            <ClipPath id={`${id}-glass`}>
              <Ellipse cx={50} cy={43} rx={20.5} ry={29.5} />
            </ClipPath>
          </Defs>
          <Ellipse cx={50} cy={43} rx={20.5} ry={29.5} fill={fill('glass')} />
          {/* Diagonal reflection streaks: the sign of a mirror. */}
          <G clipPath={`url(#${id}-glass)`}>
            <Path d="M24 40 L50 8 L58 8 L24 52 Z" fill={gloss} opacity={0.85} />
            <Path d="M34 66 L72 20 L72 28 L36 74 Z" fill={gloss} opacity={0.7} />
          </G>
          <Gloss cx={31} cy={24} rx={3} ry={8} rotate={30} />
        </>
      )}
    </Canvas>
  );
}

// ---------------------------------------------------------------- bathroom

function Bathtub({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['snow', 'glass', 'lemon', 'grey', 'sky']} shadowWidth={42}>
      {(fill) => (
        <>
          <Path d="M20 78 L16 91 C16 92 20 92 22 92 L28 80 Z" fill={fill('lemon')} />
          <Path d="M80 78 L84 91 C84 92 80 92 78 92 L72 80 Z" fill={fill('lemon')} />
          <Line d="M14 44 L14 26 C14 20 24 20 24 27" color={T.grey.face} width={4.2} opacity={1} />
          <Path d="M24 31 C26 34 26 36 24 37 C22 36 22 34 24 31 Z" fill={fill('sky')} />
          {/* Foam over the rim. */}
          {[
            [26, 42, 8],
            [39, 38, 10],
            [54, 39, 9.5],
            [68, 41, 8.5],
            [80, 43, 6],
          ].map(([x, y, r]) => (
            <Circle key={x} cx={x} cy={y} r={r} fill={fill('glass')} />
          ))}
          <Circle cx={63} cy={22} r={3.6} fill={fill('glass')} />
          <Circle cx={73} cy={14} r={2.6} fill={fill('glass')} />
          <Circle cx={52} cy={17} r={2} fill={fill('glass')} />
          <Path d="M8 46 L92 46 C92 70 80 84 60 84 L40 84 C20 84 8 70 8 46 Z" fill={fill('snow')} />
          <Rect x={4} y={42} width={92} height={8} rx={4} fill={fill('snow')} />
          <Gloss cx={22} cy={60} rx={2.4} ry={8} rotate={-30} />
          <Gloss cx={36} cy={34} rx={3} ry={1.6} rotate={-30} opacity={0.9} />
        </>
      )}
    </Canvas>
  );
}

function Sink({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['snow', 'grey', 'sky', 'red']} shadowWidth={22}>
      {(fill) => (
        <>
          <Path
            d="M41 62 L59 62 L63 89 C63 91 62 92 60 92 L40 92 C38 92 37 91 37 89 Z"
            fill={fill('snow')}
          />
          <Line
            d="M50 38 L50 21 C50 14 62 14 62 21 L62 24"
            color={T.grey.face}
            width={5}
            opacity={1}
          />
          <Circle cx={38} cy={34} r={4} fill={fill('red')} />
          <Circle cx={62} cy={34} r={4} fill={fill('sky')} />
          <Path d="M62 28 C64.5 31.5 64.5 34 62 35 C59.5 34 59.5 31.5 62 28 Z" fill={fill('sky')} />
          <Path d="M14 44 L86 44 C86 60 72 68 50 68 C28 68 14 60 14 44 Z" fill={fill('snow')} />
          <Rect x={11} y={38} width={78} height={9} rx={4.5} fill={fill('snow')} />
          <Gloss cx={26} cy={52} rx={2} ry={6} rotate={-50} />
          <Gloss cx={45} cy={70} rx={1.4} ry={6} rotate={0} opacity={0.7} />
        </>
      )}
    </Canvas>
  );
}

function Toilet({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['snow', 'grey', 'sky']} shadowWidth={30}>
      {(fill) => (
        <>
          <Rect x={63} y={12} width={11} height={5} rx={2.5} fill={fill('grey')} />
          <Rect x={55} y={15} width={29} height={40} rx={7} fill={fill('snow')} />
          <Path
            d="M18 52 L76 52 L76 60 C76 70 68 77 60 79 L62 90 C62 91 61 92 60 92 L38 92 C37 92 36 91 36 90 L39 79 C26 75 18 66 18 52 Z"
            fill={fill('snow')}
          />
          <Rect x={13} y={45} width={67} height={8} rx={4} fill={fill('sky')} />
          <Gloss cx={60} cy={24} rx={1.8} ry={6} rotate={0} />
          <Gloss cx={28} cy={62} rx={2} ry={6} rotate={-40} />
          <Gloss cx={26} cy={47} rx={6} ry={1.4} rotate={0} opacity={0.8} />
        </>
      )}
    </Canvas>
  );
}

function Towel({ size }: WordArtProps) {
  const B = T.sky;
  return (
    <Canvas size={size} tones={['grey', 'sky', 'lemon']} shadowWidth={26}>
      {(fill) => (
        <>
          <Path d="M24 22 C24 15 28 13 32 13 L68 13 C72 13 76 15 76 22 Z" fill={B.shade} />
          <Rect x={8} y={16} width={84} height={6} rx={3} fill={fill('grey')} />
          <Circle cx={9} cy={19} r={4.5} fill={fill('grey')} />
          <Circle cx={91} cy={19} r={4.5} fill={fill('grey')} />
          <Path
            d="M22 20 C22 17 24 16 27 16 L73 16 C76 16 78 17 78 20 L78 84 C70 88 62 85 56 87 C48 89 40 85 33 87 C28 88 24 87 22 85 Z"
            fill={fill('sky')}
          />
          {/* Stripes near the hem. */}
          <Rect x={22} y={64} width={56} height={5} fill={fill('lemon')} />
          <Rect x={22} y={72} width={56} height={2.5} fill={T.cream.light} />
          <Line d="M50 22 L50 60" color={B.shade} width={1.6} opacity={0.35} />
          <Gloss cx={30} cy={34} rx={2.2} ry={10} rotate={4} />
        </>
      )}
    </Canvas>
  );
}

function Soap({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['pink', 'glass']} shadowWidth={36}>
      {(fill) => (
        <>
          <Rect x={14} y={56} width={72} height={34} rx={15} fill={fill('pink')} />
          <Rect x={18} y={50} width={64} height={24} rx={12} fill={fill('pink')} />
          <Ellipse
            cx={50}
            cy={62}
            rx={18}
            ry={6}
            fill="none"
            stroke={T.pink.shade}
            strokeOpacity={0.6}
            strokeWidth={2}
          />
          {[
            [30, 40, 9],
            [49, 32, 6.5],
            [68, 38, 10],
            [78, 20, 5],
            [40, 16, 4.5],
            [60, 12, 3],
          ].map(([x, y, r]) => (
            <G key={x}>
              <Circle cx={x} cy={y} r={r} fill={fill('glass')} opacity={0.85} />
              <Circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill={gloss} />
            </G>
          ))}
          <Gloss cx={28} cy={55} rx={8} ry={2.2} rotate={-8} />
        </>
      )}
    </Canvas>
  );
}

function Toothbrush({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['sky', 'snow', 'mint', 'lemon']} shadowWidth={34}>
      {(fill) => (
        <G transform="rotate(-28 50 60)">
          <Rect x={4} y={58} width={64} height={11} rx={5.5} fill={fill('sky')} />
          <Rect x={60} y={60} width={34} height={8} rx={4} fill={fill('sky')} />
          <Rect x={63} y={44} width={28} height={16} rx={3} fill={fill('snow')} />
          {[66, 74, 82].map((x) => (
            <Rect
              key={x}
              x={x}
              y={44}
              width={4}
              height={16}
              rx={1.5}
              fill={T.mint.face}
              opacity={0.7}
            />
          ))}
          {/* A swirl of toothpaste. */}
          <Path
            d="M60 42 C60 34 70 32 76 35 C82 32 92 34 92 41 C86 44 66 45 60 42 Z"
            fill={fill('mint')}
          />
          <Path
            d="M64 39 C70 36 80 36 88 38"
            stroke={T.cream.light}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={14} cy={63.5} r={2} fill={fill('lemon')} />
          <Circle cx={22} cy={63.5} r={2} fill={fill('lemon')} />
          <Gloss cx={34} cy={61} rx={12} ry={1.6} rotate={0} />
        </G>
      )}
    </Canvas>
  );
}

// ---------------------------------------------------------------- kitchen

function Fridge({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['frost', 'grey', 'red', 'lemon', 'mint']} shadowWidth={28}>
      {(fill) => (
        <>
          <Rect x={30} y={84} width={8} height={8} rx={2} fill={fill('grey')} />
          <Rect x={62} y={84} width={8} height={8} rx={2} fill={fill('grey')} />
          <Rect x={24} y={6} width={52} height={81} rx={12} fill={fill('frost')} />
          <Rect
            x={24}
            y={33}
            width={52}
            height={2.6}
            fill={LOCAL_TONES.frost.shade}
            opacity={0.7}
          />
          <Rect x={30} y={15} width={4.5} height={13} rx={2.25} fill={fill('grey')} />
          <Rect x={30} y={41} width={4.5} height={22} rx={2.25} fill={fill('grey')} />
          {/* Magnets. */}
          <Circle cx={58} cy={48} r={4.5} fill={fill('red')} />
          <Rect
            x={60}
            y={58}
            width={9}
            height={9}
            rx={2.5}
            fill={fill('lemon')}
            transform="rotate(12 64.5 62.5)"
          />
          <Circle cx={52} cy={68} r={3.8} fill={fill('mint')} />
          <Gloss cx={38} cy={14} rx={7} ry={2} rotate={-10} />
          <Gloss cx={42} cy={44} rx={1.8} ry={9} rotate={4} opacity={0.6} />
        </>
      )}
    </Canvas>
  );
}

function Oven({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['snow', 'charcoal', 'orange', 'lemon', 'grey']} shadowWidth={40}>
      {(fill) => (
        <>
          <Rect x={16} y={20} width={68} height={68} rx={8} fill={fill('snow')} />
          <Rect x={20} y={86} width={8} height={6} rx={2} fill={fill('charcoal')} />
          <Rect x={72} y={86} width={8} height={6} rx={2} fill={fill('charcoal')} />
          <Rect x={12} y={15} width={76} height={9} rx={4.5} fill={fill('charcoal')} />
          {[27, 41, 59, 73].map((x) => (
            <Circle key={x} cx={x} cy={33} r={4} fill={fill('charcoal')} />
          ))}
          <Rect x={24} y={42} width={52} height={4} rx={2} fill={fill('grey')} />
          <Rect x={24} y={50} width={52} height={32} rx={6} fill={fill('charcoal')} />
          {/* Warm glow behind the oven window. */}
          <Rect x={29} y={55} width={42} height={22} rx={4} fill={fill('orange')} />
          <Path
            d="M36 70 C36 63 48 61 54 64 C60 61 66 65 64 70 Z"
            fill={fill('lemon')}
            opacity={0.8}
          />
          <Gloss cx={34} cy={59} rx={5} ry={1.4} rotate={-12} opacity={0.5} />
          <Gloss cx={22} cy={30} rx={1.8} ry={5} rotate={0} />
        </>
      )}
    </Canvas>
  );
}

function Cup({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['berry', 'brown', 'grey']} shadowWidth={30}>
      {(fill) => (
        <>
          <Line d="M43 24 C39 18 47 14 43 7" color={T.grey.face} width={2.6} opacity={0.6} />
          <Line d="M56 24 C52 18 60 14 56 7" color={T.grey.face} width={2.6} opacity={0.6} />
          <Path
            d="M72 46 C88 44 90 72 72 74"
            stroke={T.berry.face}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M24 32 L76 32 L74 84 C74 88 70 92 65 92 L35 92 C30 92 26 88 26 84 Z"
            fill={fill('berry')}
          />
          <Ellipse cx={50} cy={32} rx={26} ry={5.5} fill={T.berry.shade} />
          <Ellipse cx={50} cy={33.2} rx={22.5} ry={3.8} fill={fill('brown')} />
          {/* Cream heart on the mug. */}
          <Path
            d="M50 70 C40 63 38 57 42 53 C45 50 49 52 50 55 C51 52 55 50 58 53 C62 57 60 63 50 70 Z"
            fill={T.cream.light}
          />
          <Gloss cx={33} cy={48} rx={2.6} ry={10} rotate={-4} />
        </>
      )}
    </Canvas>
  );
}

function DrinkingGlass({ size }: WordArtProps) {
  const G0 = T.glass;
  return (
    <Canvas size={size} tones={['glass']} shadowWidth={22}>
      {(fill) => (
        <>
          {/* Straight, ribbed and empty: unlike the tapered, full water and milk glasses. */}
          <Path
            d="M28 30 L72 30 L70 87 C70 90 68 92 65 92 L35 92 C32 92 30 90 30 87 Z"
            fill={fill('glass')}
            opacity={0.75}
          />
          {[37, 44, 51, 58, 65].map((x) => (
            <Line
              key={x}
              d={`M${x} 40 L${x - (x - 50) * 0.04} 80`}
              color={G0.shade}
              width={1.6}
              opacity={0.55}
            />
          ))}
          <Rect x={30} y={81} width={40} height={11} rx={4} fill={G0.shade} opacity={0.45} />
          <Ellipse
            cx={50}
            cy={30}
            rx={22}
            ry={4.2}
            fill={G0.light}
            stroke={G0.shade}
            strokeWidth={1.6}
          />
          <Gloss cx={33} cy={56} rx={2} ry={20} rotate={-2} opacity={0.85} />
          {/* Sparkle: clean and empty. */}
          <Path
            d="M80 14 C80.6 19 81 19.4 86 20 C81 20.6 80.6 21 80 26 C79.4 21 79 20.6 74 20 C79 19.4 79.4 19 80 14 Z"
            fill={G0.shade}
          />
        </>
      )}
    </Canvas>
  );
}

function Plate({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['snow', 'grey']} shadowWidth={42}>
      {(fill) => (
        <>
          <Ellipse cx={50} cy={73} rx={44} ry={18} fill={T.grey.face} />
          <Ellipse cx={50} cy={69} rx={45} ry={19} fill={fill('snow')} />
          <Ellipse
            cx={50}
            cy={68}
            rx={39}
            ry={15.5}
            fill="none"
            stroke={T.sky.face}
            strokeWidth={2}
          />
          <Ellipse cx={50} cy={70} rx={26} ry={9.5} fill={T.glass.face} opacity={0.6} />
          <Gloss cx={26} cy={62} rx={7} ry={2} rotate={-14} />
        </>
      )}
    </Canvas>
  );
}

function Bowl({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['sky']} shadowWidth={30}>
      {(fill) => (
        <>
          <Rect x={36} y={84} width={28} height={8} rx={3} fill={fill('sky')} />
          <Path d="M10 46 C10 72 28 88 50 88 C72 88 90 72 90 46 Z" fill={fill('sky')} />
          <Ellipse cx={50} cy={46} rx={40} ry={10} fill={T.sky.light} />
          <Ellipse cx={50} cy={47.5} rx={35} ry={7.5} fill={T.sky.shade} opacity={0.75} />
          {[
            [28, 62],
            [42, 68],
            [58, 68],
            [72, 62],
            [50, 79],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={2.8} fill={T.cream.light} />
          ))}
          <Gloss cx={21} cy={60} rx={2.4} ry={7} rotate={-40} />
        </>
      )}
    </Canvas>
  );
}

function Spoon({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['grey']} shadowWidth={30}>
      {(fill) => (
        <G transform="rotate(-38 50 54)">
          <Path
            d="M8 54 C8 49 12 47.5 17 48 L60 51.5 L60 56.5 L17 60 C12 60.5 8 59 8 54 Z"
            fill={fill('grey')}
          />
          <Ellipse cx={74} cy={54} rx={18} ry={12.5} fill={fill('grey')} />
          <Ellipse cx={75} cy={54} rx={13} ry={8.5} fill={T.grey.shade} opacity={0.35} />
          <Gloss cx={68} cy={50} rx={5} ry={2.4} rotate={0} opacity={0.85} />
          <Gloss cx={26} cy={51} rx={9} ry={1.2} rotate={3} />
        </G>
      )}
    </Canvas>
  );
}

function Fork({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['grey']} shadowWidth={30}>
      {(fill) => (
        <G transform="rotate(-38 50 54)">
          <Path
            d="M8 54 C8 49 12 47.5 17 48 L56 51.5 L56 56.5 L17 60 C12 60.5 8 59 8 54 Z"
            fill={fill('grey')}
          />
          <Path
            d="M53 50 C57 44 63 41.5 70 41.5 L70 66.5 C63 66.5 57 64 53 58 Z"
            fill={fill('grey')}
          />
          {[41.5, 48.5, 55.5, 62.5].map((y) => (
            <Rect key={y} x={66} y={y} width={26} height={4} rx={2} fill={fill('grey')} />
          ))}
          <Gloss cx={26} cy={51} rx={9} ry={1.2} rotate={3} />
          <Gloss cx={62} cy={47} rx={4} ry={1.4} rotate={-20} opacity={0.8} />
        </G>
      )}
    </Canvas>
  );
}

// ---------------------------------------------------------------- textiles

function Pillow({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['snow', 'sky']} shadowWidth={38}>
      {(fill) => (
        <G transform="rotate(-6 50 60)">
          <Path
            d="M10 30 C32 36 68 36 90 30 C84 48 84 70 90 88 C68 82 32 82 10 88 C16 70 16 48 10 30 Z"
            fill={fill('snow')}
          />
          {[
            [32, 48],
            [50, 46],
            [68, 48],
            [41, 60],
            [59, 60],
            [32, 72],
            [50, 74],
            [68, 72],
          ].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={2.4} fill={fill('sky')} opacity={0.8} />
          ))}
          <Line d="M24 40 C40 44 60 44 76 40" color={S.shade} width={1.6} opacity={0.4} />
          <Gloss cx={22} cy={62} rx={2.2} ry={8} rotate={4} />
        </G>
      )}
    </Canvas>
  );
}

function Blanket({ size }: WordArtProps) {
  const R = T.berry;
  return (
    <Canvas size={size} tones={['berry', 'pink', 'lemon']} shadowWidth={42}>
      {(fill, id) => (
        <>
          <Defs>
            <ClipPath id={`${id}-quilt`}>
              <Path d="M18 30 L82 30 C88 30 90 34 90 40 L90 84 C90 88 87 92 82 92 L18 92 C13 92 10 88 10 84 L10 40 C10 34 12 30 18 30 Z" />
            </ClipPath>
          </Defs>
          {/* A folded plaid blanket: three soft folds stacked. */}
          <Path
            d="M18 30 L82 30 C88 30 90 34 90 40 L90 50 L10 50 L10 40 C10 34 12 30 18 30 Z"
            fill={fill('pink')}
          />
          <Rect x={10} y={42} width={80} height={18} rx={9} fill={fill('berry')} />
          <Rect x={10} y={57} width={80} height={18} rx={9} fill={fill('berry')} />
          <Rect x={10} y={73} width={80} height={19} rx={9} fill={fill('berry')} />
          <G clipPath={`url(#${id}-quilt)`}>
            {[28, 62].map((x) => (
              <Rect
                key={x}
                x={x}
                y={28}
                width={7}
                height={66}
                fill={fill('lemon')}
                opacity={0.85}
              />
            ))}
            {[46, 80].map((x) => (
              <Rect
                key={x}
                x={x}
                y={28}
                width={2.4}
                height={66}
                fill={T.cream.light}
                opacity={0.8}
              />
            ))}
          </G>
          <Line d="M16 59 L84 59" color={R.shade} width={1.6} opacity={0.6} />
          <Line d="M16 75 L84 75" color={R.shade} width={1.6} opacity={0.6} />
          <Gloss cx={24} cy={36} rx={8} ry={2} rotate={-4} />
          <Gloss cx={16} cy={50} rx={1.6} ry={4} rotate={0} opacity={0.7} />
        </>
      )}
    </Canvas>
  );
}

// ---------------------------------------------------------------- things

function Key({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['lemon']} shadowWidth={34}>
      {(fill) => (
        <G transform="rotate(-18 50 62)">
          <Path
            d="M28 42 A19 19 0 1 1 28 80 A19 19 0 1 1 28 42 Z M28 53 A8 8 0 1 0 28 69 A8 8 0 1 0 28 53 Z"
            fill={fill('lemon')}
            fillRule="evenodd"
          />
          <Rect x={42} y={56} width={50} height={10} rx={5} fill={fill('lemon')} />
          <Rect x={72} y={62} width={7} height={14} rx={2.5} fill={fill('lemon')} />
          <Rect x={83} y={62} width={7} height={10} rx={2.5} fill={fill('lemon')} />
          <Gloss cx={17} cy={52} rx={2.4} ry={6} rotate={30} />
          <Gloss cx={58} cy={58.5} rx={10} ry={1.4} rotate={0} />
        </G>
      )}
    </Canvas>
  );
}

function Phone({ size }: WordArtProps) {
  const apps: [number, number, Tone][] = [
    [38, 22, 'red'],
    [48, 22, 'lemon'],
    [58, 22, 'mint'],
    [38, 33, 'orange'],
    [48, 33, 'berry'],
    [58, 33, 'sky'],
    [38, 44, 'mint'],
    [48, 44, 'red'],
    [58, 44, 'lemon'],
  ];
  return (
    <Canvas
      size={size}
      tones={['charcoal', 'glass', 'red', 'lemon', 'mint', 'orange', 'berry', 'sky']}
      shadowWidth={24}
    >
      {(fill) => (
        <G transform="rotate(-8 50 92)">
          <Rect x={30} y={6} width={42} height={86} rx={10} fill={fill('charcoal')} />
          <Rect x={34} y={13} width={34} height={72} rx={5} fill={fill('glass')} />
          <Rect x={45} y={9} width={12} height={2} rx={1} fill={T.charcoal.light} />
          {apps.map(([x, y, tone]) => (
            <Rect key={`${x}-${y}`} x={x} y={y} width={7} height={7} rx={2} fill={fill(tone)} />
          ))}
          <Rect x={43} y={80} width={16} height={2} rx={1} fill={T.charcoal.light} />
          <Gloss cx={36} cy={22} rx={2} ry={9} rotate={6} opacity={0.5} />
        </G>
      )}
    </Canvas>
  );
}

function Television({ size }: WordArtProps) {
  const C = T.charcoal;
  return (
    <Canvas
      size={size}
      tones={['terracotta', 'sky', 'mint', 'lemon', 'cream', 'charcoal']}
      shadowWidth={38}
    >
      {(fill, id) => (
        <>
          <Line d="M48 26 L32 8" color={C.face} width={2.6} opacity={1} />
          <Line d="M52 26 L70 6" color={C.face} width={2.6} opacity={1} />
          <Circle cx={32} cy={8} r={3} fill={fill('charcoal')} />
          <Circle cx={70} cy={6} r={3} fill={fill('charcoal')} />
          <Line d="M24 80 L19 91" color={C.face} width={4.5} opacity={1} />
          <Line d="M76 80 L81 91" color={C.face} width={4.5} opacity={1} />
          <Rect x={8} y={24} width={84} height={60} rx={13} fill={fill('terracotta')} />
          <Defs>
            <ClipPath id={`${id}-screen`}>
              <Rect x={15} y={31} width={56} height={46} rx={9} />
            </ClipPath>
          </Defs>
          <Rect x={15} y={31} width={56} height={46} rx={9} fill={fill('sky')} />
          {/* A sunny hill on the screen. */}
          <G clipPath={`url(#${id}-screen)`}>
            <Circle cx={56} cy={45} r={6} fill={fill('lemon')} />
            <Path
              d="M10 70 C24 56 40 56 56 66 C64 62 70 62 76 64 L76 80 L10 80 Z"
              fill={fill('mint')}
            />
          </G>
          <Circle cx={82} cy={40} r={4.2} fill={fill('cream')} />
          <Circle cx={82} cy={53} r={4.2} fill={fill('cream')} />
          {[63, 68, 73].map((y) => (
            <Rect key={y} x={78} y={y} width={8} height={2} rx={1} fill={T.terracotta.shade} />
          ))}
          <Gloss cx={23} cy={38} rx={5} ry={2} rotate={-30} />
          <Gloss cx={15} cy={27.5} rx={6} ry={1.4} rotate={-6} />
        </>
      )}
    </Canvas>
  );
}

function Book({ size }: WordArtProps) {
  const P = LOCAL_TONES.paper;
  const lines = [44, 51, 58, 65];
  return (
    <Canvas size={size} tones={['red', 'paper', 'lemon']} shadowWidth={42}>
      {(fill) => (
        <>
          <Path d="M53 82 L53 92 L57 89 L61 92 L61 80 Z" fill={fill('lemon')} />
          <Path
            d="M5 40 C26 34 42 36 50 42 C58 36 74 34 95 40 L95 84 C74 78 58 80 50 87 C42 80 26 78 5 84 Z"
            fill={fill('red')}
          />
          <Path d="M10 34 C26 28 42 30 50 38 L50 81 C42 74 26 72 10 78 Z" fill={fill('paper')} />
          <Path d="M90 34 C74 28 58 30 50 38 L50 81 C58 74 74 72 90 78 Z" fill={fill('paper')} />
          {lines.map((y) => (
            <G key={y}>
              <Line
                d={`M17 ${y - 3} C26 ${y - 7} 36 ${y - 6} 43 ${y - 1}`}
                color={P.shade}
                width={2}
                opacity={0.7}
              />
              <Line
                d={`M83 ${y - 3} C74 ${y - 7} 64 ${y - 6} 57 ${y - 1}`}
                color={P.shade}
                width={2}
                opacity={0.7}
              />
            </G>
          ))}
          <Line d="M50 38 L50 81" color={P.shade} width={1.6} opacity={0.8} />
          <Gloss cx={22} cy={34} rx={7} ry={1.8} rotate={-18} />
        </>
      )}
    </Canvas>
  );
}

function Pencil({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['lemon', 'pink', 'grey', 'tan', 'charcoal']} shadowWidth={34}>
      {(fill) => (
        <G transform="rotate(-35 50 56)">
          <Rect x={4} y={48} width={16} height={16} rx={6} fill={fill('pink')} />
          <Rect x={15} y={47} width={9} height={18} rx={2} fill={fill('grey')} />
          <Rect x={22} y={48} width={52} height={16} fill={fill('lemon')} />
          <Line d="M23 56 L73 56" color={T.lemon.shade} width={1.6} opacity={0.6} />
          <Path d="M74 48 L94 56 L74 64 Z" fill={fill('tan')} />
          <Path d="M87 53.2 L95 56 L87 58.8 Z" fill={fill('charcoal')} />
          <Gloss cx={44} cy={51} rx={16} ry={1.4} rotate={0} />
        </G>
      )}
    </Canvas>
  );
}

function OneCrayon({
  fill,
  cx,
  tone,
  angle,
}: {
  fill: Fill;
  cx: number;
  tone: Tone;
  angle: number;
}) {
  const shade = isLocal(tone) ? LOCAL_TONES[tone].shade : artPalette.tones[tone].shade;
  return (
    <G transform={`rotate(${angle} ${cx} 90)`}>
      <Path
        d={`M${cx - 8} 30 L${cx - 4} 15 C${cx - 3} 12 ${cx + 3} 12 ${cx + 4} 15 L${cx + 8} 30 Z`}
        fill={fill(tone)}
      />
      <Rect x={cx - 9} y={28} width={18} height={62} rx={4} fill={fill(tone)} />
      <Rect x={cx - 9} y={38} width={18} height={40} fill={T.cream.light} opacity={0.35} />
      <Line d={`M${cx - 8} 38 L${cx + 8} 38`} color={shade} width={1.8} opacity={0.8} />
      <Line d={`M${cx - 8} 78 L${cx + 8} 78`} color={shade} width={1.8} opacity={0.8} />
      <Line
        d={`M${cx - 6} 58 L${cx - 3} 54 L${cx} 58 L${cx + 3} 54 L${cx + 6} 58`}
        color={shade}
        width={1.6}
        opacity={0.8}
      />
      <Gloss cx={cx - 5} cy={52} rx={1.4} ry={8} rotate={0} />
    </G>
  );
}

function Crayon({ size }: WordArtProps) {
  return (
    <Canvas size={size} tones={['red', 'sky', 'mint']} shadowWidth={34}>
      {(fill) => (
        <>
          <OneCrayon fill={fill} cx={30} tone="red" angle={-14} />
          <OneCrayon fill={fill} cx={70} tone="mint" angle={14} />
          <OneCrayon fill={fill} cx={50} tone="sky" angle={0} />
        </>
      )}
    </Canvas>
  );
}

function Scissors({ size }: WordArtProps) {
  const B = T.berry;
  const ring = (cx: number, cy: number) =>
    `M${cx - 14} ${cy} A14 11 0 1 1 ${cx + 14} ${cy} A14 11 0 1 1 ${cx - 14} ${cy} Z M${cx - 7.5} ${cy} A7.5 5.5 0 1 0 ${cx + 7.5} ${cy} A7.5 5.5 0 1 0 ${cx - 7.5} ${cy} Z`;
  return (
    <Canvas size={size} tones={['grey', 'berry', 'charcoal']} shadowWidth={32}>
      {(fill) => (
        <>
          {/* Round-tipped blades: safe for children. */}
          <Rect
            x={45}
            y={6}
            width={10}
            height={50}
            rx={5}
            fill={fill('grey')}
            transform="rotate(-17 50 52)"
          />
          <Rect
            x={45}
            y={6}
            width={10}
            height={50}
            rx={5}
            fill={fill('grey')}
            transform="rotate(17 50 52)"
          />
          <Line d="M50 52 L37 70" color={B.face} width={8} opacity={1} />
          <Line d="M50 52 L63 70" color={B.face} width={8} opacity={1} />
          <Path d={ring(31, 78)} fill={fill('berry')} fillRule="evenodd" />
          <Path d={ring(69, 78)} fill={fill('berry')} fillRule="evenodd" />
          <Circle cx={50} cy={52} r={3.6} fill={fill('charcoal')} />
          <Gloss cx={38} cy={24} rx={1.6} ry={10} rotate={-17} />
          <Gloss cx={23} cy={72} rx={4} ry={1.6} rotate={-30} />
        </>
      )}
    </Canvas>
  );
}

function Box({ size }: WordArtProps) {
  const C = LOCAL_TONES.card;
  return (
    <Canvas size={size} tones={['card', 'tan', 'brown', 'ginger', 'red']} shadowWidth={40}>
      {(fill) => (
        <>
          {/* Open flaps, the inside, then the front and side faces. */}
          <Path d="M12 46 L40 34 L28 16 L2 28 Z" fill={fill('tan')} />
          <Path d="M88 42 L60 54 L74 36 L96 24 Z" fill={fill('tan')} />
          <Path d="M12 46 L40 34 L88 42 L60 54 Z" fill={fill('brown')} />
          <Path d="M40 34 L88 42 L82 26 L46 18 Z" fill={fill('ginger')} />
          <Path d="M12 46 L60 54 L60 92 L12 84 Z" fill={fill('card')} />
          <Path d="M60 54 L88 42 L88 80 L60 92 Z" fill={fill('ginger')} />
          <Line d="M36 50 L36 88" color={C.shade} width={1.6} opacity={0.5} />
          {/* A small heart sticker. */}
          <Path
            d="M44 77 C38 73 37 69 39.5 67 C41.5 65.5 43.5 66.5 44 68.5 C44.5 66.5 46.5 65.5 48.5 67 C51 69 50 73 44 77 Z"
            fill={fill('red')}
          />
          <Gloss cx={20} cy={58} rx={2} ry={8} rotate={8} />
          <Gloss cx={16} cy={34} rx={6} ry={1.6} rotate={-24} />
        </>
      )}
    </Canvas>
  );
}

export const householdArt: WordArtMap = {
  'home.door': Door,
  'home.window': Window,
  'home.table': Table,
  'home.chair': Chair,
  'home.bed': Bed,
  'home.sofa': Sofa,
  'home.lamp': Lamp,
  'home.clock': Clock,
  'home.mirror': Mirror,
  'home.bathtub': Bathtub,
  'home.toilet': Toilet,
  'home.sink': Sink,
  'home.fridge': Fridge,
  'home.oven': Oven,
  'home.cup': Cup,
  'home.glass': DrinkingGlass,
  'home.plate': Plate,
  'home.bowl': Bowl,
  'home.spoon': Spoon,
  'home.fork': Fork,
  'home.pillow': Pillow,
  'home.blanket': Blanket,
  'home.towel': Towel,
  'home.soap': Soap,
  'home.toothbrush': Toothbrush,
  'home.key': Key,
  'home.phone': Phone,
  'home.television': Television,
  'home.book': Book,
  'home.pencil': Pencil,
  'home.crayon': Crayon,
  'home.scissors': Scissors,
  'home.box': Box,
};
