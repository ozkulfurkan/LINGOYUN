import { kidsTheme } from './themes';

// Fixed palette for the drawn art of the 2–7 mode: word pictures and the three
// characters (Zeynep, Nehir, Kerem).
//
// Why not the active theme's tokens: a word picture shows a real thing (a red
// apple, a grey elephant) and its colour is part of what a small child learns
// to recognise. It must look the same in every theme, and the UI tokens
// (correct, accent, info) carry meanings the pictures do not have. So the art
// gets its own palette, in one place, here. Where a colour already exists in
// the kids theme (the characters' clothes, docs/characters.md) it is taken
// from there instead of being repeated.
//
// Every tone is a clay surface lit from the top left: `light` where the light
// hits, `face` for the body, `shade` on the far bottom-right side.

const kids = kidsTheme.colors;

/** Three stops of a clay surface lit from the top left. */
export type ClayTone = { light: string; face: string; shade: string };

const tones = {
  // Theme colours (clothes, toys) with a lighter stop for the clay gloss.
  lemon: { light: '#FFF3B0', face: kids.reward, shade: kids.rewardShade },
  mint: { light: '#A6F0D2', face: kids.correct, shade: kids.correctShade },
  sky: { light: '#C6E8FF', face: kids.info, shade: kids.infoShade },
  berry: { light: '#FF94AE', face: kids.accent, shade: kids.accentShade },
  cream: { light: '#FFFCF7', face: kids.surface, shade: kids.surfaceShade },

  // Real-world colours of the word pictures.
  red: { light: '#FF9AA8', face: '#EE3B55', shade: '#A81E36' },
  orange: { light: '#FFC48A', face: '#FF9636', shade: '#D2651A' },
  ginger: { light: '#FFD3A3', face: '#F6A45A', shade: '#C8732E' },
  tan: { light: '#FBE5C8', face: '#E9BC8B', shade: '#BD8A57' },
  brown: { light: '#B5805C', face: '#8A5636', shade: '#5E3520' },
  grey: { light: '#E2E9F2', face: '#A8B6C9', shade: '#74849C' },
  terracotta: { light: '#F7A27E', face: '#E06A43', shade: '#A9472A' },
  charcoal: { light: '#7E6A67', face: '#4A3836', shade: '#2A1E1D' },
  glass: { light: '#F4FBFF', face: '#D3ECFF', shade: '#9CCBF0' },
  pink: { light: '#FFD0DA', face: '#F79AAE', shade: '#D96C86' },
} satisfies Record<string, ClayTone>;

/** Skin and hair of the characters (docs/characters.md: "Ten / saç"). */
const people = {
  /** Zeynep: light tan skin, brown hair. */
  zeynepSkin: { light: '#FCE2CA', face: '#F1C29C', shade: '#D39770' },
  zeynepHair: { light: '#A66E4E', face: '#7B4A30', shade: '#4E2C1B' },
  /** Nehir: warm tan skin, dark brown hair. */
  nehirSkin: { light: '#F2CCA6', face: '#DDA578', shade: '#B07A50' },
  nehirHair: { light: '#6E4535', face: '#4B2C21', shade: '#2C1913' },
  /** Kerem: medium-brown skin, black curly hair. */
  keremSkin: { light: '#D9A47E', face: '#B57A50', shade: '#83502F' },
  keremHair: { light: '#4F3E3B', face: '#2B201E', shade: '#151010' },
} satisfies Record<string, ClayTone>;

export const artPalette = {
  tones: { ...tones, ...people },
  /** Eyes, glasses, whiskers. */
  ink: kids.text,
  /** Open mouth of a character. */
  mouth: kids.accentShade,
  /** Tongue, inner ears, noses of animals. */
  tongue: '#F2849C',
  cheek: '#F4948F',
  /** Gloss on the top-left of every clay shape. */
  gloss: kids.surface,
  glossOpacity: 0.6,
  /** Soft contact shadow under every picture. */
  shadow: kids.text,
  shadowOpacity: 0.15,
} as const;

export type ArtToneName = keyof typeof artPalette.tones;
