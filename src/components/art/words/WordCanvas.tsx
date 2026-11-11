import type { ComponentType, ReactNode } from 'react';

import type { ArtToneName } from '@/theme/artPalette';

import { ClayCanvas, type ClayFill } from '../clay';

/** Every word picture is drawn in this box; the object stands on GROUND_Y. */
export const WORD_BOX = { width: 100, height: 100 } as const;
export const GROUND_Y = 92;

/** Default rendered size in dp (2–7 answer cards are ~150 dp wide). */
export const WORD_ART_SIZE = 120;

export type WordArtProps = { size?: number };
export type WordArtComponent = ComponentType<WordArtProps>;
/** Image id of a concept (`concept.image`) → its picture. */
export type WordArtMap = Readonly<Record<string, WordArtComponent>>;

type Props = {
  size?: number;
  tones: readonly ArtToneName[];
  /** Half width of the contact shadow; things that hover (sun, fish) get a smaller one. */
  shadowWidth?: number;
  children: (fill: ClayFill) => ReactNode;
};

/** Square canvas with the shared ground shadow, so all pictures sit alike on their cards. */
export function WordCanvas({ size = WORD_ART_SIZE, tones, shadowWidth = 32, children }: Props) {
  return (
    <ClayCanvas
      box={WORD_BOX}
      height={size}
      tones={tones}
      shadow={{ cx: 50, cy: GROUND_Y + 2, rx: shadowWidth, ry: 4.5 }}
    >
      {children}
    </ClayCanvas>
  );
}
