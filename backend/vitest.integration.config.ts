import { defineConfig, defaultExclude } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: defaultExclude,
    // Unlike the mocked unit suite, these tests hit real infrastructure
    // (Postgres via Prisma, JWT signing) that needs the real .env.
    setupFiles: ["dotenv/config"],
    // Real network calls (bcrypt hashing, Postgres round-trips) are slower
    // than the mocked unit suite.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
