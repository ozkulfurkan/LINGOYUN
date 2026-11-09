import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { HEARTS } from '@/features/path';
import { space } from '@/theme';

import { HeartIcon } from './illustrations';
import { Shake } from './Motion';

/** Lives left in the step, shown as hearts in the corner. A lost heart shakes. */
export function Hearts({ hearts }: { hearts: number }) {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={t('path.heartsLabel', { count: hearts })}
      testID="hearts"
      style={styles.row}
    >
      {Array.from({ length: HEARTS }, (_, i) => (
        <Shake key={i} trigger={i === hearts}>
          <HeartIcon full={i < hearts} />
        </Shake>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: space.xxs,
  },
});
