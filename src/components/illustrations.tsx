import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { useTheme } from '@/theme';

// Clay illustrations: light from the top left, a soft shadow underneath, chubby
// shapes. All colours come from the theme. Gradient ids only need to be unique
// within one <Svg>.

type Tone = { face: string; shade: string };

function useTones() {
  const { colors } = useTheme();
  return {
    // Light in every theme, unlike `surface`, which is dark in the dark theme.
    highlight: colors.onSurfaceInverse,
    shadow: colors.text,
    berry: { face: colors.accent, shade: colors.accentShade },
    mint: { face: colors.correct, shade: colors.correctShade },
    lemon: { face: colors.reward, shade: colors.rewardShade },
    sky: { face: colors.info, shade: colors.infoShade },
  };
}

function ClayGradient({ id, tone }: { id: string; tone: Tone }) {
  return (
    <RadialGradient id={id} cx="35%" cy="30%" r="80%">
      <Stop offset="0.45" stopColor={tone.face} />
      <Stop offset="1" stopColor={tone.shade} />
    </RadialGradient>
  );
}

/** The river running through the first screen, carrying letters of both languages. */
export function RiverHero() {
  const { text, colors } = useTheme();
  const tones = useTones();
  const stones = [
    { id: 'lemon', cx: 318, cy: 74, r: 42, tone: tones.lemon, letter: 'ş' },
    { id: 'berry', cx: 214, cy: 146, r: 34, tone: tones.berry, letter: 'a' },
    { id: 'sky', cx: 96, cy: 188, r: 28, tone: tones.sky, letter: 'ğ' },
  ];
  return (
    <Svg width="100%" height={250} viewBox="0 0 390 250" accessible={false}>
      <Defs>
        <LinearGradient id="river" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={tones.mint.face} />
          <Stop offset="1" stopColor={tones.mint.shade} />
        </LinearGradient>
        {stones.map((s) => (
          <ClayGradient key={s.id} id={s.id} tone={s.tone} />
        ))}
      </Defs>
      <Path
        d="M390 0 C 330 60 300 90 230 110 C 150 132 150 170 70 176 C 40 178 15 190 0 214 L 0 250 C 40 226 70 224 110 220 C 190 212 210 176 270 158 C 330 140 370 110 390 80 Z"
        fill="url(#river)"
      />
      <Path
        d="M340 62 C 300 100 262 116 222 128 C 170 144 150 176 92 190"
        fill="none"
        stroke={tones.highlight}
        strokeOpacity={0.45}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {stones.map((s) => (
        <G key={s.id}>
          <Ellipse
            cx={s.cx}
            cy={s.cy + s.r * 0.95}
            rx={s.r * 0.8}
            ry={s.r * 0.2}
            fill={tones.shadow}
            opacity={0.15}
          />
          <Circle cx={s.cx} cy={s.cy} r={s.r} fill={`url(#${s.id})`} />
          <Ellipse
            cx={s.cx - s.r * 0.36}
            cy={s.cy - s.r * 0.46}
            rx={s.r * 0.24}
            ry={s.r * 0.16}
            fill={tones.highlight}
            opacity={0.7}
          />
          <SvgText
            x={s.cx}
            y={s.cy + s.r * 0.36}
            fontFamily={text.title.fontFamily}
            fontSize={s.r * 1.05}
            textAnchor="middle"
            fill={colors.text}
          >
            {s.letter}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

const ART_SIZE = 76;

/** Ages 2–7: chubby toy blocks and a ball. */
export function MiniArt() {
  const tones = useTones();
  return (
    <Svg width={ART_SIZE} height={ART_SIZE} viewBox="0 0 76 76" accessible={false}>
      <Defs>
        <ClayGradient id="a" tone={tones.sky} />
        <ClayGradient id="b" tone={tones.berry} />
        <ClayGradient id="c" tone={tones.lemon} />
      </Defs>
      <Ellipse cx={38} cy={70} rx={30} ry={4} fill={tones.shadow} opacity={0.15} />
      <Rect x={8} y={40} width={30} height={30} rx={9} fill="url(#a)" />
      <Rect x={22} y={10} width={30} height={30} rx={9} fill="url(#b)" />
      <Circle cx={54} cy={56} r={14} fill="url(#c)" />
      <Ellipse cx={32} cy={18} rx={6} ry={3.5} fill={tones.highlight} opacity={0.7} />
      <Ellipse cx={49} cy={49} rx={4} ry={2.5} fill={tones.highlight} opacity={0.7} />
    </Svg>
  );
}

/** Ages 7–12: a kite on the wind. */
export function KidArt() {
  const tones = useTones();
  return (
    <Svg width={ART_SIZE} height={ART_SIZE} viewBox="0 0 76 76" accessible={false}>
      <Defs>
        <ClayGradient id="a" tone={tones.mint} />
      </Defs>
      <Path
        d="M40 46 C 30 54 44 58 34 66 C 30 69 26 70 20 70"
        fill="none"
        stroke={tones.berry.face}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <Path
        d="M42 6 C 44 5 46 6 47 7 L 66 26 C 68 28 68 30 66 32 L 44 48 C 42 50 39 49 38 47 L 26 22 C 25 20 26 17 28 16 Z"
        fill="url(#a)"
      />
      <Path d="M42 8 L 42 47 M 27 20 L 66 28" stroke={tones.mint.shade} strokeWidth={2.5} />
      <Ellipse cx={37} cy={17} rx={6} ry={3} fill={tones.highlight} opacity={0.7} />
    </Svg>
  );
}

/** Adults: an open book. */
export function AdultArt() {
  const tones = useTones();
  return (
    <Svg width={ART_SIZE} height={ART_SIZE} viewBox="0 0 76 76" accessible={false}>
      <Defs>
        <ClayGradient id="a" tone={tones.berry} />
      </Defs>
      <Ellipse cx={38} cy={66} rx={32} ry={4} fill={tones.shadow} opacity={0.15} />
      <Path
        d="M38 22 C 30 14 16 12 6 15 C 4 16 3 17 3 19 L 3 54 C 3 57 5 58 7 58 C 18 55 30 57 38 64 C 46 57 58 55 69 58 C 71 58 73 57 73 54 L 73 19 C 73 17 72 16 70 15 C 60 12 46 14 38 22 Z"
        fill="url(#a)"
      />
      <Path
        d="M38 22 C 30 15 18 14 9 16 L 9 51 C 20 49 31 51 38 57 C 45 51 56 49 67 51 L 67 16 C 58 14 46 15 38 22 Z"
        fill={tones.highlight}
      />
      <Path
        d="M38 22 L 38 57 M 15 25 C 21 24 27 25 32 28 M 15 34 C 21 33 27 34 32 37 M 61 25 C 55 24 49 25 44 28 M 61 34 C 55 33 49 34 44 37"
        fill="none"
        stroke={tones.berry.shade}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const METER_LEVELS = 4;

/** Rising bars: how much of the language the option stands for. */
export function LevelMeter({ filled }: { filled: number }) {
  const { colors, radii } = useTheme();
  const radius = Math.min(radii.sm, 3);
  return (
    <Svg width={44} height={40} viewBox="0 0 44 40" accessible={false}>
      {Array.from({ length: METER_LEVELS }, (_, i) => {
        const height = 13 + i * 9;
        return (
          <Rect
            key={i}
            x={i * 11 + 1}
            y={40 - height}
            width={8}
            height={height}
            rx={radius}
            fill={i < filled ? colors.accentText : colors.border}
          />
        );
      })}
    </Svg>
  );
}

/** Check mark next to the selected option. */
export function CheckMark() {
  const { colors } = useTheme();
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" accessible={false}>
      <Circle cx={16} cy={16} r={15} fill={colors.accentText} />
      <Path
        d="M9 17 L 14 22 L 23 11"
        fill="none"
        stroke={colors.onAccent}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Speaker symbol for the read-aloud button. */
export function SpeakerIcon() {
  const { colors } = useTheme();
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" accessible={false}>
      <Path
        d="M4 11 C 4 10 5 9 6 9 L 10 9 L 15 4 C 16 3 17 4 17 5 L 17 23 C 17 24 16 25 15 24 L 10 19 L 6 19 C 5 19 4 18 4 17 Z"
        fill={colors.onInfo}
      />
      <Path
        d="M21 10 C 23 12 23 16 21 18"
        fill="none"
        stroke={colors.onInfo}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Mark on an answered option: a tick for right, a soft cross for a wrong pick. */
export function AnswerMark({ kind }: { kind: 'right' | 'wrong' }) {
  const { colors } = useTheme();
  const ink = kind === 'right' ? colors.onCorrect : colors.onIncorrect;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" accessible={false}>
      <Path
        d={kind === 'right' ? 'M5 13 L 10 18 L 19 7' : 'M7 7 L 17 17 M 17 7 L 7 17'}
        fill="none"
        stroke={ink}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Cross for leaving a game. */
export function CloseIcon() {
  const { colors } = useTheme();
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" accessible={false}>
      <Path
        d="M4 4 L 16 16 M 16 4 L 4 16"
        fill="none"
        stroke={colors.text}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Clay gem, the reward currency. */
export function GemIcon() {
  const tones = useTones();
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" accessible={false}>
      <Defs>
        <ClayGradient id="gem" tone={tones.lemon} />
      </Defs>
      <Circle cx={14} cy={14} r={13} fill="url(#gem)" />
      <Ellipse cx={10} cy={9} rx={4} ry={2.5} fill={tones.highlight} opacity={0.7} />
    </Svg>
  );
}

/** Clay medal for the level result. */
export function LevelMedal() {
  const tones = useTones();
  return (
    <Svg width={132} height={148} viewBox="0 0 132 148" accessible={false}>
      <Defs>
        <ClayGradient id="medal" tone={tones.lemon} />
      </Defs>
      <Path d="M44 6 L 66 52 L 42 60 L 22 18 Z" fill={tones.berry.face} />
      <Path d="M88 6 L 66 52 L 90 60 L 110 18 Z" fill={tones.sky.face} />
      <Ellipse cx={66} cy={141} rx={42} ry={6} fill={tones.shadow} opacity={0.15} />
      <Circle cx={66} cy={88} r={50} fill="url(#medal)" />
      <Circle cx={66} cy={88} r={37} fill={tones.lemon.shade} opacity={0.35} />
      <Path
        d="M66 62 L 74 79 L 92 81 L 79 94 L 83 112 L 66 103 L 49 112 L 53 94 L 40 81 L 58 79 Z"
        fill={tones.highlight}
        stroke={tones.highlight}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <Ellipse cx={42} cy={58} rx={11} ry={6} fill={tones.highlight} opacity={0.7} />
    </Svg>
  );
}

/** Soft glow behind every screen. */
export function ScreenGlow() {
  const { colors } = useTheme();
  return (
    <Svg width="100%" height="100%" accessible={false}>
      <Defs>
        <RadialGradient id="glow" cx="20%" cy="10%" r="100%">
          <Stop offset="0.3" stopColor={colors.background} />
          <Stop offset="1" stopColor={colors.backgroundAlt} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#glow)" />
    </Svg>
  );
}
