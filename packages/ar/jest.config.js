/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@sunscope/ar/(.*)$': '<rootDir>/src/$1',
    '^@sunscope/core$': '<rootDir>/../core/src/types', // Fallback for types
  }
};