module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-gesture-handler|react-native-reanimated|react-native-worklets|react-native-svg|react-native-vector-icons|react-native-create-thumbnail|lucide-react-native)/)',
  ],
};
