// Every font file the app ships. Keys are the fontFamily names used in
// themes; loading them with expo-font under these keys gives the same name on
// iOS and Android (embedded fonts would be named differently per platform).
//
// The glyph test (fonts.test.ts) reads the require() paths below and checks
// each file contains the special letters of every supported language.
export const FONT_ASSETS = {
  'DynaPuff-Bold': require('@expo-google-fonts/dynapuff/700Bold/DynaPuff_700Bold.ttf'),
  'Baloo2-SemiBold': require('@expo-google-fonts/baloo-2/600SemiBold/Baloo2_600SemiBold.ttf'),
  'Baloo2-Bold': require('@expo-google-fonts/baloo-2/700Bold/Baloo2_700Bold.ttf'),
  'Baloo2-ExtraBold': require('@expo-google-fonts/baloo-2/800ExtraBold/Baloo2_800ExtraBold.ttf'),
  'Fraunces-SemiBold': require('@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf'),
  'Fraunces-Italic': require('@expo-google-fonts/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf'),
  'Fraunces-SemiBoldItalic': require('@expo-google-fonts/fraunces/600SemiBold_Italic/Fraunces_600SemiBold_Italic.ttf'),
  'InterTight-Regular': require('@expo-google-fonts/inter-tight/400Regular/InterTight_400Regular.ttf'),
  'InterTight-Medium': require('@expo-google-fonts/inter-tight/500Medium/InterTight_500Medium.ttf'),
  'InterTight-SemiBold': require('@expo-google-fonts/inter-tight/600SemiBold/InterTight_600SemiBold.ttf'),
} as const;

export type FontName = keyof typeof FONT_ASSETS;
