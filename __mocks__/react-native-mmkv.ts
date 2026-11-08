// Used automatically by Jest for 'react-native-mmkv'. The package already ships
// an in-memory store for tests, but its entry point loads the Nitro native
// module first, which does not exist under Jest — so expose the store directly.
import { createMockMMKV } from 'react-native-mmkv/lib/createMMKV/createMockMMKV';

export const createMMKV = createMockMMKV;
