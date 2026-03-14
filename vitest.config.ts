import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { createWorkspaceAliases } from "./workspace.aliases";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: createWorkspaceAliases(__dirname),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setupGlobals.ts", "./tests/setupTests.ts"],
    globals: true,
    coverage: {
      reporter: ["text", "lcov"],
    },
  },
});
