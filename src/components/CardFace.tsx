import { StyleSheet, View, type ColorValue } from 'react-native';

type Props = {
  backgroundColor: ColorValue;
  borderColor?: ColorValue;
  borderWidth?: number;
  borderRadius: number;
  boxShadow?: string;
};

/**
 * The colour, border and clay shadow of a card, drawn as its own layer behind
 * the card's content. Text on a tapped card that turned right looked blurry on
 * iOS (the shadow changes while the card is still pressed and scaled down);
 * keeping the shadow on a separate layer keeps the text out of that redraw.
 */
export function CardFace({
  backgroundColor,
  borderColor,
  borderWidth,
  borderRadius,
  boxShadow,
}: Props) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor, borderColor, borderWidth, borderRadius, boxShadow },
      ]}
    />
  );
}
