import { useId, type ReactNode } from 'react';
import { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

import { ClayGradient, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

// Food and meals of the 2–7 word list (bread, cheese, soup, sweets...).
// Drawn the same way as the pilot: clay gradients lit from the top left, a
// gloss on that side, the shared ground shadow, no outlines.
//
// Foods need a few colours the shared palette does not have (honey, olive,
// chocolate...). They are mixed here from palette tones, so no new hex value
// is written and they move together with the palette.

const T = artPalette.tones;

function mixHex(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  let out = '#';
  for (let i = 0; i < 3; i++) {
    const value = Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t);
    out += value.toString(16).padStart(2, '0');
  }
  return out.toUpperCase();
}

/** A tone between `a` (t = 0) and `b` (t = 1), stop by stop. */
function mixTone(a: ClayTone, b: ClayTone, t: number): ClayTone {
  return {
    light: mixHex(a.light, b.light, t),
    face: mixHex(a.face, b.face, t),
    shade: mixHex(a.shade, b.shade, t),
  };
}

const oliveGreen = mixTone(mixTone(T.mint, T.lemon, 0.55), T.brown, 0.3);

const mealTones = {
  crust: mixTone(T.ginger, T.brown, 0.3),
  crumb: mixTone(T.cream, T.tan, 0.35),
  kasar: mixTone(T.lemon, T.orange, 0.2),
  kasarTop: mixTone(mixTone(T.lemon, T.orange, 0.2), T.cream, 0.4),
  butter: mixTone(T.lemon, T.cream, 0.55),
  butterTop: mixTone(T.lemon, T.cream, 0.75),
  shell: mixTone(T.cream, T.tan, 0.45),
  yolk: mixTone(T.lemon, T.orange, 0.45),
  rice: mixTone(T.cream, T.tan, 0.25),
  noodle: mixTone(T.lemon, T.tan, 0.55),
  lentil: mixTone(T.orange, T.ginger, 0.35),
  meat: mixTone(T.terracotta, T.brown, 0.45),
  bone: mixTone(T.cream, T.tan, 0.3),
  leaf: mixTone(T.mint, T.lemon, 0.3),
  plate: mixTone(T.cream, T.sky, 0.22),
  cookie: mixTone(T.tan, T.ginger, 0.5),
  cocoa: mixTone(T.brown, T.charcoal, 0.4),
  honey: mixTone(T.orange, T.lemon, 0.45),
  jam: mixTone(T.red, T.charcoal, 0.15),
  greenOlive: oliveGreen,
  blackOlive: mixTone(T.charcoal, T.berry, 0.12),
  oliveLeaf: mixTone(oliveGreen, T.grey, 0.45),
} satisfies Record<string, ClayTone>;

type MealToneName = keyof typeof mealTones;
type Tone = ArtToneName | MealToneName;
type MealFill = (tone: Tone) => string;

const isMealTone = (tone: Tone): tone is MealToneName => Object.hasOwn(mealTones, tone);

type CanvasProps = {
  size?: number;
  tones: readonly Tone[];
  shadowWidth?: number;
  /** `id` is a per-instance prefix for clip paths. */
  children: (fill: MealFill, id: string) => ReactNode;
};

/** WordCanvas that also knows the mixed food tones above. */
function MealCanvas({ size, tones, shadowWidth, children }: CanvasProps) {
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const shared = tones.filter((tone): tone is ArtToneName => !isMealTone(tone));
  const own = tones.filter(isMealTone);
  return (
    <WordCanvas size={size} tones={shared} shadowWidth={shadowWidth}>
      {(fill) => (
        <>
          <Defs>
            {own.map((tone) => (
              <ClayGradient key={tone} id={`${id}-${tone}`} tone={mealTones[tone]} />
            ))}
          </Defs>
          {children((tone) => (isMealTone(tone) ? `url(#${id}-${tone})` : fill(tone)), id)}
        </>
      )}
    </WordCanvas>
  );
}

/** White plate with a thin blue rim, seen from the front. */
function Plate({ fill, cy = 82 }: { fill: MealFill; cy?: number }) {
  return (
    <>
      <Ellipse cx={50} cy={cy} rx={45} ry={10.5} fill={fill('plate')} />
      <Ellipse
        cx={50}
        cy={cy - 1}
        rx={38}
        ry={7.5}
        fill="none"
        stroke={T.sky.face}
        strokeWidth={1.6}
      />
    </>
  );
}

/** Deep round bowl; its top opening is an ellipse at y = 50. */
const BOWL = 'M8 50 C8 76 26 91 50 91 C74 91 92 76 92 50 Z';

/** Turkish somun: an oval loaf with one long split along the top. */
function Bread({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['crust', 'crumb']} shadowWidth={38}>
      {(fill) => (
        <>
          <Path
            d="M12 84 C3 76 5 58 18 48 C32 37 70 35 84 46 C97 56 96 76 88 84 C80 92 20 92 12 84 Z"
            fill={fill('crust')}
          />
          <Path d="M19 58 C33 45 66 42 83 51 C70 58 38 63 19 58 Z" fill={fill('crumb')} />
          <Path
            d="M19 58 C38 63 70 58 83 51"
            stroke={mealTones.crust.shade}
            strokeOpacity={0.5}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={27} cy={52} rx={8} ry={3.5} rotate={-28} />
          <Gloss cx={30} cy={74} rx={5} ry={2.5} rotate={-10} opacity={0.3} />
        </>
      )}
    </MealCanvas>
  );
}

