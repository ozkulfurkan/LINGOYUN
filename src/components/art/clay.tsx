import { useId, type ReactNode } from 'react';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { artPalette, type ArtToneName, type ClayTone } from '@/theme/artPalette';

// Building blocks of the clay ("Oyun Hamuru") drawings: every shape is a
// radial gradient lit from the top left, gets a soft gloss there and sits on a
// soft contact shadow. Word pictures and characters are drawn only with these,
// so a new picture looks like it belongs to the same set.

/** Fill value for a clay tone of the current canvas, e.g. `fill('red')`. */
export type ClayFill = (tone: ArtToneName) => string;

/** One radial gradient per tone; the light spot is at the top left of each shape. */
export function ClayGradient({ id, tone }: { id: string; tone: ClayTone }) {
  return (
    <RadialGradient id={id} cx="35%" cy="30%" r="75%">
      <Stop offset="0" stopColor={tone.light} />
      <Stop offset="0.5" stopColor={tone.face} />
      <Stop offset="1" stopColor={tone.shade} />
    </RadialGradient>
  );
}

/** Soft shadow where a picture touches the ground. */
export function ClayShadow({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <Ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={artPalette.shadow}
      opacity={artPalette.shadowOpacity}
    />
  );
}

/** White gloss on the lit (top-left) side of a shape. */
export function Gloss({
  cx,
  cy,
  rx,
  ry,
  rotate = -25,
  opacity = artPalette.glossOpacity,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <Ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={artPalette.gloss}
      opacity={opacity}
      transform={`rotate(${rotate} ${cx} ${cy})`}
    />
  );
}

type CanvasProps = {
  /** Width and height of the viewBox. */
  box: { width: number; height: number };
  /** Rendered height in dp; the width follows the box ratio. */
  height: number;
  /** Show only this part of the box (e.g. a character's head); defaults to the whole box. */
  crop?: { x: number; y: number; width: number; height: number };
  /** Tones used on this canvas; each becomes one gradient. */
  tones: readonly ArtToneName[];
  /** Contact shadow, in viewBox units. */
  shadow?: { cx: number; cy: number; rx: number; ry: number };
  children: (fill: ClayFill) => ReactNode;
};

/**
 * An <Svg> with gradients for the given tones. Gradient ids get a per-instance
 * prefix: harmless on native (ids are scoped per <Svg>) but needed on the web
 * and in previews, where all ids share one document.
 */
export function ClayCanvas({ box, height, crop, tones, shadow, children }: CanvasProps) {
  const prefix = `c${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const fill: ClayFill = (tone) => `url(#${prefix}-${tone})`;
  const view = crop ?? { x: 0, y: 0, ...box };
  return (
    <Svg
      width={(height * view.width) / view.height}
      height={height}
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      accessible={false}
    >
      <Defs>
        {tones.map((tone) => (
          <ClayGradient key={tone} id={`${prefix}-${tone}`} tone={artPalette.tones[tone]} />
        ))}
      </Defs>
      {shadow ? <ClayShadow {...shadow} /> : null}
      {children(fill)}
    </Svg>
  );
}
