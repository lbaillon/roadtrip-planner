/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  moduleNameMapper: {
    '^@roadtrip/shared$': '<rootDir>/../shared/src/index.ts',
    '^#api/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^#api/(.*)$': '<rootDir>/src/$1.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node',
          esModuleInterop: true,
        },
      },
    ],
  },
}