/**
 * Cheese: a yellow wedge with holes. Chosen over a slice of white cheese: at
 * card size a white block reads as butter, sugar or soap, while the wedge with
 * holes is the shape children meet in every picture book.
 */
function Cheese({ size }: WordArtProps) {
  const holes = mealTones.kasar.shade;
  return (
    <MealCanvas size={size} tones={['kasar', 'kasarTop']} shadowWidth={38}>
      {(fill) => (
        <>
          <Path
            d="M13 55 L90 45 L90 82 L13 87 Z"
            fill={fill('kasar')}
            stroke={fill('kasar')}
            strokeWidth={7}
            strokeLinejoin="round"
          />
          <Path
            d="M13 55 L53 31 L90 45 Z"
            fill={fill('kasarTop')}
            stroke={fill('kasarTop')}
            strokeWidth={7}
            strokeLinejoin="round"
          />
          <G fill={holes} opacity={0.55}>
            <Ellipse cx={31} cy={70} rx={5.5} ry={4.5} />
            <Ellipse cx={56} cy={62} rx={4} ry={3.5} />
            <Ellipse cx={74} cy={73} rx={6.5} ry={5} />
            <Ellipse cx={47} cy={79} rx={3} ry={2.6} />
            <Ellipse cx={82} cy={57} rx={2.6} ry={2.4} />
            <Ellipse cx={58} cy={41} rx={5} ry={2.4} />
            <Ellipse cx={40} cy={46} rx={2.6} ry={1.4} />
          </G>
          <Gloss cx={30} cy={50} rx={9} ry={2.5} rotate={-30} />
        </>
      )}
    </MealCanvas>
  );
}

/** A whole egg standing and a halved boiled egg with its yolk in front. */
function Egg({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['shell', 'cream', 'yolk']} shadowWidth={38}>
      {(fill) => (
        <>
          <Path
            d="M37 22 C22 22 13 50 13 66 C13 82 23 91 37 91 C51 91 61 82 61 66 C61 50 52 22 37 22 Z"
            fill={fill('shell')}
          />
          <Gloss cx={27} cy={45} rx={5} ry={10} rotate={18} />
          <Ellipse cx={69} cy={79} rx={23} ry={13} fill={fill('cream')} />
          <Ellipse cx={69} cy={78} rx={12} ry={7.5} fill={fill('yolk')} />
          <Gloss cx={65} cy={75.5} rx={4} ry={1.8} rotate={-10} />
        </>
      )}
    </MealCanvas>
  );
}

const RICE_GRAINS: readonly [number, number, number][] = [
  [30, 62, 30],
  [40, 54, -20],
  [52, 50, 10],
  [62, 56, 40],
  [72, 66, -30],
  [24, 74, -10],
  [36, 70, 60],
  [48, 62, -40],
  [58, 68, 20],
  [68, 76, 70],
  [44, 78, 0],
  [56, 80, -60],
  [34, 80, 30],
  [78, 76, 10],
];

/** Pilav: a dome of rice on a plate, grains drawn in. */
function Rice({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['plate', 'rice']} shadowWidth={40}>
      {(fill) => (
        <>
          <Plate fill={fill} />
          <Path
            d="M16 80 C15 60 31 43 50 43 C69 43 85 60 84 80 C72 86 28 86 16 80 Z"
            fill={fill('rice')}
          />
          {RICE_GRAINS.map(([x, y, r]) => (
            <Ellipse
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              rx={2.6}
              ry={1.1}
              fill={mealTones.rice.shade}
              opacity={0.75}
              transform={`rotate(${r} ${x} ${y})`}
            />
          ))}
          <Gloss cx={35} cy={52} rx={8} ry={4} rotate={-35} />
        </>
      )}
    </MealCanvas>
  );
}

