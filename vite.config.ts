import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { getPackageChunk } from "./build/viteChunking";
import { createWorkspaceAliases } from "./workspace.aliases";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, __dirname, "");
  return {
  define: {
    "process.env.SDKWORK_ACCESS_TOKEN": JSON.stringify(env.SDKWORK_ACCESS_TOKEN ?? ""),
  },
  root: "src",
  plugins: [
    command === "serve" &&
      codeInspectorPlugin({
        bundler: "vite",
      }),
    react(),
  ].filter(Boolean),
  base: "./",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          return getPackageChunk(id);
        },
      },
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: createWorkspaceAliases(__dirname),
  },
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
};
});
