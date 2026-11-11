import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Shake } from '@/components/Motion';
import { PressScale } from '@/components/PressScale';
import { Screen } from '@/components/Screen';
import { SecondaryButton } from '@/components/SecondaryButton';
import { ThemedText } from '@/components/ThemedText';
import {
  answerOf,
  appendDigit,
  createChallenge,
  isGateAnswer,
  markGatePassed,
  type Challenge,
} from '@/features/parental-gate';
import { seededRng } from '@/features/quiz/rng';
import { playFeedback } from '@/lib/feedback';
import { space, stroke, touchTarget, useTheme } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

/**
 * Grown-up check in front of settings and purchases: a multiplication
 * in words, answered on an on-screen keypad. Passing opens the next screen.
 */
export default function ParentGateScreen() {
  const { t } = useTranslation();
  // Where the gate leads: settings by default, or the family plans.
  const { next: target } = useLocalSearchParams<{ next?: string }>();
  const { colors, radii } = useTheme();
  const [rng] = useState(() => seededRng(Date.now()));
  const [challenge, setChallenge] = useState<Challenge>(() => createChallenge(rng));
  const [typed, setTyped] = useState('');
  const [misses, setMisses] = useState(0);

  const word = (n: number) => t(`gate.numbers.${n}` as 'gate.numbers.3');

  const onKey = (key: (typeof KEYS)[number]) => {
    if (key === 'back') return setTyped((v) => v.slice(0, -1));
    const next = appendDigit(challenge, typed, key);
    setTyped(next);
    if (next.length < String(answerOf(challenge)).length) return;
    if (isGateAnswer(challenge, next)) {
      markGatePassed();
      router.replace(target === 'paywall' ? '/paywall' : '/settings');
      return;
    }
    playFeedback('wrong');
    setMisses((m) => m + 1);
    setChallenge(createChallenge(rng, challenge));
    setTyped('');
  };

  return (
    <Screen footer={<SecondaryButton label={t('gate.cancel')} onPress={() => router.back()} />}>
      <ThemedText variant="label" color="accentText">
        {t('gate.title')}
      </ThemedText>
      <ThemedText>{t('gate.ask')}</ThemedText>
      <ThemedText variant="title" accessibilityRole="header" testID="gate-question">
        {t('gate.question', { a: word(challenge.a), b: word(challenge.b) })}
      </ThemedText>
      {misses > 0 ? (
        <ThemedText color="textMuted" accessibilityRole="alert">
          {t('gate.wrong')}
        </ThemedText>
      ) : null}

      <Shake trigger={misses}>
        <View
          accessible
          accessibilityLabel={typed ? t('gate.typed', { value: typed }) : t('gate.typedEmpty')}
          style={[
            styles.display,
            { borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.surface },
          ]}
        >
          <ThemedText variant="word">{typed || ' '}</ThemedText>
        </View>
      </Shake>

      <View style={styles.keypad}>
        {KEYS.map((key, i) =>
          key === '' ? (
            <View key={i} style={styles.key} />
          ) : (
            <PressScale
              key={key}
              accessibilityRole="button"
              accessibilityLabel={
                key === 'back' ? t('gate.backspace') : t('gate.digit', { d: key })
              }
              onPress={() => onKey(key)}
              style={[
                styles.key,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                },
              ]}
            >
              <ThemedText variant="option">{key === 'back' ? '⌫' : key}</ThemedText>
            </PressScale>
          ),
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  display: {
    minHeight: touchTarget.mini * 1.25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  key: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: touchTarget.mini,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: stroke.thin,
  },
});