/** Makarna: spaghetti on a plate with tomato sauce and a fork in it. */
function Pasta({ size }: WordArtProps) {
  const strands = mealTones.noodle;
  return (
    <MealCanvas size={size} tones={['plate', 'noodle', 'red', 'grey']} shadowWidth={40}>
      {(fill) => (
        <>
          <Plate fill={fill} />
          <Path d="M72 52 L84 16" stroke={fill('grey')} strokeWidth={5} strokeLinecap="round" />
          <Path
            d="M15 80 C14 62 30 48 50 48 C70 48 86 62 85 80 C72 86 28 86 15 80 Z"
            fill={fill('noodle')}
          />
          <G fill="none" strokeLinecap="round" strokeWidth={1.8}>
            <Path d="M20 76 C26 62 40 70 46 58" stroke={strands.shade} opacity={0.7} />
            <Path d="M30 80 C38 66 54 76 60 60" stroke={strands.shade} opacity={0.7} />
            <Path d="M50 82 C56 70 70 78 78 64" stroke={strands.shade} opacity={0.7} />
            <Path d="M24 68 C34 58 48 64 56 54" stroke={strands.light} />
            <Path d="M40 78 C48 68 62 72 70 58" stroke={strands.light} />
            <Path d="M62 82 C68 74 78 76 82 70" stroke={strands.light} />
          </G>
          <Path
            d="M34 54 C34 45 60 43 64 51 C67 57 60 60 52 60 C44 61 34 60 34 54 Z"
            fill={fill('red')}
          />
          <Gloss cx={42} cy={50} rx={4.5} ry={2} rotate={-15} />
          <Gloss cx={26} cy={64} rx={6} ry={2.5} rotate={-40} opacity={0.4} />
        </>
      )}
    </MealCanvas>
  );
}

/** Çorba: a bowl of red lentil soup with a lemon wedge and steam. */
function Soup({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['sky', 'lentil', 'lemon']} shadowWidth={36}>
      {(fill) => (
        <>
          <G
            fill="none"
            stroke={T.grey.face}
            strokeOpacity={0.55}
            strokeWidth={3.5}
            strokeLinecap="round"
          >
            <Path d="M36 38 C30 31 42 26 36 18 C33 14 36 10 38 8" />
            <Path d="M52 36 C46 29 58 24 52 16 C49 12 52 8 54 6" />
            <Path d="M67 38 C62 32 72 28 67 21" />
          </G>
          <Path d={BOWL} fill={fill('sky')} />
          <Ellipse cx={50} cy={50} rx={42} ry={9.5} fill={fill('lentil')} />
          <Ellipse
            cx={50}
            cy={50}
            rx={42}
            ry={9.5}
            fill="none"
            stroke={T.sky.light}
            strokeWidth={2}
          />
          <G fill={T.red.shade} opacity={0.7}>
            <Circle cx={38} cy={49} r={1.1} />
            <Circle cx={46} cy={52} r={0.9} />
            <Circle cx={54} cy={48} r={1.1} />
            <Circle cx={44} cy={47} r={0.8} />
            <Circle cx={60} cy={52} r={0.9} />
          </G>
          {/* Lemon wedge hooked on the rim. */}
          <Path d="M70 50 A 11 11 0 0 1 92 50 Z" fill={fill('lemon')} />
          <Path
            d="M74 50 A 7 7 0 0 1 88 50 M81 50 L81 43.5 M81 50 L76 45.5 M81 50 L86 45.5"
            stroke={T.lemon.light}
            strokeWidth={1.3}
            fill="none"
          />
          <Gloss cx={20} cy={64} rx={4} ry={9} rotate={20} />
        </>
      )}
    </MealCanvas>
  );
}

/** Et: a roasted leg with the bone sticking out. */
function Meat({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['meat', 'bone']} shadowWidth={34}>
      {(fill) => (
        <>
          <Path d="M58 52 L80 26" stroke={fill('bone')} strokeWidth={10} strokeLinecap="round" />
          <Circle cx={79} cy={18} r={7} fill={fill('bone')} />
          <Circle cx={88} cy={27} r={7} fill={fill('bone')} />
          <Path
            d="M22 42 C34 26 60 28 67 46 C72 59 66 76 52 85 C38 93 17 89 12 74 C8 62 13 50 22 42 Z"
            fill={fill('meat')}
          />
          <Gloss cx={29} cy={46} rx={9} ry={4.5} rotate={-35} />
          <Gloss cx={77} cy={15} rx={2.5} ry={1.5} rotate={-30} />
        </>
      )}
    </MealCanvas>
  );
}

