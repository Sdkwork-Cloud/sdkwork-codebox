import { describe, expect, it, vi } from "vitest";
import { installDebugDiagnostics } from "@/debugDiagnostics";

describe("debug diagnostics", () => {
  it("installs white-screen diagnostics when debug mode is enabled", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");

    installDebugDiagnostics({ enabled: true });

    expect(addEventListener).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
    );
    expect(addEventListener).toHaveBeenCalledWith(
      "unhandledrejection",
      expect.any(Function),
    );
  });

  it("does not install diagnostics when debug mode is disabled", () => {
    const addEventListener = vi.spyOn(window, "addEventListener");

    installDebugDiagnostics({ enabled: false });

    expect(addEventListener).not.toHaveBeenCalled();
  });
});
