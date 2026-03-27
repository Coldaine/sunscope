const base = require('../../jest.base.cjs');

module.exports = {
  ...base,
  rootDir: '.',
  displayName: '@sunscope/ar',
  moduleNameMapper: {
    '^@sunscope/core$': '<rootDir>/../core/src/index.ts',
    '^@reactvision/react-viro$': '<rootDir>/__mocks__/@reactvision/react-viro.ts'
  }
};
