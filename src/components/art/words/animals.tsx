import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { artPalette } from '@/theme/artPalette';

import { Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

const { ink, tongue, cheek, gloss } = artPalette;

/** Round dark eye with one white sparkle, the same on every animal. */
function Eye({ cx, cy, r = 3.6 }: { cx: number; cy: number; r?: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={ink} />
      <Circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.32} fill={gloss} />
    </G>
  );
}

function Cheeks({ y, dx, cx = 50 }: { y: number; dx: number; cx?: number }) {
  return (
    <G opacity={0.55}>
      <Ellipse cx={cx - dx} cy={y} rx={4} ry={2.6} fill={cheek} />
      <Ellipse cx={cx + dx} cy={y} rx={4} ry={2.6} fill={cheek} />
    </G>
  );
}

/** Sitting cat, front view: pointed ears, whiskers, curled tail. */
function Cat({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['ginger']}>
      {(fill) => (
        <>
          <Path
            d="M70 84 C86 84 92 70 86 60 C83 55 77 56 78 61"
            stroke={fill('ginger')}
            strokeWidth={8}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M50 48 C31 48 25 66 26 80 C27 89 33 92 40 92 L60 92 C67 92 73 89 74 80 C75 66 69 48 50 48 Z"
            fill={fill('ginger')}
          />
          <Ellipse cx={41} cy={89} rx={7} ry={4} fill={artPalette.tones.ginger.light} />
          <Ellipse cx={59} cy={89} rx={7} ry={4} fill={artPalette.tones.ginger.light} />
          {/* Ears first, then the head over their base. */}
          <Path d="M27 36 L25 13 C25 9 29 8 32 10 L46 24 Z" fill={fill('ginger')} />
          <Path d="M73 36 L75 13 C75 9 71 8 68 10 L54 24 Z" fill={fill('ginger')} />
          <Path d="M30 30 L29 17 L39 26 Z" fill={tongue} />
          <Path d="M70 30 L71 17 L61 26 Z" fill={tongue} />
          <Ellipse cx={50} cy={40} rx={26} ry={21} fill={fill('ginger')} />
          <Path
            d="M44 22 L45 28 M50 21 L50 28 M56 22 L55 28"
            stroke={artPalette.tones.ginger.shade}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <Eye cx={40} cy={40} />
          <Eye cx={60} cy={40} />
          <Path d="M47 46 L53 46 L50 49.5 Z" fill={tongue} strokeLinejoin="round" />
          <Path
            d="M50 49.5 C50 53 46 54 44 52 M50 49.5 C50 53 54 54 56 52"
            stroke={ink}
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M33 46 L20 44 M33 50 L21 52 M67 46 L80 44 M67 50 L79 52"
            stroke={ink}
            strokeWidth={1.2}
            strokeLinecap="round"
            opacity={0.5}
          />
          <Cheeks y={48} dx={15} />
          <Gloss cx={36} cy={28} rx={6} ry={3.5} />
        </>
      )}
    </WordCanvas>
  );
}

/** Sitting puppy, front view: long floppy ears, big nose, collar. */
function Dog({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['tan', 'brown', 'berry', 'lemon', 'cream']}>
      {(fill) => (
        <>
          <Path
            d="M72 78 C82 76 88 66 86 56"
            stroke={fill('tan')}
            strokeWidth={7}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M50 50 C32 50 26 66 27 80 C28 89 34 92 41 92 L59 92 C66 92 72 89 73 80 C74 66 68 50 50 50 Z"
            fill={fill('tan')}
          />
          <Ellipse cx={41} cy={89} rx={7} ry={4} fill={artPalette.tones.tan.light} />
          <Ellipse cx={59} cy={89} rx={7} ry={4} fill={artPalette.tones.tan.light} />
          <Path
            d="M36 59 C42 63 58 63 64 59"
            stroke={fill('berry')}
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={50} cy={64} r={3.5} fill={fill('lemon')} />
          <Ellipse cx={50} cy={38} rx={25} ry={22} fill={fill('tan')} />
          {/* Floppy ears hang beside the head. */}
          <Path d="M30 22 C18 22 13 38 16 52 C18 60 27 60 29 52 L33 30 Z" fill={fill('brown')} />
          <Path d="M70 22 C82 22 87 38 84 52 C82 60 73 60 71 52 L67 30 Z" fill={fill('brown')} />
          <Ellipse
            cx={60}
            cy={34}
            rx={7}
            ry={7.5}
            fill={artPalette.tones.brown.face}
            opacity={0.85}
          />
          <Ellipse cx={50} cy={49} rx={13} ry={9} fill={fill('cream')} />
          <Eye cx={41} cy={35} />
          <Eye cx={60} cy={35} />
          <Path d="M45 43 C45 40 55 40 55 43 C55 46 52 48 50 48 C48 48 45 46 45 43 Z" fill={ink} />
          <Path d="M50 48 L50 51" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M47 52 C47 58 53 58 53 52 Z" fill={tongue} />
          <Gloss cx={37} cy={24} rx={6} ry={3.5} />
        </>
      )}
    </WordCanvas>
  );
}

