import { act, renderHook } from '@testing-library/react-native';

import { useSettled } from './useSettled';

describe('useSettled', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('starts with the value and follows a change only after the delay', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useSettled(value, 500),
      {
        initialProps: { value: 'text' },
      },
    );
    expect(result.current).toBe('text');

    await rerender({ value: 'onCorrect' });
    expect(result.current).toBe('text');
    await act(() => jest.advanceTimersByTime(499));
    expect(result.current).toBe('text');
    await act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('onCorrect');
  });

  it('keeps only the last of quick changes', async () => {
    const { result, rerender } = await renderHook(
      ({ value }: { value: string }) => useSettled(value, 500),
      {
        initialProps: { value: 'a' },
      },
    );
    await rerender({ value: 'b' });
    await act(() => jest.advanceTimersByTime(300));
    await rerender({ value: 'c' });
    await act(() => jest.advanceTimersByTime(500));
    expect(result.current).toBe('c');
  });
});
