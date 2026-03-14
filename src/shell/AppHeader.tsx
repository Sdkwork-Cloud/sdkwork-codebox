import {
  ArrowLeft,
  Download,
  FolderArchive,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Waypoints,
} from "lucide-react";
import type { MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import type { AppId } from "@/lib/api";
import { ProxyToggle } from "@/components/proxy/ProxyToggle";
import { FailoverToggle } from "@/components/proxy/FailoverToggle";
import { ProviderIcon } from "@/components/ProviderIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getDomainTitle,
  getNavigationTabs,
  getPrimaryView,
  getViewTitle,
  isProductWorkspaceDomain,
  type Domain,
  type View,
} from "./navigation";

interface AppHeaderProps {
  activeApp: AppId;
  activeDomain: Domain;
  currentView: View;
  runtimeEntryView?: View;
  hasSkillsSupport: boolean;
  isCurrentAppTakeoverActive: boolean;
  isProxyRunning: boolean;
  canGoBack?: boolean;
  onBack?: () => void;
  onOpenAddProvider: () => void;
  openContextView?: (view: View) => void;
  setCurrentView: (view: View) => void;
  promptPanelRef: MutableRefObject<any>;
  mcpPanelRef: MutableRefObject<any>;
  skillsPageRef: MutableRefObject<any>;
  unifiedSkillsPanelRef: MutableRefObject<any>;
  enableLocalProxy?: boolean;
  enableFailoverToggle?: boolean;
  toolbarRef?: MutableRefObject<HTMLDivElement | null>;
  activeProviderId?: string;
}

const APP_ICON_NAME: Record<AppId, string> = {
  claude: "claude",
  codex: "openai",
  gemini: "gemini",
  opencode: "opencode",
  openclaw: "openclaw",
};

