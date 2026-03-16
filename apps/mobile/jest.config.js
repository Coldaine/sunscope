/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@sunscope/core$': '<rootDir>/../../packages/core/src',
    '^@sunscope/ui$': '<rootDir>/../../packages/ui/src',
    '^@sunscope/ar$': '<rootDir>/../../packages/ar/src',
    '^@sunscope/sky-detection$': '<rootDir>/../../packages/sky-detection/src'
  }
};
