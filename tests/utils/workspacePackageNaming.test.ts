import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const rootDir = process.cwd();
const packagesDir = path.join(rootDir, "packages");

const packageDirs = fs
  .readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const manifestByDir = new Map(
  packageDirs.map((dir) => {
    const manifestPath = path.join(packagesDir, dir, "package.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      name: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    return [dir, manifest] as const;
  }),
);

const workspacePackageNames = new Set(
  [...manifestByDir.values()].map((manifest) => manifest.name),
);

describe("workspace package naming", () => {
  it("uses @sdkwork/codebox-* names that align with package directories", () => {
    for (const dir of packageDirs) {
      const manifest = manifestByDir.get(dir)!;
      const expectedName = `@sdkwork/${dir.replace(/^sdkwork-/, "")}`;

      expect(manifest.name).toBe(expectedName);
    }
  });

  it("uses scoped names for all internal workspace dependencies", () => {
    for (const manifest of manifestByDir.values()) {
      for (const field of [
        "dependencies",
        "devDependencies",
        "peerDependencies",
      ] as const) {
        const deps = manifest[field] ?? {};
        for (const depName of Object.keys(deps)) {
          if (!workspacePackageNames.has(depName)) {
            continue;
          }

          expect(depName.startsWith("@sdkwork/codebox-")).toBe(true);
          expect(deps[depName]).toBe("workspace:*");
        }
      }
    }
  });

  it("documents the scoped package standard in architecture docs", () => {
    const architect = fs.readFileSync(path.join(rootDir, "ARCHITECT.md"), "utf8");
    const agents = fs.readFileSync(path.join(rootDir, "AGENTS.md"), "utf8");

    expect(architect).toContain("@sdkwork/codebox-commons");
    expect(architect).toContain("@sdkwork/codebox-<module>");
    expect(agents).toContain("@sdkwork/codebox-<module>");
  });
});
