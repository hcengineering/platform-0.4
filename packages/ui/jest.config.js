module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  roots: [
    '<rootDir>/src'
  ],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  coverageReporters: ['text', ['lcov', { projectRoot: '../../' }]]  
}
