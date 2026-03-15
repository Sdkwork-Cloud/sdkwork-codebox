export const packageChunkMap: Array<{ match: string; chunk: string }> = [
  {
    match: "/packages/sdkwork-codebox-provider/",
    chunk: "domain-products",
  },
  {
    match: "/packages/sdkwork-codebox-workspace/",
    chunk: "domain-products",
  },
  {
    match: "/packages/sdkwork-codebox-integration/",
    chunk: "domain-extensions",
  },
  {
    match: "/packages/sdkwork-codebox-proxy/",
    chunk: "domain-runtime",
  },
  {
    match: "/packages/sdkwork-codebox-usage/",
    chunk: "domain-runtime",
  },
  {
    match: "/packages/sdkwork-codebox-settings/",
    chunk: "domain-control-center",
  },
  {
    match: "/packages/sdkwork-codebox-commons/",
    chunk: "app-commons",
  },
  {
    match: "/packages/sdkwork-codebox-core/",
    chunk: "app-core",
  },
  {
    match: "/packages/sdkwork-codebox-i18n/",
    chunk: "app-i18n",
  },
  {
    match: "/packages/sdkwork-codebox-types/",
    chunk: "app-types",
  },
];

export function getVendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (
    id.includes("/react/") ||
    id.includes("/react-dom/") ||
    id.includes("/scheduler/")
  ) {
    return "vendor-react";
  }
  if (id.includes("/prettier/standalone")) {
    return "vendor-prettier-runtime";
  }
  if (id.includes("/prettier/plugins/babel")) {
    return "vendor-prettier-babel";
  }
  if (id.includes("/prettier/plugins/estree")) {
    return "vendor-prettier-estree";
  }
  if (id.includes("/prettier/")) {
    return "vendor-prettier-shared";
  }
  if (id.includes("@tanstack/")) {
    return "vendor-query";
  }
  if (id.includes("@tauri-apps/")) {
    return "vendor-tauri";
  }
  if (id.includes("i18next") || id.includes("react-i18next")) {
    return "vendor-i18n";
  }
  if (id.includes("framer-motion")) {
    return "vendor-motion";
  }
  if (id.includes("/sonner/")) {
    return "vendor-notifications";
  }
  if (id.includes("/cmdk/")) {
    return "vendor-command";
  }
  if (id.includes("codemirror") || id.includes("@codemirror/")) {
    return "vendor-editor";
  }
  if (id.includes("recharts")) {
    return "vendor-charts";
  }
  if (id.includes("@dnd-kit/")) {
    return "vendor-dnd";
  }
  if (id.includes("react-hook-form") || id.includes("@hookform/resolvers")) {
    return "vendor-forms";
  }
  if (id.includes("zod")) {
    return "vendor-schema";
  }
  if (id.includes("smol-toml") || id.includes("jsonc-parser")) {
    return "vendor-config";
  }
  if (id.includes("flexsearch")) {
    return "vendor-search";
  }
  if (
    id.includes("@floating-ui/") ||
    id.includes("@radix-ui/") ||
    id.includes("react-remove-scroll") ||
    id.includes("react-style-singleton") ||
    id.includes("use-sidecar") ||
    id.includes("use-callback-ref") ||
    id.includes("aria-hidden") ||
    id.includes("lucide-react") ||
    id.includes("class-variance-authority") ||
    id.includes("clsx") ||
    id.includes("tailwind-merge")
  ) {
    return "vendor-react";
  }

  return "vendor-misc";
}

export function getPackageChunk(id: string): string | undefined {
  return packageChunkMap.find((entry) => id.includes(entry.match))?.chunk;
}
