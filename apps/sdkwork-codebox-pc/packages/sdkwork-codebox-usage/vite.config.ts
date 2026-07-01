import { resolve } from "node:path";
import { defineConfig } from "vite";
import { createWorkspaceAliases } from "../../workspace.aliases";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
  },
  resolve: {
    alias: createWorkspaceAliases(resolve(__dirname, "../..")),
  },
});
