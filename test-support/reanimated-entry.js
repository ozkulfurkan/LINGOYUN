// Target for the bare 'react-native-reanimated' import. It must be a different
// file from reanimated.js: Expo Router's test setup mocks the bare import with a
// factory that requires 'react-native-reanimated/mock', and if both resolved to
// one file, the factory would receive its own half-built module.
module.exports = require('./reanimated');
