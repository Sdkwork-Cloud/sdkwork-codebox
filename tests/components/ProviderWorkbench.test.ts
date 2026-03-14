import { describe, expect, it } from "vitest";
import {
  getProviderWorkbenchTabs,
  getProviderWorkbenchTabForField,
} from "@/components/providers/forms/providerWorkbench";

const t = (
  key: string,
  options?: {
    defaultValue?: string;
  },
) => options?.defaultValue ?? key;

describe("provider workbench navigation", () => {
  it("includes preset and advanced stages for add flows that support them", () => {
    const tabs = getProviderWorkbenchTabs({
      appId: "claude",
      isEditMode: false,
      hasAdvancedConfig: true,
      t,
    });

    expect(tabs.map((tab) => tab.id)).toEqual([
      "preset",
      "basic",
      "connection",
      "config",
      "advanced",
    ]);
  });

  it("omits preset and advanced stages when they are not applicable", () => {
    const tabs = getProviderWorkbenchTabs({
      appId: "openclaw",
      isEditMode: true,
      hasAdvancedConfig: false,
      t,
    });

    expect(tabs.map((tab) => tab.id)).toEqual([
      "basic",
      "connection",
      "config",
    ]);
  });

  it("routes validation focus back to the correct tab", () => {
    expect(getProviderWorkbenchTabForField("name")).toBe("basic");
    expect(getProviderWorkbenchTabForField("websiteUrl")).toBe("basic");
    expect(getProviderWorkbenchTabForField("settingsConfig")).toBe("config");
    expect(getProviderWorkbenchTabForField("providerKey")).toBe("basic");
    expect(getProviderWorkbenchTabForField("connection")).toBe("connection");
  });
});
