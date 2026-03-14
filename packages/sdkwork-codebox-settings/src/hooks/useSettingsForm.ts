import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsQuery } from "@/lib/query";
import type {
  MotionPreference,
  Settings,
  ThemeMode,
  ThemePalette,
  UiDensity,
} from "@/types";
import { normalizeWindowBehavior } from "../lib/windowBehavior";

type Language = "zh" | "en" | "ja";
const DEFAULT_THEME_MODE: ThemeMode = "system";
const DEFAULT_THEME_PALETTE: ThemePalette = "lobster";
const DEFAULT_UI_DENSITY: UiDensity = "comfortable";
const DEFAULT_MOTION_PREFERENCE: MotionPreference = "system";

export type SettingsFormState = Omit<
  Settings,
  "language" | "themeMode" | "themePalette" | "uiDensity" | "motionPreference"
> & {
  language: Language;
  themeMode: ThemeMode;
  themePalette: ThemePalette;
  uiDensity: UiDensity;
  motionPreference: MotionPreference;
};

const normalizeLanguage = (lang?: string | null): Language => {
  if (!lang) return "zh";
  const normalized = lang.toLowerCase();
  return normalized === "en" || normalized === "ja" ? normalized : "zh";
};

const normalizeThemeMode = (mode?: string | null): ThemeMode => {
  if (mode === "light" || mode === "system") {
    return mode;
  }
  return DEFAULT_THEME_MODE;
};

const normalizeThemePalette = (palette?: string | null): ThemePalette => {
  if (
    palette === "lobster" ||
    palette === "tech-blue" ||
    palette === "green-tech" ||
    palette === "zinc" ||
    palette === "violet" ||
    palette === "rose"
  ) {
    return palette;
  }
  return DEFAULT_THEME_PALETTE;
};

const normalizeUiDensity = (density?: string | null): UiDensity => {
  return density === "compact" ? "compact" : DEFAULT_UI_DENSITY;
};

const normalizeMotionPreference = (
  motionPreference?: string | null,
): MotionPreference => {
  if (
    motionPreference === "full" ||
    motionPreference === "reduced" ||
    motionPreference === "system"
  ) {
    return motionPreference;
  }
  return DEFAULT_MOTION_PREFERENCE;
};

const sanitizeDir = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export interface UseSettingsFormResult {
  settings: SettingsFormState | null;
  isLoading: boolean;
  initialLanguage: Language;
  updateSettings: (updates: Partial<SettingsFormState>) => void;
  resetSettings: (serverData: Settings | null) => void;
  readPersistedLanguage: () => Language;
  syncLanguage: (lang: Language) => void;
}

/**
 * useSettingsForm - 表单状态管理
 * 负责：
 * - 表单数据状态
 * - 表单字段更新
 * - 语言同步
 * - 表单重置
 */
