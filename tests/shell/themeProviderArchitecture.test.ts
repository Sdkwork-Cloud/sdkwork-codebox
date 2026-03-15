import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("theme provider architecture", () => {
  it("keeps commons theme provider independent from core query hooks", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "packages/sdkwork-codebox-commons/src/components/theme-provider.tsx",
      ),
      "utf8",
    );

    expect(source).not.toContain('from "@/lib/query"');
    expect(source).not.toContain("useSettingsQuery");
  });

  it("keeps commons package free of core alias imports", () => {
    const commonsFiles = [
      "packages/sdkwork-codebox-commons/src/components/theme-provider.tsx",
      "packages/sdkwork-codebox-commons/src/components/common/FullScreenPanel.tsx",
    ];

    for (const file of commonsFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toContain('from "@/lib/query"');
      expect(source).not.toContain('from "@/lib/platform"');
    }
  });
});