export function AppHeader({
  activeApp,
  activeDomain,
  currentView,
  runtimeEntryView = "runtimeProxy",
  enableFailoverToggle,
  enableLocalProxy,
  hasSkillsSupport,
  isCurrentAppTakeoverActive,
  isProxyRunning,
  canGoBack = false,
  mcpPanelRef,
  onBack = () => undefined,
  onOpenAddProvider,
  promptPanelRef,
  setCurrentView,
  openContextView = setCurrentView,
  skillsPageRef,
  toolbarRef,
  unifiedSkillsPanelRef,
  activeProviderId,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const primaryView = getPrimaryView(currentView);
  const tabs = getNavigationTabs(
    activeDomain,
    activeApp,
    hasSkillsSupport,
    currentView,
    t,
  );
  const showBackButton = canGoBack || currentView === "skillsDiscovery";
  const headerDomain = isProductWorkspaceDomain(activeDomain)
    ? activeDomain === "extensions"
      ? "extensions"
      : "products"
    : activeDomain;
  const title = getViewTitle(primaryView, activeApp, t);
  const domainLabel = getDomainTitle(headerDomain, t);
  const appLabel = t(`apps.${activeApp}`);
  const showTabs = activeDomain !== "control-center" && tabs.length > 0;
  const useCompactWorkspaceHeader =
    (activeDomain === "products" || activeDomain === "extensions") && showTabs;
  const showRuntimeToggles =
    currentView === "providers" &&
    activeApp !== "opencode" &&
    activeApp !== "openclaw" &&
    (enableLocalProxy || enableFailoverToggle);
  const shouldShowActiveProviderBadge =
    Boolean(activeProviderId) &&
    (activeDomain === "runtime" ||
      (currentView === "providers" &&
        isProxyRunning &&
        isCurrentAppTakeoverActive));

  return (
    <header className="glass-header relative z-10 shrink-0 px-5 pb-3 pt-3">
      <div
        className="flex min-w-0 flex-wrap items-start justify-between gap-3"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {showBackButton && (
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
                title={t("common.back", { defaultValue: "返回" })}
                aria-label={t("common.back", { defaultValue: "返回" })}
                className="h-10 w-10 rounded-2xl border-border/70 bg-background/70"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            {!useCompactWorkspaceHeader && (
              <span className="inline-flex items-center rounded-full border border-border/70 bg-background/62 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {domainLabel}
              </span>
            )}

            {activeDomain !== "control-center" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/76 px-3 py-1.5 text-xs font-medium text-foreground shadow-[inset_0_1px_0_hsl(var(--shell-highlight)/0.06)]">
                <ProviderIcon
                  icon={APP_ICON_NAME[activeApp]}
                  name={appLabel}
                  size={16}
                />
                {appLabel}
              </span>
            )}

            {useCompactWorkspaceHeader && (
              <span className="inline-flex items-center rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {title}
              </span>
            )}

            {shouldShowActiveProviderBadge ? (
              <span className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                {activeProviderId}
              </span>
            ) : null}

            {activeDomain === "runtime" && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                  isProxyRunning && isCurrentAppTakeoverActive
                    ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : isProxyRunning
                      ? "border border-sky-500/25 bg-sky-500/10 text-sky-300"
                      : "border border-border/70 bg-background/70 text-muted-foreground",
                )}
              >
                {isProxyRunning && isCurrentAppTakeoverActive
                  ? t("shell.header.takeoverActive", {
                      defaultValue: "Takeover active",
                    })
                  : isProxyRunning
                    ? t("shell.header.proxyOnline", {
                        defaultValue: "Proxy online",
                      })
                    : t("shell.header.proxyStandby", {
                        defaultValue: "Proxy standby",
                      })}
              </span>
            )}
          </div>

          <h1
            className={cn(
              "text-[1.35rem] font-semibold tracking-tight text-foreground",
              useCompactWorkspaceHeader ? "sr-only" : "mt-3",
            )}
          >
            {title}
          </h1>
        </div>

        <div
          ref={toolbarRef}
          className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2"
          style={{ WebkitAppRegion: "no-drag" } as any}
        >
          {activeDomain !== "control-center" && (
            <Button
              variant={activeDomain === "runtime" ? "default" : "outline"}
              size="sm"
              onClick={() => openContextView(runtimeEntryView)}
              className={cn(
                "rounded-2xl px-4 shadow-[0_14px_30px_-24px_hsl(var(--shadow-color)/0.88)]",
                activeDomain !== "runtime" &&
                  "border-border/70 bg-background/80",
              )}
            >
              <Waypoints className="h-4 w-4" />
              {t("shell.domain.runtime", { defaultValue: "Runtime" })}
            </Button>
          )}

          {showRuntimeToggles && (
            <div className="flex items-center gap-2 rounded-[20px] border border-border/70 bg-background/68 p-2">
              {enableLocalProxy && <ProxyToggle activeApp={activeApp} />}
              {enableFailoverToggle && <FailoverToggle activeApp={activeApp} />}
            </div>
          )}

          {currentView === "providers" && (
            <Button
              variant="default"
              size="sm"
              onClick={onOpenAddProvider}
              className="rounded-2xl px-4"
            >
              <Plus className="h-4 w-4" />
              {t("provider.addProvider")}
            </Button>
          )}

          {primaryView === "prompts" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => promptPanelRef.current?.openAdd()}
              className="rounded-2xl border-border/70 bg-background/80"
            >
              <Plus className="h-4 w-4" />
              {t("prompts.add")}
            </Button>
          )}

          {primaryView === "mcp" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mcpPanelRef.current?.openImport()}
                className="rounded-2xl border-border/70 bg-background/80"
              >
                <Download className="h-4 w-4" />
                {t("mcp.importExisting")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mcpPanelRef.current?.openAdd()}
                className="rounded-2xl border-border/70 bg-background/80"
              >
                <Plus className="h-4 w-4" />
                {t("mcp.addMcp")}
              </Button>
            </>
          )}

          {primaryView === "skills" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  unifiedSkillsPanelRef.current?.openInstallFromZip()
                }
                className="rounded-2xl border-border/70 bg-background/80"
              >
                <FolderArchive className="h-4 w-4" />
                {t("skills.installFromZip.button")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => unifiedSkillsPanelRef.current?.openImport()}
                className="rounded-2xl border-border/70 bg-background/80"
              >
                <Download className="h-4 w-4" />
                {t("skills.import")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openContextView("skillsDiscovery")}
                className="rounded-2xl border-border/70 bg-background/80"
              >
                <Search className="h-4 w-4" />
                {t("skills.discover")}
              </Button>
            </>
          )}

          {currentView === "skillsDiscovery" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => skillsPageRef.current?.refresh()}
                className="rounded-2xl border-border/70 bg-background/80"
              >
                <RefreshCw className="h-4 w-4" />
                {t("skills.refresh")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => skillsPageRef.current?.openRepoManager()}
                className="rounded-2xl border-border/70 bg-background/80"
              >
                <Settings2 className="h-4 w-4" />
                {t("skills.repoManager")}
              </Button>
            </>
          )}
        </div>
      </div>

      {showTabs && (
        <div
          className={cn(
            "overflow-x-auto pb-1",
            useCompactWorkspaceHeader ? "mt-3" : "mt-4",
          )}
          role="tablist"
          aria-label={activeDomain === "runtime" ? domainLabel : appLabel}
        >
          <div className="inline-flex min-w-full items-center gap-1.5 rounded-[24px] border border-border/60 bg-background/34 p-1.5 shadow-[inset_0_1px_0_hsl(var(--shell-highlight)/0.05)]">
            {tabs.map((tab) => {
              const isActive = tab.view === primaryView;

              return (
                <button
                  key={tab.view}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setCurrentView(tab.view)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-[18px] border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "border-primary/22 bg-[linear-gradient(180deg,hsl(var(--primary)/0.16)_0%,hsl(var(--primary)/0.08)_100%)] text-primary shadow-[0_14px_34px_-24px_hsl(var(--primary)/0.52)]"
                      : "border-transparent bg-transparent text-muted-foreground hover:border-border/65 hover:bg-background/72 hover:text-foreground",
                  )}
                  title={tab.description}
                >
                  {tab.icon ? (
                    <tab.icon className="h-4 w-4 shrink-0 opacity-80" />
                  ) : null}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
