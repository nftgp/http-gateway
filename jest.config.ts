export default {
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testRegex: '/test/.*\\.test\\.ts$',
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.test.json',
    },
  },
}
