import { describe, expect, it } from "vitest";
import { getPackageChunk } from "../../build/viteChunking";

describe("vite chunking", () => {
  it("groups provider packages into the products domain chunk", () => {
    expect(
      getPackageChunk(
        "/workspace/packages/sdkwork-codebox-provider/src/index.ts",
      ),
    ).toBe("domain-products");
  });

  it("groups settings packages into the control center chunk", () => {
    expect(
      getPackageChunk(
        "/workspace/packages/sdkwork-codebox-settings/src/index.ts",
      ),
    ).toBe("domain-control-center");
  });

  it("leaves node_modules to the default bundler strategy", () => {
    expect(getPackageChunk("/workspace/node_modules/react/index.js")).toBe(
      undefined,
    );
  });
});