/** Salata: lettuce, tomato and cucumber heaped in a bowl. */
function Salad({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['leaf', 'red', 'mint', 'plate']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path
            d="M12 52 C8 38 22 28 32 34 C34 22 50 20 54 30 C60 20 78 24 76 36 C86 34 94 44 88 54 Z"
            fill={fill('leaf')}
          />
          <Path
            d="M30 46 C34 40 40 38 44 40 M58 36 C62 34 68 36 70 40"
            stroke={mealTones.leaf.shade}
            strokeOpacity={0.6}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          {/* Tomato wedges and a cucumber slice. */}
          <Path d="M20 50 A 11 11 0 0 1 42 50 Z" fill={fill('red')} />
          <Path d="M52 46 A 11 11 0 0 1 74 46 Z" fill={fill('red')} />
          <G fill={T.lemon.light} opacity={0.9}>
            <Ellipse cx={27} cy={46} rx={1.3} ry={2} />
            <Ellipse cx={35} cy={46} rx={1.3} ry={2} />
            <Ellipse cx={59} cy={42} rx={1.3} ry={2} />
            <Ellipse cx={67} cy={42} rx={1.3} ry={2} />
          </G>
          <Circle cx={47} cy={44} r={8} fill={fill('mint')} />
          <Circle cx={47} cy={44} r={5.5} fill={T.mint.light} />
          <G fill={T.mint.shade} opacity={0.6}>
            <Circle cx={45} cy={43} r={0.9} />
            <Circle cx={49} cy={43} r={0.9} />
            <Circle cx={47} cy={46.5} r={0.9} />
          </G>
          <Path
            d="M8 50 C8 76 26 91 50 91 C74 91 92 76 92 50 C70 57 30 57 8 50 Z"
            fill={fill('plate')}
          />
          <Path
            d="M10 60 C30 66 70 66 90 60"
            stroke={T.sky.face}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={22} cy={70} rx={3.5} ry={7} rotate={30} />
          <Gloss cx={24} cy={36} rx={4} ry={2} rotate={-30} />
        </>
      )}
    </MealCanvas>
  );
}

/** Triangle shape of one sandwich layer, shifted back by (dx, dy). */
const sandwichLayer = (dx: number, dy: number) =>
  `M${14 + dx} ${86 + dy} L${74 + dx} ${86 + dy} L${28 + dx} ${24 + dy} Z`;

/** Sandviç: a triangle half; lettuce, tomato and cheese peek out behind. */
function Sandwich({ size }: WordArtProps) {
  const layer = (dx: number, dy: number, paint: string) => (
    <Path
      d={sandwichLayer(dx, dy)}
      fill={paint}
      stroke={paint}
      strokeWidth={9}
      strokeLinejoin="round"
    />
  );
  return (
    <MealCanvas size={size} tones={['crust', 'crumb', 'leaf', 'red', 'kasar']} shadowWidth={38}>
      {(fill) => (
        <>
          {layer(16, -4, fill('crust'))}
          {layer(13, -3, fill('kasar'))}
          {layer(9, -2, fill('red'))}
          <Path
            d={sandwichLayer(5, -1)}
            fill={fill('leaf')}
            stroke={fill('leaf')}
            strokeWidth={11}
            strokeLinejoin="round"
            strokeDasharray="1 5"
            strokeLinecap="round"
          />
          {layer(0, 0, fill('crust'))}
          <Path
            d={sandwichLayer(0, 0)}
            fill={fill('crumb')}
            stroke={fill('crumb')}
            strokeWidth={1}
            strokeLinejoin="round"
            transform="translate(5.5 6.5) scale(0.86)"
          />
          <Gloss cx={30} cy={48} rx={3} ry={10} rotate={20} />
        </>
      )}
    </MealCanvas>
  );
}

const PIZZA_SUCUK: readonly [number, number, number][] = [
  [32, 36, 6.5],
  [56, 33, 6],
  [71, 40, 4.5],
  [45, 55, 6.5],
  [53, 73, 4.5],
];

/** Pizza: one slice with crust, melted cheese and sucuk rounds. */
function Pizza({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['kasar', 'crust', 'red']} shadowWidth={20}>
      {(fill) => (
        <>
          <Path
            d="M14 24 L86 24 L52 86 Z"
            fill={fill('kasar')}
            stroke={fill('kasar')}
            strokeWidth={8}
            strokeLinejoin="round"
          />
          {/* Cheese drips over the edges. */}
          <Path
            d="M26 44 C24 50 26 56 29 54 C31 52 30 48 30 46 Z M76 40 C78 46 76 52 73 50 C71 48 72 44 72 42 Z"
            fill={fill('kasar')}
          />
          <Path
            d="M10 24 C34 12 66 12 90 24"
            stroke={fill('crust')}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
          />
          {/* Sucuk rounds placed unevenly, so the slice never reads as a face. */}
          {PIZZA_SUCUK.map(([x, y, r]) => (
            <G key={`${x}-${y}`}>
              <Circle cx={x} cy={y} r={r} fill={fill('red')} />
              <Circle cx={x - r * 0.3} cy={y - r * 0.2} r={r * 0.18} fill={T.red.light} />
              <Circle cx={x + r * 0.35} cy={y + r * 0.3} r={r * 0.15} fill={T.red.light} />
            </G>
          ))}
          <Gloss cx={24} cy={17} rx={6} ry={2} rotate={-20} />
        </>
      )}
    </MealCanvas>
  );
}

