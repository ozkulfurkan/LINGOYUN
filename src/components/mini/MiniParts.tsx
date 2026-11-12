import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';

import { WordPicture } from '@/components/art/words/WordPicture';
import { CloseIcon } from '@/components/illustrations';
import { PressScale } from '@/components/PressScale';
import { artPalette } from '@/theme/artPalette';
import { dimmedOpacity, space, stroke, touchTarget, useTheme } from '@/theme';

import { ClayCanvas, Gloss } from '../art/clay';

/** Hold this long to leave a game: a stray tap must not end a child's session (kids-ux). */
export const EXIT_HOLD_MS = 700;

export type PictureState = 'idle' | 'right' | 'wrong' | 'hint';

type PictureCardProps = {
  image: string | undefined;
  /** Spoken by screen readers: the word in the UI language. */
  label: string;
  size: number;
  state?: PictureState;
  disabled?: boolean;
  onPress: () => void;
};

/**
 * A big clay card holding one word picture. Right shows mint with a thick
 * border, a miss goes soft and faded, the hint glows lemon: never colour alone
 * (border width and opacity change too).
 */
export function PictureCard({
  image,
  label,
  size,
  state = 'idle',
  disabled = false,
  onPress,
}: PictureCardProps) {
  const { colors, radii, elevation } = useTheme();
  const background =
    state === 'right' ? colors.correct : state === 'hint' ? colors.highlight : colors.surface;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: state === 'right' }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.card,
        {
          width: size,
          height: size,
          backgroundColor: background,
          borderColor: state === 'idle' || state === 'wrong' ? colors.border : colors.accentText,
          borderWidth: state === 'idle' || state === 'wrong' ? stroke.thin : stroke.thick,
          borderRadius: radii.lg,
          boxShadow:
            state === 'right' ? (elevation.correct ?? undefined) : (elevation.surface ?? undefined),
          opacity: state === 'wrong' ? dimmedOpacity : 1,
        },
      ]}
    >
      <WordPicture image={image} size={size * 0.8} />
    </PressScale>
  );
}

/** A woven clay basket; children drop the asked picture into it. */
export function Basket({ size, children }: { size: number; children?: ReactNode }) {
  const { t } = useTranslation();
  const height = size * 0.62;
  return (
    <View accessible accessibilityLabel={t('mini.basketLabel')} style={{ width: size, height }}>
      <ClayCanvas box={{ width: 100, height: 62 }} height={height} tones={['ginger', 'brown']}>
        {(fill) => (
          <G>
            <Ellipse
              cx={50}
              cy={58}
              rx={40}
              ry={3.5}
              fill={artPalette.shadow}
              opacity={artPalette.shadowOpacity}
            />
            <Path
              d="M14 22 C14 4 86 4 86 22"
              fill="none"
              stroke={artPalette.tones.brown.face}
              strokeWidth={5}
              strokeLinecap="round"
            />
            <Path
              d="M8 24 L92 24 L84 56 C84 58 82 59 80 59 L20 59 C18 59 16 58 16 56 Z"
              fill={fill('ginger')}
            />
            {[34, 44].map((y) => (
              <Path
                key={y}
                d={`M12 ${y} L88 ${y}`}
                stroke={artPalette.tones.ginger.shade}
                strokeWidth={2.2}
                opacity={0.6}
              />
            ))}
            {[28, 42, 58, 72].map((x) => (
              <Path
                key={x}
                d={`M${x} 26 L${x - 2} 57`}
                stroke={artPalette.tones.ginger.shade}
                strokeWidth={2.2}
                opacity={0.5}
              />
            ))}
            <Rect x={6} y={21} width={88} height={7} rx={3.5} fill={fill('brown')} />
            <Gloss cx={22} cy={30} rx={7} ry={3} opacity={0.4} />
          </G>
        )}
      </ClayCanvas>
      {children ? <View style={styles.inBasket}>{children}</View> : null}
    </View>
  );
}

type MemoryCardProps = {
  image: string | undefined;
  faceUp: boolean;
  matched: boolean;
  label: string;
  size: number;
  onPress: () => void;
};

/** A memory card: clay back with a star when face down, the picture when face up. */
export function MemoryCardView({ image, faceUp, matched, label, size, onPress }: MemoryCardProps) {
  const { colors, radii, elevation } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: matched, selected: faceUp }}
      disabled={matched}
      onPress={onPress}
      style={[
        styles.card,
        {
          width: size,
          height: size,
          backgroundColor: matched ? colors.correct : faceUp ? colors.surface : colors.info,
          borderColor: matched ? colors.accentText : colors.border,
          borderWidth: matched ? stroke.thick : stroke.thin,
          borderRadius: radii.md,
          boxShadow: elevation.surface ?? undefined,
        },
      ]}
    >
      {faceUp ? (
        <WordPicture image={image} size={size * 0.8} />
      ) : (
        <Svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" accessible={false}>
          <Path
            d="M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z"
            fill={colors.onInfo}
            opacity={0.85}
          />
        </Svg>
      )}
    </PressScale>
  );
}

/** Leaves the game only when held: one tap does nothing (kids-ux: no accidental exits). */
export function HoldToExit({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  const { colors, radii } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={t('mini.exit')}
      accessibilityHint={t('mini.exitHint')}
      delayLongPress={EXIT_HOLD_MS}
      onLongPress={onExit}
      style={[
        styles.exit,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.sm },
      ]}
    >
      <CloseIcon />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: touchTarget.mini,
    minHeight: touchTarget.mini,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inBasket: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -space.lg,
    alignItems: 'center',
  },
  exit: {
    width: touchTarget.kid,
    height: touchTarget.kid,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
  },
});
