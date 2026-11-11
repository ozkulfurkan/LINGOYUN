import { Circle, G, Path, Rect } from 'react-native-svg';

import { type ClayFill, Gloss } from '../clay';
import { WordCanvas, type WordArtMap, type WordArtProps } from './WordCanvas';

function Wheel({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: ClayFill }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={fill('charcoal')} />
      <Circle cx={cx} cy={cy} r={r * 0.42} fill={fill('cream')} />
    </G>
  );
}

/** Chubby little car from the side, driving right. */
function Car({ size }: WordArtProps) {
  return (
    <WordCanvas
      size={size}
      tones={['sky', 'glass', 'charcoal', 'cream', 'lemon', 'berry']}
      shadowWidth={40}
    >
      {(fill) => (
        <>
          <Path d="M26 50 C28 30 36 24 50 24 C64 24 70 30 76 50 Z" fill={fill('sky')} />
          <Rect x={8} y={46} width={84} height={32} rx={14} fill={fill('sky')} />
          <Path d="M32 47 C33 35 38 31 47 31 L47 47 Z" fill={fill('glass')} />
          <Path d="M53 47 L53 31 C61 31 66 35 69 47 Z" fill={fill('glass')} />
          <Rect x={86} y={54} width={7} height={7} rx={3.5} fill={fill('lemon')} />
          <Rect x={7} y={54} width={5} height={7} rx={2.5} fill={fill('berry')} />
          <Rect x={54} y={56} width={8} height={3} rx={1.5} fill={fill('cream')} />
          <Wheel cx={29} cy={78} r={12} fill={fill} />
          <Wheel cx={71} cy={78} r={12} fill={fill} />
          <Gloss cx={40} cy={28} rx={7} ry={2.8} rotate={-12} />
          <Gloss cx={20} cy={52} rx={8} ry={3} rotate={-8} />
        </>
      )}
    </WordCanvas>
  );
}

/** Yellow bus from the side, driving right: a row of windows and a door. */
function Bus({ size }: WordArtProps) {
  return (
    <WordCanvas
      size={size}
      tones={['lemon', 'glass', 'charcoal', 'cream', 'berry', 'orange']}
      shadowWidth={42}
    >
      {(fill) => (
        <>
          <Rect x={6} y={22} width={88} height={58} rx={14} fill={fill('lemon')} />
          {[12, 30, 48].map((x) => (
            <Rect key={x} x={x} y={30} width={14} height={18} rx={4} fill={fill('glass')} />
          ))}
          <Rect x={70} y={30} width={18} height={40} rx={4} fill={fill('glass')} />
          <Rect x={78.2} y={31} width={1.6} height={38} fill={fill('cream')} />
          <Rect x={6} y={56} width={64} height={7} fill={fill('orange')} />
          <Rect x={88} y={64} width={6} height={7} rx={3} fill={fill('cream')} />
          <Wheel cx={24} cy={80} r={11} fill={fill} />
          <Wheel cx={70} cy={80} r={11} fill={fill} />
          <Gloss cx={22} cy={25} rx={10} ry={2.6} rotate={-4} />
        </>
      )}
    </WordCanvas>
  );
}

export const vehicleArt = {
  'vehicle.car': Car,
  'vehicle.bus': Bus,
} satisfies WordArtMap;
