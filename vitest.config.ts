import { defineConfig } from "vitest/config";

// Phase 7 — minimal test runner (Master Plan Phase 6 gap). Node
// environment only: nothing here renders React components yet, just
// pure logic (src/lib/auth.ts). Add jsdom/@testing-library later if
// component tests are wanted.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
