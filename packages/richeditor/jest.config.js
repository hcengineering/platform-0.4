module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  roots: [
    '<rootDir>/src'
  ],
  transform: {
    '^.+\\.svelte$': [
      'svelte-jester',
      {
        preprocess: true
      }
    ],
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: [
    'js',
    'ts',
    'svelte'
  ],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  coverageReporters: ['text', ['lcov', { projectRoot: '../../' }]]
}
