import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import i18n from "i18next";
import { useSettingsForm } from "@/hooks/useSettingsForm";

const useSettingsQueryMock = vi.fn();

vi.mock("@/lib/query", () => ({
  useSettingsQuery: (...args: unknown[]) => useSettingsQueryMock(...args),
}));

let changeLanguageSpy: ReturnType<typeof vi.spyOn<any, any>>;

beforeEach(() => {
  useSettingsQueryMock.mockReset();
  window.localStorage.clear();
  (i18n as any).language = "zh";
  changeLanguageSpy = vi
    .spyOn(i18n, "changeLanguage")
    .mockImplementation(async (lang?: string) => {
      (i18n as any).language = lang;
      return i18n.t;
    });
});

afterEach(() => {
  changeLanguageSpy.mockRestore();
});

describe("useSettingsForm Hook", () => {
  it("should normalize settings and sync language on initialization", async () => {
    useSettingsQueryMock.mockReturnValue({
      data: {
        showInTray: undefined,
        minimizeToTrayOnClose: undefined,
        enableClaudePluginIntegration: undefined,
        claudeConfigDir: "  /Users/demo  ",
        codexConfigDir: "   ",
        openclawConfigDir: "  /Users/openclaw  ",
        language: "en",
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useSettingsForm());

    await waitFor(() => {
      expect(result.current.settings).not.toBeNull();
    });

    const settings = result.current.settings!;
    expect(settings.showInTray).toBe(true);
    expect(settings.minimizeToTrayOnClose).toBe(true);
    expect(settings.enableClaudePluginIntegration).toBe(false);
    expect(settings.claudeConfigDir).toBe("/Users/demo");
    expect(settings.codexConfigDir).toBeUndefined();
    expect(settings.openclawConfigDir).toBe("/Users/openclaw");
    expect(settings.language).toBe("en");
    expect(settings.themeMode).toBe("system");
    expect(settings.themePalette).toBe("lobster");
    expect(settings.uiDensity).toBe("comfortable");
    expect(settings.motionPreference).toBe("system");
    expect(result.current.initialLanguage).toBe("en");
    expect(changeLanguageSpy).toHaveBeenCalledWith("en");
  });

  it("should support japanese language preference from server data", async () => {
    useSettingsQueryMock.mockReturnValue({
      data: {
        showInTray: true,
        minimizeToTrayOnClose: true,
        enableClaudePluginIntegration: false,
        claudeConfigDir: "/Users/demo",
        codexConfigDir: null,
        language: "ja",
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useSettingsForm());

    await waitFor(() => {
      expect(result.current.settings?.language).toBe("ja");
    });

    expect(result.current.initialLanguage).toBe("ja");
    expect(changeLanguageSpy).toHaveBeenCalledWith("ja");
  });

  it("should prioritize reading language from local storage in readPersistedLanguage", () => {
    useSettingsQueryMock.mockReturnValue({
      data: null,
      isLoading: false,
    });
    window.localStorage.setItem("language", "en");

    const { result } = renderHook(() => useSettingsForm());

    const lang = result.current.readPersistedLanguage();
    expect(lang).toBe("en");
    expect(changeLanguageSpy).not.toHaveBeenCalled();
  });

  it("should update fields and sync language when language changes in updateSettings", () => {
    useSettingsQueryMock.mockReturnValue({
      data: null,
      isLoading: false,
    });

    const { result } = renderHook(() => useSettingsForm());

    act(() => {
      result.current.updateSettings({
        showInTray: false,
        minimizeToTrayOnClose: true,
        silentStartup: true,
      });
    });

    expect(result.current.settings?.showInTray).toBe(false);
    expect(result.current.settings?.minimizeToTrayOnClose).toBe(false);
    expect(result.current.settings?.silentStartup).toBe(false);
    expect(result.current.settings?.themeMode).toBe("system");

    changeLanguageSpy.mockClear();
    act(() => {
      result.current.updateSettings({ language: "en" });
    });

    expect(result.current.settings?.language).toBe("en");
    expect(changeLanguageSpy).toHaveBeenCalledWith("en");
  });

  it("should reset with server data and restore initial language in resetSettings", async () => {
    useSettingsQueryMock.mockReturnValue({
      data: {
        showInTray: true,
        minimizeToTrayOnClose: true,
        enableClaudePluginIntegration: false,
        claudeConfigDir: "/origin",
        codexConfigDir: null,
        language: "en",
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useSettingsForm());

    await waitFor(() => {
      expect(result.current.settings).not.toBeNull();
    });

    changeLanguageSpy.mockClear();
    (i18n as any).language = "zh";

    act(() => {
      result.current.resetSettings({
        showInTray: false,
        minimizeToTrayOnClose: true,
        enableClaudePluginIntegration: true,
        silentStartup: true,
        claudeConfigDir: "  /reset  ",
        codexConfigDir: "   ",
        openclawConfigDir: "  /openclaw/reset  ",
        language: "zh",
        themeMode: "light",
        themePalette: "zinc",
        uiDensity: "compact",
        motionPreference: "reduced",
      });
    });

    const settings = result.current.settings!;
    expect(settings.showInTray).toBe(false);
    expect(settings.minimizeToTrayOnClose).toBe(false);
    expect(settings.silentStartup).toBe(false);
    expect(settings.enableClaudePluginIntegration).toBe(true);
    expect(settings.claudeConfigDir).toBe("/reset");
    expect(settings.codexConfigDir).toBeUndefined();
    expect(settings.openclawConfigDir).toBe("/openclaw/reset");
    expect(settings.language).toBe("zh");
    expect(settings.themeMode).toBe("light");
    expect(settings.themePalette).toBe("zinc");
    expect(settings.uiDensity).toBe("compact");
    expect(settings.motionPreference).toBe("reduced");
    expect(result.current.initialLanguage).toBe("en");
    expect(changeLanguageSpy).toHaveBeenCalledWith("en");
  });

  it("should not call changeLanguage repeatedly when language is consistent in syncLanguage", async () => {
    useSettingsQueryMock.mockReturnValue({
      data: {
        showInTray: true,
        minimizeToTrayOnClose: true,
        enableClaudePluginIntegration: false,
        claudeConfigDir: null,
        codexConfigDir: null,
        language: "zh",
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useSettingsForm());

    await waitFor(() => {
      expect(result.current.settings).not.toBeNull();
    });

    changeLanguageSpy.mockClear();
    (i18n as any).language = "zh";

    act(() => {
      result.current.syncLanguage("zh");
    });

    expect(changeLanguageSpy).not.toHaveBeenCalled();
  });
});