/** Pasta: a birthday cake with three candles on a plate. */
function Cake({ size }: WordArtProps) {
  const candles: readonly [number, Tone][] = [
    [34, 'sky'],
    [50, 'lemon'],
    [66, 'mint'],
  ];
  return (
    <MealCanvas
      size={size}
      tones={['plate', 'pink', 'cream', 'sky', 'lemon', 'mint', 'orange']}
      shadowWidth={40}
    >
      {(fill) => (
        <>
          <Ellipse cx={50} cy={86} rx={42} ry={7} fill={fill('plate')} />
          <Path d="M16 52 L16 79 C16 90 84 90 84 79 L84 52 Z" fill={fill('pink')} />
          {/* Cream frosting dripping down the sides. */}
          <G fill={fill('cream')}>
            <Rect x={19} y={50} width={7} height={15} rx={3.5} />
            <Rect x={33} y={52} width={7} height={11} rx={3.5} />
            <Rect x={47} y={52} width={7} height={18} rx={3.5} />
            <Rect x={61} y={52} width={7} height={12} rx={3.5} />
            <Rect x={74} y={50} width={7} height={16} rx={3.5} />
          </G>
          <Ellipse cx={50} cy={52} rx={34} ry={9} fill={fill('cream')} />
          <G>
            <Rect x={28} y={74} width={4} height={2} rx={1} fill={T.sky.face} />
            <Rect x={40} y={79} width={4} height={2} rx={1} fill={T.lemon.face} />
            <Rect x={58} y={76} width={4} height={2} rx={1} fill={T.mint.face} />
            <Rect x={70} y={72} width={4} height={2} rx={1} fill={T.lemon.face} />
          </G>
          {candles.map(([x, tone]) => (
            <G key={x}>
              <Rect x={x - 3} y={30} width={6} height={22} rx={2} fill={fill(tone)} />
              <Path
                d={`M${x} 13 C${x + 5} 19 ${x + 5} 25 ${x} 26 C${x - 5} 25 ${x - 5} 19 ${x} 13 Z`}
                fill={fill('orange')}
              />
              <Ellipse cx={x} cy={22.5} rx={1.8} ry={2.6} fill={T.lemon.light} />
            </G>
          ))}
          <Gloss cx={26} cy={48} rx={6} ry={2} rotate={-12} />
          <Gloss cx={21} cy={74} rx={2} ry={6} rotate={0} opacity={0.35} />
        </>
      )}
    </MealCanvas>
  );
}

/** Kurabiye: a round cookie with chocolate chips and one bite taken. */
function Cookie({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['cookie', 'cocoa']} shadowWidth={32}>
      {(fill) => (
        <>
          <Path
            d="M63 27.6 A 35 35 0 1 0 82.9 45.4 A 8 8 0 0 1 73.5 37.5 A 8 8 0 0 1 63 27.6 Z"
            fill={fill('cookie')}
          />
          <G fill={fill('cocoa')}>
            <Ellipse cx={34} cy={44} rx={4} ry={3.2} />
            <Ellipse cx={54} cy={46} rx={3.4} ry={2.8} />
            <Ellipse cx={28} cy={64} rx={3.6} ry={3} />
            <Ellipse cx={46} cy={70} rx={4.2} ry={3.4} />
            <Ellipse cx={66} cy={62} rx={3.8} ry={3} />
            <Ellipse cx={58} cy={80} rx={3} ry={2.5} />
            <Ellipse cx={42} cy={55} rx={2.6} ry={2.2} />
            <Ellipse cx={74} cy={75} rx={2.6} ry={2.2} />
          </G>
          <Gloss cx={30} cy={36} rx={8} ry={3.5} rotate={-40} />
          <Circle cx={88} cy={36} r={2} fill={fill('cookie')} />
          <Circle cx={84} cy={28} r={1.4} fill={fill('cookie')} />
        </>
      )}
    </MealCanvas>
  );
}

/** Şeker: a striped sweet in a twisted wrapper. */
function Candy({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['pink', 'berry', 'cream']} shadowWidth={34}>
      {(fill, id) => (
        <>
          <Defs>
            <ClipPath id={`${id}-candy`}>
              <Ellipse cx={50} cy={58} rx={23} ry={19} />
            </ClipPath>
          </Defs>
          <Path
            d="M32 54 L10 38 C5 48 5 68 10 78 L32 62 Z M68 54 L90 38 C95 48 95 68 90 78 L68 62 Z"
            fill={fill('pink')}
            stroke={fill('pink')}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Path
            d="M12 50 L28 56 M12 66 L28 60 M88 50 L72 56 M88 66 L72 60"
            stroke={T.pink.shade}
            strokeOpacity={0.6}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <Ellipse cx={50} cy={58} rx={23} ry={19} fill={fill('berry')} />
          <G clipPath={`url(#${id}-candy)`}>
            <Path
              d="M30 36 L48 82 M44 36 L62 82 M58 36 L76 82"
              stroke={T.cream.face}
              strokeOpacity={0.9}
              strokeWidth={5}
            />
          </G>
          <Gloss cx={39} cy={47} rx={6} ry={3} rotate={-30} />
        </>
      )}
    </MealCanvas>
  );
}