export function useSettingsForm(): UseSettingsFormResult {
  const { i18n } = useTranslation();
  const { data, isLoading } = useSettingsQuery();

  const [settingsState, setSettingsState] = useState<SettingsFormState | null>(
    null,
  );

  const initialLanguageRef = useRef<Language>("zh");

  const readPersistedLanguage = useCallback((): Language => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("language");
      if (stored === "en" || stored === "zh" || stored === "ja") {
        return stored as Language;
      }
    }
    return normalizeLanguage(i18n.language);
  }, [i18n]);

  const syncLanguage = useCallback(
    (lang: Language) => {
      const current = normalizeLanguage(i18n.language);
      if (current !== lang) {
        void i18n.changeLanguage(lang);
      }
    },
    [i18n],
  );

  // 初始化设置数据
  useEffect(() => {
    if (!data) return;

    const normalizedLanguage = normalizeLanguage(
      data.language ?? readPersistedLanguage(),
    );
    const windowBehavior = normalizeWindowBehavior(data);

    const normalized: SettingsFormState = {
      ...data,
      showInTray: windowBehavior.showInTray,
      minimizeToTrayOnClose: windowBehavior.minimizeToTrayOnClose,
      enableClaudePluginIntegration:
        data.enableClaudePluginIntegration ?? false,
      silentStartup: windowBehavior.silentStartup,
      skipClaudeOnboarding: data.skipClaudeOnboarding ?? false,
      claudeConfigDir: sanitizeDir(data.claudeConfigDir),
      codexConfigDir: sanitizeDir(data.codexConfigDir),
      geminiConfigDir: sanitizeDir(data.geminiConfigDir),
      opencodeConfigDir: sanitizeDir(data.opencodeConfigDir),
      openclawConfigDir: sanitizeDir(data.openclawConfigDir),
      language: normalizedLanguage,
      themeMode: normalizeThemeMode(data.themeMode),
      themePalette: normalizeThemePalette(data.themePalette),
      uiDensity: normalizeUiDensity(data.uiDensity),
      motionPreference: normalizeMotionPreference(data.motionPreference),
    };

    setSettingsState(normalized);
    initialLanguageRef.current = normalizedLanguage;
    syncLanguage(normalizedLanguage);
  }, [data, readPersistedLanguage, syncLanguage]);

  const updateSettings = useCallback(
    (updates: Partial<SettingsFormState>) => {
      setSettingsState((prev) => {
        const base =
          prev ??
          ({
            showInTray: true,
            minimizeToTrayOnClose: true,
            enableClaudePluginIntegration: false,
            skipClaudeOnboarding: false,
            language: readPersistedLanguage(),
            themeMode: DEFAULT_THEME_MODE,
            themePalette: DEFAULT_THEME_PALETTE,
            uiDensity: DEFAULT_UI_DENSITY,
            motionPreference: DEFAULT_MOTION_PREFERENCE,
          } as SettingsFormState);

        const next: SettingsFormState = {
          ...base,
          ...updates,
        };
        const windowBehavior = normalizeWindowBehavior(next);

        next.showInTray = windowBehavior.showInTray;
        next.minimizeToTrayOnClose = windowBehavior.minimizeToTrayOnClose;
        next.silentStartup = windowBehavior.silentStartup;

        if (updates.language) {
          const normalized = normalizeLanguage(updates.language);
          next.language = normalized;
          syncLanguage(normalized);
        }

        return next;
      });
    },
    [readPersistedLanguage, syncLanguage],
  );

  const resetSettings = useCallback(
    (serverData: Settings | null) => {
      if (!serverData) return;

      const normalizedLanguage = normalizeLanguage(
        serverData.language ?? readPersistedLanguage(),
      );
      const windowBehavior = normalizeWindowBehavior(serverData);

      const normalized: SettingsFormState = {
        ...serverData,
        showInTray: windowBehavior.showInTray,
        minimizeToTrayOnClose: windowBehavior.minimizeToTrayOnClose,
        enableClaudePluginIntegration:
          serverData.enableClaudePluginIntegration ?? false,
        silentStartup: windowBehavior.silentStartup,
        skipClaudeOnboarding: serverData.skipClaudeOnboarding ?? false,
        claudeConfigDir: sanitizeDir(serverData.claudeConfigDir),
        codexConfigDir: sanitizeDir(serverData.codexConfigDir),
        geminiConfigDir: sanitizeDir(serverData.geminiConfigDir),
        opencodeConfigDir: sanitizeDir(serverData.opencodeConfigDir),
        openclawConfigDir: sanitizeDir(serverData.openclawConfigDir),
        language: normalizedLanguage,
        themeMode: normalizeThemeMode(serverData.themeMode),
        themePalette: normalizeThemePalette(serverData.themePalette),
        uiDensity: normalizeUiDensity(serverData.uiDensity),
        motionPreference: normalizeMotionPreference(
          serverData.motionPreference,
        ),
      };

      setSettingsState(normalized);
      syncLanguage(initialLanguageRef.current);
    },
    [readPersistedLanguage, syncLanguage],
  );

  return {
    settings: settingsState,
    isLoading,
    initialLanguage: initialLanguageRef.current,
    updateSettings,
    resetSettings,
    readPersistedLanguage,
    syncLanguage,
  };
}
