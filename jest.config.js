/** @type {import('ts-jest').JestConfigWithTsJest} */
const { pathsToModuleNameMapper } = require("ts-jest")
// In the following statement, replace `./tsconfig` with the path to your `tsconfig` file
// which contains the path mapping (ie the `compilerOptions.paths` option):
const { compilerOptions } = require("./tsconfig")

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 60 * 1000,
  transform: {
    ".ts": [
      "ts-jest",
      {
        // Note: We shouldn't need to include `isolatedModules` here because it's a deprecated config option in TS 5,
        // but setting it to `true` fixes the `ESM syntax is not allowed in a CommonJS module when
        // 'verbatimModuleSyntax' is enabled` error that we're seeing when running our Jest tests.
        isolatedModules: true,
        useESM: true
      }
    ]
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/"
  })
}
