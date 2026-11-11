import type { ComponentType } from 'react';

import { Kerem, KEREM_RIG } from './Kerem';
import { Nehir, NEHIR_RIG } from './Nehir';
import type { CharacterId, CharacterProps, CharacterRig } from './types';
import { Zeynep, ZEYNEP_RIG } from './Zeynep';

export { ARM_POSES, CHARACTER_BOX, DEFAULT_CHARACTER_SIZE } from './parts';
export * from './types';
export { Kerem, Nehir, Zeynep };

/** Tallest first: Zeynep > Nehir > Kerem (docs/characters.md). */
export const CHARACTER_IDS: readonly CharacterId[] = ['zeynep', 'nehir', 'kerem'];

export const CHARACTERS: Readonly<
  Record<CharacterId, { Component: ComponentType<CharacterProps>; rig: CharacterRig }>
> = {
  zeynep: { Component: Zeynep, rig: ZEYNEP_RIG },
  nehir: { Component: Nehir, rig: NEHIR_RIG },
  kerem: { Component: Kerem, rig: KEREM_RIG },
};
