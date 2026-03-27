const base = require('../../jest.base.cjs');

module.exports = {
  ...base,
  rootDir: '.',
  displayName: '@sunscope/ui',
  moduleNameMapper: {
    '^@sunscope/core$': '<rootDir>/../core/src/index.ts',
    '^@sunscope/ar$': '<rootDir>/../ar/src/index.ts',
    '^react-native$': '<rootDir>/../../test/react-native.tsx',
    '^react-native-svg$': '<rootDir>/../../test/react-native-svg.tsx'
  }
};
