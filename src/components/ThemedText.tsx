import { useTranslation } from 'react-i18next';
import { Text, type TextProps } from 'react-native';

import { toUiUpper } from '@/features/onboarding/flow';
import { useTheme, type ColorTokens, type TextStyleName } from '@/theme';

type Props = TextProps & {
  variant?: TextStyleName;
  color?: keyof ColorTokens;
  children: string;
};

/**
 * Text in a theme style. Styles that uppercase (adult labels) are converted
 * here, because React Native's textTransform ignores Turkish rules for i → İ.
 */
export function ThemedText({ variant = 'body', color = 'text', style, children, ...rest }: Props) {
  const { i18n } = useTranslation();
  const theme = useTheme();
  const token = theme.text[variant];
  const uppercase = token.textTransform === 'uppercase';
  return (
    <Text
      {...rest}
      style={[
        token,
        { color: theme.colors[color] },
        uppercase ? { textTransform: 'none' } : null,
        style,
      ]}
    >
      {uppercase ? toUiUpper(i18n.language, children) : children}
    </Text>
  );
}
