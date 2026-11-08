import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, space } from '@/theme';

// Placeholder home screen. UI strings move to src/i18n in LNG-38.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LINGOYUN</Text>
      <Text style={styles.subtitle}>Yakında</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
});
