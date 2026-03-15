import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import { getPackageChunk } from "./build/viteChunking";
import { createWorkspaceAliases } from "./workspace.aliases";

export default defineConfig(({ command }) => ({
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
}));
