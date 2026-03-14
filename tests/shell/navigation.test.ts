import { beforeEach, describe, expect, it } from "vitest";
import {
  getBackView,
  getFirstVisibleApp,
  getInitialApp,
  getInitialDomain,
  getInitialViewState,
  hasSessionSupport,
  persistNavigationState,
  resolveViewForDomain,
} from "@/shell/navigation";

describe("shell navigation helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads valid saved app and falls back for invalid values", () => {
    expect(getInitialApp()).toBe("claude");

    localStorage.setItem("codebox-last-app", "codex");
    expect(getInitialApp()).toBe("codex");

    localStorage.setItem("codebox-last-app", "invalid-app");
    expect(getInitialApp()).toBe("claude");
  });

  it("persists and restores domain state safely", () => {
    expect(getInitialDomain("claude", true)).toBe("products");
    expect(getInitialViewState("claude", true)).toMatchObject({
      products: "providers",
      runtime: "runtimeProxy",
      extensions: "prompts",
      "control-center": "appearance",
    });

    persistNavigationState("extensions", {
      products: "sessions",
      runtime: "runtimeFailover",
      extensions: "universal",
      "control-center": "directories",
    });

    expect(getInitialDomain("claude", true)).toBe("extensions");
    expect(getInitialViewState("claude", true)).toMatchObject({
      products: "sessions",
      runtime: "runtimeFailover",
      extensions: "universal",
      "control-center": "directories",
    });
  });

  it("migrates legacy settings view and resolves unsupported product tabs", () => {
    localStorage.setItem("codebox-last-view", "settings");
    expect(getInitialDomain("claude", true)).toBe("control-center");
    expect(getInitialViewState("claude", true)["control-center"]).toBe(
      "appearance",
    );

    expect(
      resolveViewForDomain("products", "openclawEnv", "claude", true),
    ).toBe("providers");
    expect(resolveViewForDomain("products", "workspace", "codex", true)).toBe(
      "providers",
    );
    expect(resolveViewForDomain("extensions", "skills", "claude", false)).toBe(
      "prompts",
    );
  });

  it("keeps back navigation and session support rules stable", () => {
    expect(getBackView("skillsDiscovery")).toBe("skills");
    expect(getBackView("appearance")).toBe("providers");

    expect(hasSessionSupport("claude")).toBe(true);
    expect(hasSessionSupport("codex")).toBe(true);
    expect(hasSessionSupport("gemini")).toBe(true);
    expect(hasSessionSupport("opencode")).toBe(true);
    expect(hasSessionSupport("openclaw")).toBe(true);
  });

  it("chooses the first visible app in display order", () => {
    expect(
      getFirstVisibleApp({
        claude: false,
        codex: false,
        gemini: true,
        opencode: true,
        openclaw: true,
      }),
    ).toBe("gemini");

    expect(
      getFirstVisibleApp({
        claude: false,
        codex: false,
        gemini: false,
        opencode: false,
        openclaw: false,
      }),
    ).toBe("claude");
  });
});
