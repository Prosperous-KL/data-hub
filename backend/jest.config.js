export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  transform: {},
  testEnvironmentOptions: {
    experimentalVmModules: true
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  passWithNoTests: true
};
