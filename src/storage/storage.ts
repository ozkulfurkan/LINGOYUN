import { createMMKV } from 'react-native-mmkv';

/**
 * The app's single key-value store, on the device only. Synchronous, so data
 * is available on the first render. Under Jest, __mocks__/react-native-mmkv.ts
 * swaps in an in-memory store.
 */
export const storage = createMMKV({ id: 'lingoyun' });
