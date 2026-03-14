import type { ComponentType, MouseEvent, ReactNode } from "react";
import { Monitor, Moon, Palette, Sparkles, Sun, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { SettingsFormState } from "@/hooks/useSettings";
import {
  accentThemeOptions,
  densityOptions,
  motionPreferenceOptions,
  useTheme,
} from "@/components/theme-provider";
import type {
  MotionPreference,
  ThemeMode,
  ThemePalette,
  UiDensity,
} from "@/types";

interface ThemeSettingsProps {
  settings: SettingsFormState;
  onChange: (updates: Partial<SettingsFormState>) => void | Promise<void>;
}

export function ThemeSettings({ settings, onChange }: ThemeSettingsProps) {
  const { t } = useTranslation();
  const {
    accentTheme,
    motionPreference,
    setAccentTheme,
    setMotionPreference,
    setTheme,
    setUiDensity,
    theme,
    uiDensity,
  } = useTheme();

  const handleThemeModeChange = (
    nextThemeMode: ThemeMode,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    setTheme(nextThemeMode, event);
    void onChange({ themeMode: nextThemeMode });
  };

  const handleThemePaletteChange = (
    nextThemePalette: ThemePalette,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    setAccentTheme(nextThemePalette, event);
    void onChange({ themePalette: nextThemePalette });
  };

  const handleDensityChange = (nextDensity: UiDensity) => {
    setUiDensity(nextDensity);
    void onChange({ uiDensity: nextDensity });
  };

  const handleMotionPreferenceChange = (
    nextMotionPreference: MotionPreference,
  ) => {
    setMotionPreference(nextMotionPreference);
    void onChange({ motionPreference: nextMotionPreference });
  };

  return (
    <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
      <div className="space-y-5">
        <ControlCard
          title="界面模式"
          description="深色为默认控制台基底，浅色和跟随系统适合不同桌面环境与演示场景。"
          icon={Sparkles}
        >
          <div className="grid gap-3 xl:grid-cols-3">
            <ThemeCard
              active={theme === "light"}
              onClick={(event) => handleThemeModeChange("light", event)}
              icon={Sun}
              title={t("settings.themeLight")}
              description="更轻盈的桌面层次，适合白天和浅色系统。"
              previewClassName="border-[#dbe4f3] bg-[linear-gradient(180deg,#eef3fb_0%,#ffffff_100%)]"
            />
            <ThemeCard
              active={theme === "dark"}
              onClick={(event) => handleThemeModeChange("dark", event)}
              icon={Moon}
              title={t("settings.themeDark")}
              description="默认控制台模式，贴近 claw-studio 的深色表层。"
              previewClassName="border-[#273041] bg-[linear-gradient(180deg,#171b23_0%,#090b11_100%)]"
            />
            <ThemeCard
              active={theme === "system"}
              onClick={(event) => handleThemeModeChange("system", event)}
              icon={Monitor}
              title={t("settings.themeSystem")}
              description="跟随系统明暗切换，保持桌面级原生一致性。"
              previewClassName="border-[#d3d9e4] bg-[linear-gradient(135deg,#eef3fb_0%,#ffffff_48%,#171b23_52%,#090b11_100%)]"
            />
          </div>
        </ControlCard>

        <ControlCard
          title="行业主题色板"
          description="影响主按钮、选中态、聚焦描边和页面氛围，让控制台风格更加明确。"
          icon={Palette}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {accentThemeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(event) =>
                  handleThemePaletteChange(option.value, event)
                }
                className={cn(
                  "group rounded-[22px] border p-3 text-left transition-all duration-200",
                  accentTheme === option.value ||
                    settings.themePalette === option.value
                    ? "border-primary/35 bg-primary/8 shadow-[0_16px_36px_-26px_hsl(var(--primary)/0.55)]"
                    : "border-border/70 bg-background/70 hover:border-border hover:bg-background",
                )}
              >
                <div className="flex items-start gap-3">
                  <AccentSwatch accentTheme={option.value} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{option.label}</div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ControlCard>
      </div>

      <div className="space-y-5">
        <ControlCard
          title="界面密度"
          description="决定控制台的留白和阅读节奏，适配不同的信息承载偏好。"
          icon={Sparkles}
        >
          <div className="grid gap-3">
            {densityOptions.map((option) => (
              <SelectionRow
                key={option.value}
                active={
                  uiDensity === option.value ||
                  settings.uiDensity === option.value
                }
                title={option.label}
                description={option.description}
                onClick={() => handleDensityChange(option.value)}
              >
                <DensityPreview density={option.value} />
              </SelectionRow>
            ))}
          </div>
        </ControlCard>

        <ControlCard
          title="动态效果"
          description="根据桌面设备和个人偏好控制切换动画、视图过渡和反馈强度。"
          icon={Waves}
        >
          <div className="grid gap-3">
            {motionPreferenceOptions.map((option) => (
              <SelectionRow
                key={option.value}
                active={
                  motionPreference === option.value ||
                  settings.motionPreference === option.value
                }
                title={option.label}
                description={option.description}
                onClick={() => handleMotionPreferenceChange(option.value)}
              >
                <span className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-2xl border border-border/70 bg-background/70 px-3 text-xs font-medium text-muted-foreground">
                  {option.value === "system"
                    ? "System"
                    : option.value === "full"
                      ? "120%"
                      : "40%"}
                </span>
              </SelectionRow>
            ))}
          </div>
        </ControlCard>
      </div>
    </section>
  );
}

function ControlCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-border/60 bg-card/85 p-5 shadow-[0_18px_46px_-32px_hsl(var(--shadow-color)/0.76)]">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </header>
      <div className="mt-4">{children}</div>
    </div>
  );
}

