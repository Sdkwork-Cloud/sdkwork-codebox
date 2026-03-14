import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AppId } from "@/lib/api";
import type { VisibleApps } from "@/types";
import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/components/ProviderIcon";
import { cn } from "@/lib/utils";
import { UpdateBadge } from "@/shell/UpdateBadge";
import { type ControlCenterView, type Domain } from "./navigation";

interface AppSidebarProps {
  activeApp: AppId;
  activeDomain: Domain;
  controlCenterEntryView?: ControlCenterView;
  isCurrentAppTakeoverActive: boolean;
  isProxyRunning: boolean;
  onOpenControlCenter: (tab: ControlCenterView) => void;
  setActiveApp: (app: AppId) => void;
  visibleApps: VisibleApps;
}

const APP_ORDER: AppId[] = [
  "claude",
  "codex",
  "gemini",
  "opencode",
  "openclaw",
];

const APP_META: Record<AppId, { icon: string; eyebrow: string }> = {
  claude: {
    icon: "claude",
    eyebrow: "Anthropic",
  },
  codex: {
    icon: "openai",
    eyebrow: "OpenAI",
  },
  gemini: {
    icon: "gemini",
    eyebrow: "Google",
  },
  opencode: {
    icon: "opencode",
    eyebrow: "Router",
  },
  openclaw: {
    icon: "openclaw",
    eyebrow: "Workspace",
  },
};

export function AppSidebar({
  activeApp,
  activeDomain,
  controlCenterEntryView = "appearance",
  isCurrentAppTakeoverActive,
  isProxyRunning,
  onOpenControlCenter,
  setActiveApp,
  visibleApps,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const appsToShow = APP_ORDER.filter((app) => visibleApps[app]);
  const settingsActive = activeDomain === "control-center";
  const runtimeStatus =
    isProxyRunning && isCurrentAppTakeoverActive
      ? t("shell.sidebar.runtimeTakeover", {
          defaultValue: "代理运行中，当前产品已接管",
        })
      : isProxyRunning
        ? t("shell.sidebar.runtimeOnline", {
            defaultValue: "代理运行中，等待产品接管",
          })
        : t("shell.sidebar.runtimeStandby", {
            defaultValue: "代理待机",
          });

  return (
    <aside className="app-sidebar-shell relative flex w-[252px] shrink-0 flex-col overflow-hidden rounded-[32px] border border-border/70">
      <div className="app-sidebar-glow pointer-events-none absolute inset-0" />

      <div className="relative flex min-h-0 flex-1 flex-col p-4">
        <div className="rounded-[28px] border border-border/65 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.98)_0%,hsl(var(--surface-3)/0.92)_100%)] px-4 py-4 shadow-[0_24px_60px_-36px_hsl(var(--shadow-color)/0.88)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">
                {t("shell.sidebar.brandEyebrow", {
                  defaultValue: "Control Hub",
                })}
              </div>
              <div className="mt-2 text-[1.15rem] font-semibold tracking-tight text-foreground">
                CodeBox
              </div>
            </div>

            <span
              className={cn(
                "mt-1 inline-flex h-3 w-3 rounded-full",
                isProxyRunning && isCurrentAppTakeoverActive
                  ? "bg-emerald-400 shadow-[0_0_0_8px_rgba(52,211,153,0.12)]"
                  : isProxyRunning
                    ? "bg-sky-400 shadow-[0_0_0_8px_rgba(56,189,248,0.12)]"
                    : "bg-zinc-500 shadow-[0_0_0_8px_rgba(113,113,122,0.12)]",
              )}
            />
          </div>

          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            {runtimeStatus}
          </p>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-3">
            {appsToShow.map((app) => {
              const meta = APP_META[app];
              const isActive = app === activeApp && !settingsActive;

              return (
                <button
                  key={app}
                  type="button"
                  onClick={() => setActiveApp(app)}
                  className={cn(
                    "group relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] border px-4 py-4 text-left transition-all duration-200",
                    isActive
                      ? "border-primary/28 bg-[linear-gradient(180deg,hsl(var(--primary)/0.18)_0%,hsl(var(--primary)/0.08)_100%)] shadow-[0_20px_44px_-34px_hsl(var(--shadow-color)/0.9)]"
                      : "border-border/65 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.88)_0%,hsl(var(--surface-3)/0.74)_100%)] hover:border-border hover:bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.96)_0%,hsl(var(--surface-3)/0.84)_100%)]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border transition-colors",
                      isActive
                        ? "border-primary/26 bg-background/92 text-primary"
                        : "border-border/70 bg-background/74 text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    <ProviderIcon
                      icon={meta.icon}
                      name={t(`apps.${app}`, { defaultValue: app })}
                      size={22}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {meta.eyebrow}
                    </span>
                    <span className="mt-1 block truncate text-[15px] font-semibold text-foreground">
                      {t(`apps.${app}`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <UpdateBadge
            appearance="row"
            className="rounded-[22px] border-border/65 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.9)_0%,hsl(var(--surface-3)/0.78)_100%)]"
            onClick={() => onOpenControlCenter("about")}
          />

          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-auto w-full justify-start gap-3 rounded-[22px] border px-4 py-3 text-left",
              settingsActive
                ? "border-primary/24 bg-primary/10 text-primary hover:bg-primary/12"
                : "border-border/65 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.86)_0%,hsl(var(--surface-3)/0.72)_100%)] text-foreground hover:bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.94)_0%,hsl(var(--surface-3)/0.8)_100%)]",
            )}
            onClick={() => onOpenControlCenter(controlCenterEntryView)}
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-border/70 bg-background/82">
              <Settings2 className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">
                {t("common.settings", { defaultValue: "设置" })}
              </span>
              <span className="mt-1 block max-w-full break-words text-xs leading-5 text-muted-foreground whitespace-normal">
                {t("shell.sidebar.settingsHint", {
                  defaultValue: "主题、目录与同步设置",
                })}
              </span>
            </span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
