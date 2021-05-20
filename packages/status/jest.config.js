module.exports = {
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  preset: 'ts-jest',
  roots: [
    '<rootDir>/src'
  ],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'] 
}
