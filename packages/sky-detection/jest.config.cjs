const base = require('../../jest.base.cjs');

module.exports = {
  ...base,
  rootDir: '.',
  displayName: '@sunscope/sky-detection',
  moduleNameMapper: {
    '^@sunscope/core$': '<rootDir>/../core/src/index.ts'
  }
};