/** Dondurma: strawberry and chocolate scoops on a waffle cone. */
function IceCream({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['tan', 'pink', 'cocoa', 'red']} shadowWidth={14}>
      {(fill, id) => (
        <>
          <Defs>
            <ClipPath id={`${id}-cone`}>
              <Path d="M29 54 L71 54 L52 91 C51 93 49 93 48 91 Z" />
            </ClipPath>
          </Defs>
          <Path d="M29 54 L71 54 L52 91 C51 93 49 93 48 91 Z" fill={fill('tan')} />
          <G clipPath={`url(#${id}-cone)`}>
            <Path
              d="M24 60 L56 92 M34 54 L70 90 M48 54 L78 84 M76 60 L44 92 M66 54 L30 90 M52 54 L22 84"
              stroke={T.tan.shade}
              strokeOpacity={0.6}
              strokeWidth={1.6}
            />
          </G>
          <Circle cx={50} cy={46} r={21} fill={fill('pink')} />
          {[32, 41, 50, 59, 68].map((x) => (
            <Circle key={x} cx={x} cy={57} r={5.5} fill={fill('pink')} />
          ))}
          <Circle cx={50} cy={26} r={16} fill={fill('cocoa')} />
          {[38, 46, 54, 62].map((x) => (
            <Circle key={x} cx={x} cy={35} r={4.5} fill={fill('cocoa')} />
          ))}
          <Path
            d="M52 8 C54 4 58 2 61 3"
            stroke={T.brown.face}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={51} cy={11} r={5} fill={fill('red')} />
          <Gloss cx={38} cy={38} rx={5} ry={2.5} rotate={-35} />
          <Gloss cx={42} cy={19} rx={4} ry={2} rotate={-35} />
          <Gloss cx={49} cy={9.5} rx={1.6} ry={1} rotate={-30} />
        </>
      )}
    </MealCanvas>
  );
}

/** Çikolata: a bar in a red wrapper with foil, squares showing on top. */
function Chocolate({ size }: WordArtProps) {
  const squares: readonly [number, number][] = [
    [30, 16],
    [52, 16],
    [30, 32],
    [52, 32],
  ];
  return (
    <MealCanvas size={size} tones={['cocoa', 'red', 'grey', 'lemon']} shadowWidth={28}>
      {(fill) => (
        <G transform="rotate(-10 50 54)">
          <Rect x={26} y={12} width={48} height={60} rx={6} fill={fill('cocoa')} />
          {squares.map(([x, y]) => (
            <G key={`${x}-${y}`}>
              <Rect
                x={x}
                y={y}
                width={18}
                height={13}
                rx={3}
                fill={mealTones.cocoa.shade}
                opacity={0.5}
              />
              <Rect
                x={x}
                y={y}
                width={16.5}
                height={11.5}
                rx={3}
                fill={mealTones.cocoa.light}
                opacity={0.45}
              />
            </G>
          ))}
          <Path
            d="M24 52 L30 47 L36 52 L42 47 L48 52 L54 47 L60 52 L66 47 L72 52 L76 48 L76 56 L24 56 Z"
            fill={fill('grey')}
          />
          <Rect x={23} y={52} width={54} height={40} rx={6} fill={fill('red')} />
          <Rect x={23} y={64} width={54} height={8} fill={T.lemon.face} />
          <Gloss cx={32} cy={20} rx={2} ry={6} rotate={0} />
          <Gloss cx={30} cy={80} rx={2} ry={6} rotate={0} opacity={0.4} />
        </G>
      )}
    </MealCanvas>
  );
}

/** Bal: an open jar of honey, a wooden honey dipper dripping into it. */
function Honey({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['honey', 'glass', 'brown', 'cream']} shadowWidth={32}>
      {(fill) => (
        <>
          <Path
            d="M16 46 C16 40 20 38 24 38 L64 38 C68 38 72 40 72 46 L72 82 C72 88 68 91 62 91 L26 91 C20 91 16 88 16 82 Z"
            fill={fill('honey')}
          />
          <Rect x={18} y={30} width={52} height={10} rx={4} fill={fill('glass')} />
          {/* Honey running down from the rim. */}
          <Path
            d="M22 38 L40 38 L40 48 C40 52 35 52 35 48 L35 44 C35 42 31 42 31 45 L31 52 C31 56 25 56 25 52 L25 44 C25 41 22 41 22 38 Z"
            fill={fill('honey')}
          />
          <Path
            d="M44 64 L50.5 60.5 L57 64 L57 71 L50.5 74.5 L44 71 Z"
            fill={fill('cream')}
            stroke={fill('cream')}
            strokeWidth={9}
            strokeLinejoin="round"
          />
          <Path
            d="M46.5 65.5 L50.5 63.3 L54.5 65.5 L54.5 69.8 L50.5 72 L46.5 69.8 Z"
            fill={mealTones.honey.face}
          />
          {/* Dipper resting over the jar: handle up-right, grooved head dripping. */}
          <Path d="M54 20 L90 4" stroke={fill('brown')} strokeWidth={4} strokeLinecap="round" />
          <G transform="rotate(-24 44 24)">
            <Ellipse cx={44} cy={24} rx={12} ry={6} fill={fill('honey')} />
            {[36, 44, 52].map((x) => (
              <Ellipse key={x} cx={x} cy={24} rx={3} ry={8.5} fill={fill('honey')} />
            ))}
          </G>
          <Path
            d="M42 30 C42 27 46 27 46 30 L45.5 40 C45.5 42 42.5 42 42.5 40 Z"
            fill={fill('honey')}
          />
          <Gloss cx={24} cy={62} rx={2.5} ry={10} rotate={0} />
          <Gloss cx={24} cy={33} rx={3} ry={1.4} rotate={0} />
        </>
      )}
    </MealCanvas>
  );
}