/** Elephant from the side: the trunk and big ear tell it apart at any size. */
function Elephant({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['grey', 'cream']} shadowWidth={36}>
      {(fill) => (
        <>
          <Path
            d="M87 52 C93 56 94 62 92 67"
            stroke={fill('grey')}
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          {/* Far legs are darker, near legs are clay. */}
          {[50, 78].map((x) => (
            <Rect
              key={x}
              x={x}
              y={62}
              width={11}
              height={30}
              rx={5.5}
              fill={artPalette.tones.grey.shade}
            />
          ))}
          {[36, 64].map((x) => (
            <Rect key={x} x={x} y={62} width={12} height={30} rx={6} fill={fill('grey')} />
          ))}
          <Ellipse cx={60} cy={56} rx={30} ry={24} fill={fill('grey')} />
          <Path
            d="M20 44 C8 56 8 74 14 80 C17 83 22 82 21 77"
            stroke={artPalette.tones.grey.face}
            strokeWidth={11}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={28} cy={44} r={19} fill={fill('grey')} />
          <Ellipse cx={42} cy={46} rx={12} ry={16} fill={fill('grey')} />
          <Ellipse
            cx={43}
            cy={48}
            rx={7}
            ry={10}
            fill={artPalette.tones.grey.shade}
            opacity={0.35}
          />
          <Path
            d="M20 57 C17 61 16 64 18 66"
            stroke={fill('cream')}
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
          <Eye cx={24} cy={40} r={3.2} />
          <Gloss cx={52} cy={40} rx={9} ry={4} />
          <Gloss cx={22} cy={31} rx={5} ry={3} />
        </>
      )}
    </WordCanvas>
  );
}

/** Goldfish facing left, with a fin on top and bubbles. */
function Fish({ size }: WordArtProps) {
  return (
    <WordCanvas size={size} tones={['orange', 'lemon', 'sky']} shadowWidth={26}>
      {(fill) => (
        <>
          <Path
            d="M70 52 L88 34 C92 30 96 33 94 38 L88 54 L94 70 C96 75 92 78 88 74 Z"
            fill={fill('lemon')}
          />
          <Path d="M32 38 C38 14 60 14 68 36 Z" fill={fill('lemon')} />
          <Path
            d="M12 54 C18 36 34 28 50 28 C66 28 76 40 76 54 C76 68 66 80 50 80 C34 80 18 72 12 54 Z"
            fill={fill('orange')}
          />
          <Path
            d="M44 37 C38 47 38 61 44 71"
            stroke={artPalette.tones.orange.shade}
            strokeOpacity={0.6}
            strokeWidth={2.6}
            strokeLinecap="round"
            fill="none"
          />
          <Path d="M38 58 C44 56 50 62 46 68 C42 68 38 64 38 58 Z" fill={fill('lemon')} />
          <Eye cx={29} cy={48} r={4.4} />
          <Path
            d="M14 58 C17 59 19 58 20 56"
            stroke={ink}
            strokeWidth={1.8}
            strokeLinecap="round"
            fill="none"
          />
          <Gloss cx={38} cy={38} rx={8} ry={3.5} />
          <Circle cx={10} cy={36} r={4} fill={fill('sky')} />
          <Circle cx={16} cy={24} r={2.6} fill={fill('sky')} />
        </>
      )}
    </WordCanvas>
  );
}

export const animalArt = {
  'animal.cat': Cat,
  'animal.dog': Dog,
  'animal.elephant': Elephant,
  'animal.fish': Fish,
} satisfies WordArtMap;
