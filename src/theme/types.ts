import type { TextStyle } from 'react-native';

import type { FontName } from './fonts';

export type ThemeName = 'kids' | 'adultLight' | 'adultDark';

/** Semantic colours. Components use these names, never raw hex values. */
export type ColorTokens = {
  background: string;
  /** Second stop of the background gradient / top glow. */
  backgroundAlt: string;
  surface: string;
  /** Bottom edge of raised surfaces (clay) or sunken areas. */
  surfaceShade: string;
  /** Strongly contrasting panel, e.g. the feedback footer. */
  surfaceInverse: string;
  onSurfaceInverse: string;
  border: string;
  text: string;
  textMuted: string;
  /** Primary action (buttons). */
  accent: string;
  accentShade: string;
  onAccent: string;
  /** Accent used as text on background/surface (the big word, labels). */
  accentText: string;
  correct: string;
  correctShade: string;
  onCorrect: string;
  /** Wrong answers are soft, never alarm red. */
  incorrect: string;
  onIncorrect: string;
  /** Marker behind highlighted text. */
  highlight: string;
  reward: string;
  rewardShade: string;
  streak: string;
  /** Secondary action, e.g. the speaker button. */
  info: string;
  infoShade: string;
  onInfo: string;
};

export type FontTokens = {
  display: FontName;
  displayItalic: FontName;
  body: FontName;
  bodyMedium: FontName;
  bodyBold: FontName;
};

export type TextStyleName =
  'word' | 'title' | 'example' | 'body' | 'option' | 'button' | 'label' | 'caption';

export type TextStyleToken = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'textTransform'
> & { fontFamily: FontName; fontSize: number };

export type Spring = { damping: number; stiffness: number };

export type MotionTokens = {
  /** Durations in ms. */
  tap: number;
  feedback: number;
  celebrate: number;
  screen: number;
  spring: Spring;
};

/** CSS box-shadow strings (React Native New Architecture), or null for none. */
export type ElevationTokens = {
  surface: string | null;
  accent: string | null;
  correct: string | null;
};

export type Theme = {
  name: ThemeName;
  mode: 'light' | 'dark';
  colors: ColorTokens;
  fonts: FontTokens;
  text: Record<TextStyleName, TextStyleToken>;
  radii: { sm: number; md: number; lg: number; pill: number };
  elevation: ElevationTokens;
  motion: MotionTokens;
};
