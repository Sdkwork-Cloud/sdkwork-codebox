import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsQuery } from "@/lib/query";
import type {
  MotionPreference,
  ThemeMode as Theme,
  ThemePalette as AccentTheme,
  UiDensity,
} from "@/types";

const DEFAULT_THEME: Theme = "system";
const DEFAULT_ACCENT_THEME: AccentTheme = "lobster";
const DEFAULT_UI_DENSITY: UiDensity = "comfortable";
const DEFAULT_MOTION_PREFERENCE: MotionPreference = "system";

export { type AccentTheme };

export const accentThemeOptions: Array<{
  value: AccentTheme;
  label: string;
  description: string;
}> = [
  {
    value: "lobster",
    label: "Lobster",
    description: "高识别度的红色主题，适合品牌强调和高提醒密度场景。",
  },
  {
    value: "tech-blue",
    label: "Tech Blue",
    description: "参考 claw-studio 的默认控制台蓝，冷静、稳定、专业。",
  },
  {
    value: "green-tech",
    label: "Green Tech",
    description: "更偏运维与监控气质的绿色主色，适合长时间专注使用。",
  },
  {
    value: "zinc",
    label: "Zinc",
    description: "最克制的工业化灰阶方案，适合低彩度控制台。",
  },
  {
    value: "violet",
    label: "Violet",
    description: "保留技术感的同时更具辨识度，适合扩展工具氛围。",
  },
  {
    value: "rose",
    label: "Rose",
    description: "偏产品化的玫瑰主题，用于需要更强情绪表达的团队。",
  },
];

export const densityOptions: Array<{
  value: UiDensity;
  label: string;
  description: string;
}> = [
  {
    value: "comfortable",
    label: "Comfortable",
    description: "保留更宽松的留白和更稳定的阅读节奏，适合长时间操作。",
  },
  {
    value: "compact",
    label: "Compact",
    description: "压缩信息密度，在同一屏幕中承载更多配置与状态信息。",
  },
];

export const motionPreferenceOptions: Array<{
  value: MotionPreference;
  label: string;
  description: string;
}> = [
  {
    value: "system",
    label: "Follow System",
    description: "遵循系统的减少动态效果偏好，桌面体验保持一致。",
  },
  {
    value: "full",
    label: "Full Motion",
    description: "保留完整过渡、分区切换和主题扩散效果。",
  },
  {
    value: "reduced",
    label: "Reduced Motion",
    description: "显著降低动画强度，优先稳定、克制和可预期的交互反馈。",
  },
];

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  accentTheme: AccentTheme;
  uiDensity: UiDensity;
  motionPreference: MotionPreference;
  reducedMotion: boolean;
  setTheme: (theme: Theme, event?: React.MouseEvent) => void;
  setAccentTheme: (accentTheme: AccentTheme, event?: React.MouseEvent) => void;
  setUiDensity: (uiDensity: UiDensity) => void;
  setMotionPreference: (motionPreference: MotionPreference) => void;
}

const ThemeProviderContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

const isAccentTheme = (value?: string | null): value is AccentTheme =>
  accentThemeOptions.some((option) => option.value === value);

const readLegacyTheme = (storageKey: string, defaultTheme: Theme): Theme => {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return defaultTheme;
};

const readLegacyAccentTheme = (storageKey: string): AccentTheme => {
  if (typeof window === "undefined") {
    return DEFAULT_ACCENT_THEME;
  }

  const stored = window.localStorage.getItem(`${storageKey}-accent`);
  if (isAccentTheme(stored)) {
    return stored;
  }

  if (stored === "verdant") {
    return "green-tech";
  }
  if (stored === "graphite") {
    return "zinc";
  }
  if (stored === "amber") {
    return "lobster";
  }

  return DEFAULT_ACCENT_THEME;
};

const normalizeTheme = (theme?: string | null): Theme => {
  if (theme === "light" || theme === "system") {
    return theme;
  }
  return DEFAULT_THEME;
};

const normalizeAccentTheme = (accentTheme?: string | null): AccentTheme => {
  return isAccentTheme(accentTheme) ? accentTheme : DEFAULT_ACCENT_THEME;
};