/** Yoğurt: a clay bowl (çanak) of white yogurt with a spoon. */
function Yogurt({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['terracotta', 'cream', 'grey']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path d="M66 44 L86 14" stroke={fill('grey')} strokeWidth={5} strokeLinecap="round" />
          <Path d={BOWL} fill={fill('terracotta')} />
          <Ellipse cx={50} cy={50} rx={42} ry={9.5} fill={fill('cream')} />
          <Path
            d="M26 50 C28 40 40 33 50 35 C61 33 72 41 74 50 C62 55 38 55 26 50 Z"
            fill={fill('cream')}
          />
          <Path
            d="M38 46 C42 40 52 38 58 42 C62 45 58 49 52 48"
            stroke={T.cream.shade}
            strokeOpacity={0.9}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Ellipse
            cx={50}
            cy={50}
            rx={42}
            ry={9.5}
            fill="none"
            stroke={T.terracotta.light}
            strokeWidth={2}
          />
          <Gloss cx={20} cy={64} rx={4} ry={9} rotate={20} />
          <Gloss cx={40} cy={38} rx={4} ry={1.6} rotate={-20} />
        </>
      )}
    </MealCanvas>
  );
}

/** Tereyağı: a pale yellow block with a curl on top, on a small plate. */
function Butter({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['plate', 'butter', 'butterTop']} shadowWidth={40}>
      {(fill) => (
        <>
          <Plate fill={fill} cy={80} />
          <Path
            d="M68 56 L82 43 L82 66 L68 79 Z"
            fill={mealTones.butter.shade}
            stroke={mealTones.butter.shade}
            strokeWidth={5}
            strokeLinejoin="round"
          />
          <Path
            d="M19 56 L68 56 L68 79 L19 79 Z"
            fill={fill('butter')}
            stroke={fill('butter')}
            strokeWidth={5}
            strokeLinejoin="round"
          />
          <Path
            d="M19 56 L33 43 L82 43 L68 56 Z"
            fill={fill('butterTop')}
            stroke={fill('butterTop')}
            strokeWidth={5}
            strokeLinejoin="round"
          />
          {/* A curl scraped off the top. */}
          <Path
            d="M38 50 C36 42 48 38 54 42 C58 45 56 50 52 50 C54 46 46 44 44 49 Z"
            fill={fill('butter')}
          />
          <Gloss cx={28} cy={64} rx={2} ry={6} rotate={0} />
        </>
      )}
    </MealCanvas>
  );
}

/** Reçel: a jar of red jam under a dotted cloth, a strawberry in front. */
function Jam({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['jam', 'glass', 'cream', 'red', 'leaf']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path
            d="M12 48 C12 42 16 40 20 40 L60 40 C64 40 68 42 68 48 L68 82 C68 88 64 91 58 91 L22 91 C16 91 12 88 12 82 Z"
            fill={fill('jam')}
          />
          {/* Cloth tied over the lid. */}
          <Path
            d="M12 30 C12 14 68 14 68 30 L72 44 C68 47 66 43 62 45 C58 48 54 44 50 46 C46 48 42 44 38 46 C34 48 30 44 26 46 C22 48 18 45 8 44 Z"
            fill={fill('cream')}
          />
          <G fill={T.red.face} opacity={0.8}>
            <Circle cx={28} cy={24} r={2} />
            <Circle cx={40} cy={21} r={2} />
            <Circle cx={52} cy={22} r={2} />
            <Circle cx={22} cy={34} r={2} />
            <Circle cx={34} cy={32} r={2} />
            <Circle cx={46} cy={32} r={2} />
            <Circle cx={58} cy={32} r={2} />
            <Circle cx={64} cy={40} r={1.6} />
            <Circle cx={16} cy={41} r={1.6} />
          </G>
          <Path
            d="M11 37 C30 41 52 41 70 37"
            stroke={T.red.shade}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={20} cy={64} rx={2.5} ry={10} rotate={0} />
          {/* Strawberry in front, so jam is not just "a red jar". */}
          <Path
            d="M78 92 C69 88 63 79 65 71 C67 65 73 64 78 67 C83 64 89 65 91 71 C93 79 87 88 78 92 Z"
            fill={fill('red')}
          />
          <G fill={T.lemon.light}>
            <Ellipse cx={72} cy={75} rx={0.9} ry={1.3} />
            <Ellipse cx={80} cy={74} rx={0.9} ry={1.3} />
            <Ellipse cx={86} cy={77} rx={0.9} ry={1.3} />
            <Ellipse cx={75} cy={83} rx={0.9} ry={1.3} />
            <Ellipse cx={82} cy={84} rx={0.9} ry={1.3} />
          </G>
          <Path
            d="M78 67 L70 62 L76 63 L78 58 L80 63 L86 62 Z"
            fill={fill('leaf')}
            stroke={fill('leaf')}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Gloss cx={71} cy={71} rx={2.5} ry={1.4} rotate={-30} />
        </>
      )}
    </MealCanvas>
  );
}

