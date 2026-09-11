import { defineConfig, defaultExclude } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Integration tests hit the real dev database (see vitest.integration.config.ts
    // and `npm run test:integration`) — kept out of the fast, fully-mocked unit suite.
    // Extends (not replaces) the defaults, which is what keeps dist/**'s
    // compiled *.test.js out of this run.
    exclude: [...defaultExclude, "**/*.integration.test.ts"],
  },
});
