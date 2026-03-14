import type { AppId } from "@/lib/api";
import type { VisibleApps } from "@/types";
import { ProviderIcon } from "@/components/ProviderIcon";
import { cn } from "@/lib/utils";

interface AppSwitcherProps {
  activeApp: AppId;
  onSwitch: (app: AppId) => void;
  visibleApps?: VisibleApps;
  compact?: boolean;
  className?: string;
}

const ALL_APPS: AppId[] = ["claude", "codex", "gemini", "opencode", "openclaw"];
const STORAGE_KEY = "codebox-last-app";

const APP_META: Record<AppId, { icon: string; label: string; hint: string }> = {
  claude: {
    icon: "claude",
    label: "Claude",
    hint: "Anthropic workflow console",
  },
  codex: {
    icon: "openai",
    label: "Codex",
    hint: "OpenAI coding runtime",
  },
  gemini: {
    icon: "gemini",
    label: "Gemini",
    hint: "Google model workspace",
  },
  opencode: {
    icon: "opencode",
    label: "OpenCode",
    hint: "Open router style runtime",
  },
  openclaw: {
    icon: "openclaw",
    label: "OpenClaw",
    hint: "Workspace and agent control",
  },
};

export function AppSwitcher({
  activeApp,
  onSwitch,
  visibleApps,
  compact = false,
  className,
}: AppSwitcherProps) {
  const appsToShow = ALL_APPS.filter((app) =>
    visibleApps ? visibleApps[app] : true,
  );

  const handleSwitch = (app: AppId) => {
    if (app === activeApp) return;
    localStorage.setItem(STORAGE_KEY, app);
    onSwitch(app);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-[24px] border border-border/70 bg-background/76 p-1.5 shadow-[0_18px_44px_-34px_hsl(var(--shadow-color)/0.7)]",
        className,
      )}
    >
      {appsToShow.map((app) => {
        const meta = APP_META[app];
        const isActive = activeApp === app;

        return (
          <button
            key={app}
            type="button"
            onClick={() => handleSwitch(app)}
            title={meta.hint}
            aria-label={meta.label}
            className={cn(
              "group inline-flex h-11 items-center rounded-[18px] px-3.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.98)_0%,hsl(var(--surface-3)/0.9)_100%)] text-foreground shadow-[0_12px_30px_-22px_hsl(var(--shadow-color)/0.8)]"
                : "text-muted-foreground hover:bg-background/82 hover:text-foreground",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors",
                isActive
                  ? "bg-background/92 text-primary"
                  : "bg-transparent",
              )}
            >
              <ProviderIcon icon={meta.icon} name={meta.label} size={20} />
            </div>
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap text-left font-semibold transition-all duration-200",
                compact
                  ? "ml-0 max-w-0 opacity-0"
                  : "ml-2.5 max-w-[88px] opacity-100",
              )}
            >
              {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
