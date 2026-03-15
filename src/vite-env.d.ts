/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBUG_DIAGNOSTICS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};
