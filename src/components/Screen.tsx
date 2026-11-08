import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { space, useTheme } from '@/theme';

import { ScreenGlow } from './illustrations';

type Props = {
  /** Fixed at the bottom, above the keyboard. */
  footer?: ReactNode;
  /** Runs edge to edge above the scrolling content. */
  hero?: ReactNode;
  children: ReactNode;
};

/** Page frame: themed background, safe areas, scrolling body, fixed footer. */
export function Screen({ footer, hero, children }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ScreenGlow />
      </View>
      <SafeAreaView style={styles.fill}>
        {/* The app draws edge to edge on both platforms, so the window does not
            resize for the keyboard on Android either: padding works on both. */}
        <KeyboardAvoidingView behavior="padding" style={styles.fill}>
          <ScrollView
            style={styles.fill}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {hero}
            <View style={styles.body}>{children}</View>
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  body: {
    gap: space.md,
    padding: space.xl,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
    paddingTop: space.sm,
  },
});
