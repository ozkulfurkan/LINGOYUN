import type { ComponentType, ReactNode } from 'react';

export type CharacterId = 'zeynep' | 'nehir' | 'kerem';

/**
 * Facial expression. `sad` is a soft, sympathetic face (e.g. "the lights went
 * out" in a story); docs/characters.md: after a wrong answer a character
 * encourages and never looks sad.
 */
export type Expression = 'idle' | 'happy' | 'sad' | 'talking';
export const EXPRESSIONS: readonly Expression[] = ['idle', 'happy', 'sad', 'talking'];

/**
 * Separately drawn groups, so motion can be added later without redrawing:
 * - `figure`: everything (jump, squash and stretch; pivot = `rig.feet`)
 * - `head`: head with hair and face (tilt, nod; pivot = `rig.neck`)
 * - `armLeft`, `armRight`: viewer's left/right arm (wave, clap; pivot = `rig.shoulderLeft/Right`)
 * - `eyes`: blink (scale Y around `rig.eyes`)
 * - `mouth`: talking (swap expression or scale around `rig.mouth`)
 * - `accessory`: Zeynep's flower clip, Nehir's buns, Kerem's cap
 */
export type CharacterPart =
  'figure' | 'head' | 'armLeft' | 'armRight' | 'eyes' | 'mouth' | 'accessory';

/** Wraps one part, e.g. in a Reanimated `Animated.createAnimatedComponent(G)`. */
export type PartWrapper = ComponentType<{ children: ReactNode }>;

export type Point = { x: number; y: number };

/** Pivot points of the parts, in viewBox units (CHARACTER_BOX). */
export type CharacterRig = {
  feet: Point;
  neck: Point;
  shoulderLeft: Point;
  shoulderRight: Point;
  eyes: Point;
  mouth: Point;
};

export type CharacterProps = {
  expression?: Expression;
  /** Rendered height in dp. All three share one box so their heights compare. */
  size?: number;
  /** `full` body (default) or a square `portrait` of the head, for avatars and small spots. */
  framing?: 'full' | 'portrait';
  /** Optional wrappers per part for animation. */
  parts?: Partial<Record<CharacterPart, PartWrapper>>;
  /** Arm angles in degrees (0 = hanging straight down, positive = outwards); overrides the expression's pose. */
  armAngles?: { left: number; right: number };
};
