const base = require('../../jest.base.cjs');

module.exports = {
  ...base,
  rootDir: '.',
  displayName: '@sunscope/mobile',
  moduleNameMapper: {
    '^@sunscope/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@sunscope/ar$': '<rootDir>/../../packages/ar/src/index.ts',
    '^@sunscope/ui$': '<rootDir>/../../packages/ui/src/index.ts',
    '^@sunscope/sky-detection$': '<rootDir>/../../packages/sky-detection/src/index.ts',
    '^react-native$': '<rootDir>/../../test/react-native.tsx',
    '^react-native-svg$': '<rootDir>/../../test/react-native-svg.tsx',
    '^expo-status-bar$': '<rootDir>/../../test/expo-status-bar.tsx'
  }
};