const normalizeUiDensity = (uiDensity?: string | null): UiDensity => {
  return uiDensity === "compact" ? "compact" : DEFAULT_UI_DENSITY;
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

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = "codebox-theme",
}: ThemeProviderProps) {
  const { data: settings } = useSettingsQuery();

  const [theme, setThemeState] = useState<Theme>(() =>
    readLegacyTheme(storageKey, defaultTheme),
  );
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>(() =>
    readLegacyAccentTheme(storageKey),
  );
  const [uiDensity, setUiDensityState] =
    useState<UiDensity>(DEFAULT_UI_DENSITY);
  const [motionPreference, setMotionPreferenceState] =
    useState<MotionPreference>(DEFAULT_MOTION_PREFERENCE);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(
    getSystemTheme,
  );
  const [reducedMotion, setReducedMotion] =
    useState<boolean>(prefersReducedMotion);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setThemeState(normalizeTheme(settings.themeMode));
    setAccentThemeState(
      normalizeAccentTheme(
        settings.themePalette ?? readLegacyAccentTheme(storageKey),
      ),
    );
    setUiDensityState(normalizeUiDensity(settings.uiDensity));
    setMotionPreferenceState(
      normalizeMotionPreference(settings.motionPreference),
    );
  }, [settings, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = window.document.documentElement;
    const nextResolvedTheme = theme === "system" ? getSystemTheme() : theme;
    root.classList.remove("light", "dark");
    root.classList.add(nextResolvedTheme);
    setResolvedTheme(nextResolvedTheme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = window.document.documentElement;
    root.dataset.accentTheme = accentTheme;
    root.dataset.uiDensity = uiDensity;
    root.dataset.motionPreference = motionPreference;
  }, [accentTheme, motionPreference, uiDensity]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const colorMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const motionMediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const syncTheme = () => {
      if (theme !== "system") {
        return;
      }

      const nextResolvedTheme = colorMediaQuery.matches ? "dark" : "light";
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(nextResolvedTheme);
      setResolvedTheme(nextResolvedTheme);
    };

    const syncMotionPreference = () => {
      const nextReducedMotion =
        motionPreference === "reduced" ||
        (motionPreference === "system" && motionMediaQuery.matches);
      setReducedMotion(nextReducedMotion);
    };

    syncTheme();
    syncMotionPreference();

    colorMediaQuery.addEventListener("change", syncTheme);
    motionMediaQuery.addEventListener("change", syncMotionPreference);

    return () => {
      colorMediaQuery.removeEventListener("change", syncTheme);
      motionMediaQuery.removeEventListener("change", syncMotionPreference);
    };
  }, [motionPreference, theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextReducedMotion =
      motionPreference === "reduced" ||
      (motionPreference === "system" && prefersReducedMotion());
    setReducedMotion(nextReducedMotion);
  }, [motionPreference]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isCancelled = false;

    const updateNativeTheme = async (nativeTheme: string) => {
      if (isCancelled) return;
      try {
        await invoke("set_window_theme", { theme: nativeTheme });
      } catch (error) {
        console.debug("Failed to set native window theme:", error);
      }
    };

    if (theme === "system") {
      updateNativeTheme("system");
    } else {
      updateNativeTheme(theme);
    }

    return () => {
      isCancelled = true;
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      accentTheme,
      uiDensity,
      motionPreference,
      reducedMotion,
      setTheme: (nextTheme: Theme, event?: React.MouseEvent) => {
        if (nextTheme === theme) return;

        const x = event?.clientX ?? window.innerWidth / 2;
        const y = event?.clientY ?? window.innerHeight / 2;
        document.documentElement.style.setProperty(
          "--theme-transition-x",
          `${x}px`,
        );
        document.documentElement.style.setProperty(
          "--theme-transition-y",
          `${y}px`,
        );

        if (document.startViewTransition && !reducedMotion) {
          document.startViewTransition(() => {
            setThemeState(nextTheme);
          });
        } else {
          setThemeState(nextTheme);
        }
      },
      setAccentTheme: (
        nextAccentTheme: AccentTheme,
        event?: React.MouseEvent,
      ) => {
        if (nextAccentTheme === accentTheme) return;

        const x = event?.clientX ?? window.innerWidth / 2;
        const y = event?.clientY ?? window.innerHeight / 2;
        document.documentElement.style.setProperty(
          "--theme-transition-x",
          `${x}px`,
        );
        document.documentElement.style.setProperty(
          "--theme-transition-y",
          `${y}px`,
        );

        if (document.startViewTransition && !reducedMotion) {
          document.startViewTransition(() => {
            setAccentThemeState(nextAccentTheme);
          });
        } else {
          setAccentThemeState(nextAccentTheme);
        }
      },
      setUiDensity: (nextUiDensity: UiDensity) => {
        setUiDensityState(nextUiDensity);
      },
      setMotionPreference: (nextMotionPreference: MotionPreference) => {
        setMotionPreferenceState(nextMotionPreference);
      },
    }),
    [
      accentTheme,
      motionPreference,
      reducedMotion,
      resolvedTheme,
      theme,
      uiDensity,
    ],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
