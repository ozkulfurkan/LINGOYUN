// Stand-in for react-native-reanimated under Jest (see moduleNameMapper in
// package.json). Reanimated 4 throws on load there, and its own mock imports the
// same entry point. Values jump straight to their target; real motion is checked
// on a device.
const useSharedValue = (initial) => {
  const shared = {
    value: initial,
    get: () => shared.value,
    set: (next) => {
      shared.value = next;
    },
  };
  return shared;
};

module.exports = {
  __esModule: true,
  default: {
    createAnimatedComponent: (component) => component,
    View: require('react-native').View,
  },
  useSharedValue,
  useAnimatedStyle: (updater) => updater(),
  useReducedMotion: () => false,
  withTiming: (value) => value,
  withSpring: (value) => value,
};
