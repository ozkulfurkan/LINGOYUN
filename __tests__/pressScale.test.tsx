import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Text } from 'react-native';

import { PressScale } from '@/components/PressScale';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));

const selectionAsync = Haptics.selectionAsync as jest.Mock;

describe('PressScale', () => {
  it('runs the action and taps the device', async () => {
    selectionAsync.mockResolvedValue(undefined);
    const onPress = jest.fn();
    await render(
      <PressScale accessibilityLabel="go" onPress={onPress}>
        <Text>go</Text>
      </PressScale>,
    );
    await fireEvent.press(screen.getByLabelText('go'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(selectionAsync).toHaveBeenCalledTimes(1);
  });

  it('still runs the action on a device without haptics', async () => {
    selectionAsync.mockRejectedValue(new Error('unavailable'));
    const onPress = jest.fn();
    await render(
      <PressScale accessibilityLabel="go" onPress={onPress}>
        <Text>go</Text>
      </PressScale>,
    );
    await fireEvent.press(screen.getByLabelText('go'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
