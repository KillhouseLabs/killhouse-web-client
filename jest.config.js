const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/__tests__/mocks/",
    "/.features-gen/",
    "/e2e/",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-markdown|remark-gfm|unified|bail|is-plain-obj|trough|vfile|vfile-message|unist-.*|micromark.*|mdast-.*|decode-named-character-reference|character-entities|escape-string-regexp|markdown-table|property-information|hast-util-whitespace|space-separated-tokens|comma-separated-tokens|ccount|zwitch|html-void-elements|remark-.*|devlop)/)",
  ],
};

module.exports = createJestConfig(customJestConfig);
