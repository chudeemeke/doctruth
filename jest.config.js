module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', 'bin/**/*.js'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  // Handle spaces in paths
  moduleDirectories: ['node_modules'],
  testPathIgnorePatterns: ['/node_modules/'],
  // Disable watch by default
  watchman: false
};