interface ThemeCardProps {
  active: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  icon: ComponentType<{ className?: string }>;
  title: ReactNode;
  description: ReactNode;
  previewClassName: string;
}

function ThemeCard({
  active,
  onClick,
  icon: Icon,
  title,
  description,
  previewClassName,
}: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[22px] border p-3 text-left transition-all duration-200",
        active
          ? "border-primary/35 bg-primary/8 shadow-[0_16px_36px_-26px_hsl(var(--primary)/0.55)]"
          : "border-border/70 bg-background/70 hover:border-border hover:bg-background",
      )}
    >
      <div className={cn("mb-3 h-24 rounded-xl border", previewClassName)} />
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </button>
  );
}

function SelectionRow({
  active,
  title,
  description,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-4 rounded-[22px] border p-4 text-left transition-all duration-200",
        active
          ? "border-primary/35 bg-primary/8 shadow-[0_16px_36px_-26px_hsl(var(--primary)/0.55)]"
          : "border-border/70 bg-background/70 hover:border-border hover:bg-background",
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </button>
  );
}

function AccentSwatch({ accentTheme }: { accentTheme: ThemePalette }) {
  const swatchClassName =
    accentTheme === "lobster"
      ? "from-[#ff8759] to-[#ff5b47]"
      : accentTheme === "tech-blue"
        ? "from-[#5bb7ff] to-[#246bff]"
        : accentTheme === "green-tech"
          ? "from-[#4ade80] to-[#059669]"
          : accentTheme === "zinc"
            ? "from-[#d4d4d8] to-[#52525b]"
            : accentTheme === "violet"
              ? "from-[#a78bfa] to-[#6d28d9]"
              : "from-[#fb7185] to-[#e11d48]";

  return (
    <span
      className={cn(
        "mt-0.5 inline-flex h-10 w-10 shrink-0 rounded-xl border border-white/40 bg-gradient-to-br shadow-inner",
        swatchClassName,
      )}
    />
  );
}

function DensityPreview({ density }: { density: UiDensity }) {
  return (
    <span className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-2xl border border-border/70 bg-background/70 px-3">
      <span
        className={cn(
          "grid w-full gap-1.5",
          density === "compact" ? "text-[10px]" : "text-[11px]",
        )}
      >
        <span className="h-1.5 rounded-full bg-primary/70" />
        <span className="h-1.5 rounded-full bg-muted-foreground/40" />
        <span
          className={cn(
            "rounded-full bg-muted-foreground/30",
            density === "compact" ? "h-1" : "h-1.5",
          )}
        />
      </span>
    </span>
  );
}