/** Zeytin: one black and one green olive on a small olive sprig. */
function Olive({ size }: WordArtProps) {
  return (
    <MealCanvas
      size={size}
      tones={['blackOlive', 'greenOlive', 'oliveLeaf', 'brown']}
      shadowWidth={32}
    >
      {(fill) => (
        <>
          <Path
            d="M50 30 C50 24 52 18 56 14"
            stroke={fill('brown')}
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M55 16 C62 6 80 6 88 10 C80 18 64 20 55 16 Z" fill={fill('oliveLeaf')} />
          <Path d="M53 20 C44 10 28 10 20 14 C28 22 44 24 53 20 Z" fill={fill('oliveLeaf')} />
          <Ellipse
            cx={64}
            cy={64}
            rx={19}
            ry={24}
            fill={fill('greenOlive')}
            transform="rotate(16 64 64)"
          />
          <Ellipse
            cx={37}
            cy={60}
            rx={19}
            ry={25}
            fill={fill('blackOlive')}
            transform="rotate(-14 37 60)"
          />
          <Gloss cx={29} cy={46} rx={4} ry={8} rotate={10} />
          <Gloss cx={60} cy={50} rx={3} ry={6} rotate={20} opacity={0.5} />
        </>
      )}
    </MealCanvas>
  );
}

const POPCORN_PUFFS: readonly [number, number][] = [
  [28, 40],
  [40, 34],
  [52, 30],
  [64, 34],
  [74, 40],
  [34, 24],
  [48, 18],
  [62, 22],
  [22, 34],
  [78, 30],
];

/** Patlamış mısır: a striped box overflowing with popcorn. */
function Popcorn({ size }: WordArtProps) {
  return (
    <MealCanvas size={size} tones={['butter', 'red', 'cream']} shadowWidth={26}>
      {(fill, id) => (
        <>
          <Defs>
            <ClipPath id={`${id}-box`}>
              <Path d="M18 44 L82 44 L73 91 L27 91 Z" />
            </ClipPath>
          </Defs>
          {POPCORN_PUFFS.map(([x, y]) => (
            <G key={`${x}-${y}`}>
              <Circle cx={x - 4} cy={y + 2} r={6} fill={fill('butter')} />
              <Circle cx={x + 4} cy={y + 2} r={6} fill={fill('butter')} />
              <Circle cx={x} cy={y - 3} r={6.5} fill={fill('butter')} />
              <Circle cx={x + 1} cy={y + 1} r={1.6} fill={T.lemon.face} opacity={0.8} />
            </G>
          ))}
          <Path d="M18 44 L82 44 L73 91 L27 91 Z" fill={fill('cream')} />
          <G clipPath={`url(#${id}-box)`}>
            {[22, 42, 62].map((x) => (
              <Path
                key={x}
                d={`M${x} 44 L${x + 10} 44 L${x + 8.5 + (x - 50) * -0.05} 92 L${x + 2 + (x - 50) * -0.12} 92 Z`}
                fill={fill('red')}
              />
            ))}
          </G>
          <Rect x={15} y={41} width={70} height={7} rx={3.5} fill={fill('red')} />
          <Gloss cx={34} cy={30} rx={3} ry={1.6} rotate={-30} />
          <Gloss cx={25} cy={60} rx={1.8} ry={7} rotate={-8} opacity={0.45} />
        </>
      )}
    </MealCanvas>
  );
}

export const mealArt = {
  'food.bread': Bread,
  'food.cheese': Cheese,
  'food.egg': Egg,
  'food.rice': Rice,
  'food.pasta': Pasta,
  'food.soup': Soup,
  'food.meat': Meat,
  'food.salad': Salad,
  'food.sandwich': Sandwich,
  'food.pizza': Pizza,
  'food.cake': Cake,
  'food.cookie': Cookie,
  'food.candy': Candy,
  'food.ice_cream': IceCream,
  'food.chocolate': Chocolate,
  'food.honey': Honey,
  'food.yogurt': Yogurt,
  'food.butter': Butter,
  'food.jam': Jam,
  'food.olive': Olive,
  'food.popcorn': Popcorn,
} satisfies WordArtMap;
