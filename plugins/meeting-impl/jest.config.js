module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  roots: [
    '<rootDir>/src'
  ],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  coverageReporters: ['text', ['lcov', { projectRoot: '../../' }]],
  reporters: ['@anticrm/platform-rig/profiles/default/config/SummaryReporter']
}
