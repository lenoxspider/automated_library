/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  clearMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '/client/'],
  modulePathIgnorePatterns: ['<rootDir>/client/'],
  watchPathIgnorePatterns: ['<rootDir>/client/'],
};
