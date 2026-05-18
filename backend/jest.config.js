export default {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
  transform: {},
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  passWithNoTests: true
};
