import { useCallback, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowLeft, Gauge, Layers3, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { AppId } from "@/lib/api";
import type { OpenClawHealthWarning, Provider, UsageScript } from "@/types";
import { Button } from "@/components/ui/button";
import { ProviderList } from "@/components/providers/ProviderList";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { ProxyTabContent } from "@/components/settings/ProxyTabContent";
import { LogConfigPanel } from "@/components/settings/LogConfigPanel";
import { useSettings, type SettingsFormState } from "@/hooks/useSettings";
import UsageScriptModal from "@/components/UsageScriptModal";
import UnifiedMcpPanel from "@/components/mcp/UnifiedMcpPanel";
import PromptPanel from "@/components/prompts/PromptPanel";
import { SkillsPage } from "@/components/skills/SkillsPage";
import UnifiedSkillsPanel from "@/components/skills/UnifiedSkillsPanel";
import { AgentsPanel } from "@/components/agents/AgentsPanel";
import { UniversalProviderPanel } from "@/components/universal";
import { SessionManagerPage } from "@/components/sessions/SessionManagerPage";
import WorkspaceFilesPanel from "@/components/workspace/WorkspaceFilesPanel";
import EnvPanel from "@/components/openclaw/EnvPanel";
import ToolsPanel from "@/components/openclaw/ToolsPanel";
import AgentsDefaultsPanel from "@/components/openclaw/AgentsDefaultsPanel";
import OpenClawHealthBanner from "@/components/openclaw/OpenClawHealthBanner";
import { ModelTestConfigPanel } from "@/components/usage/ModelTestConfigPanel";
import { UsageDashboard } from "@/components/usage/UsageDashboard";
import { cn } from "@/lib/utils";
import {
  getNavigationTabs,
  getViewDescription,
  getViewTitle,
  type ControlCenterView,
  type Domain,
  type NavigationContext,
  type ProviderConfirmAction,
  type View,
} from "./navigation";

interface AppContentProps {
  activeApp: AppId;
  activeDomain: Domain;
  canGoBack?: boolean;
  currentProviderId: string;
  currentView: View;
  handleDisableOmo: () => void;
  handleDisableOmoSlim: () => void;
  handleDuplicateProvider: (provider: Provider) => Promise<void>;
  handleImportSuccess: () => Promise<void>;
  handleOpenTerminal: (provider: Provider) => Promise<void>;
  handleOpenWebsite: (url: string) => Promise<void>;
  isCurrentAppTakeoverActive: boolean;
  isLoading: boolean;
  isOpenClawView: boolean;
  isProxyRunning: boolean;
  openclawHealthWarnings: OpenClawHealthWarning[];
  promptPanelRef: MutableRefObject<any>;
  mcpPanelRef: MutableRefObject<any>;
  onBack: () => void;
  openContextView: (view: View) => void;
  providers: Record<string, Provider>;
  setConfirmAction: Dispatch<SetStateAction<ProviderConfirmAction | null>>;
  setCurrentView: Dispatch<SetStateAction<View>> | ((view: View) => void);
  setEditingProvider: Dispatch<SetStateAction<Provider | null>>;
  setIsAddOpen: Dispatch<SetStateAction<boolean>>;
  setUsageProvider: Dispatch<SetStateAction<Provider | null>>;
  setAsDefaultModel: (provider: Provider) => Promise<void>;
  skillsPageRef: MutableRefObject<any>;
  switchProvider: (provider: Provider) => Promise<void>;
  unifiedSkillsPanelRef: MutableRefObject<any>;
  returnTarget?: NavigationContext | null;
  usageProvider: Provider | null;
  saveUsageScript: (provider: Provider, script: UsageScript) => Promise<void>;
  effectiveUsageProvider: Provider | null;
  activeProviderId?: string;
}

interface RuntimeConsoleProps {
  activeApp: AppId;
  canGoBack?: boolean;
  currentView: View;
  isCurrentAppTakeoverActive: boolean;
  isProxyRunning: boolean;
  onBack: () => void;
  returnTarget?: NavigationContext | null;
  setCurrentView: Dispatch<SetStateAction<View>> | ((view: View) => void);
  activeProviderId?: string;
}

function SurfaceSection({
  title,
  description,
  children,
  bodyClassName,
}: {
  title: string;
  description: string;
  children: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.94)_0%,hsl(var(--surface-3)/0.9)_100%)] shadow-[0_24px_60px_-36px_hsl(var(--shadow-color)/0.92)]">
      <div className="border-b border-border/65 px-6 py-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className={bodyClassName ?? "p-6"}>{children}</div>
    </section>
  );
}

function RuntimeWorkbenchRail({
  activeApp,
  canGoBack = false,
  currentView,
  isCurrentAppTakeoverActive,
  isProxyRunning,
  onBack,
  returnTarget,
  setCurrentView,
}: RuntimeConsoleProps) {
  const { t } = useTranslation();
  const runtimeTabs = getNavigationTabs(
    "runtime",
    activeApp,
    true,
    currentView,
    t,
  );
  const currentTitle = getViewTitle(currentView, activeApp, t);
  const currentDescription = getViewDescription(currentView, activeApp, t);
  const returnLabel = returnTarget
    ? t("shell.runtime.returnTo", {
        defaultValue: "返回到 {{app}} · {{view}}",
        app: t(`apps.${returnTarget.activeApp}`, {
          defaultValue: returnTarget.activeApp,
        }),
        view: getViewTitle(returnTarget.view, returnTarget.activeApp, t),
      })
    : null;

  return (
    <aside className="xl:sticky xl:top-2 xl:self-start">
      <section className="overflow-hidden rounded-[26px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_24px_58px_-38px_hsl(var(--shadow-color)/0.92)]">
        <header className="border-b border-border/60 bg-background/45 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t("shell.domain.runtime", { defaultValue: "Runtime" })}
          </div>
          <h2 className="mt-3 text-base font-semibold tracking-tight text-foreground">
            {currentTitle}
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {currentDescription}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                isProxyRunning && isCurrentAppTakeoverActive
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : isProxyRunning
                    ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                    : "border-border/60 bg-background/72 text-muted-foreground",
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
          </div>

          {canGoBack && returnLabel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="mt-4 h-auto w-full justify-start gap-2 rounded-[18px] border-border/60 bg-background/75 px-3 py-3 text-left"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{returnLabel}</span>
            </Button>
          ) : null}
        </header>

        <div className="p-2.5">
          <div className="flex w-full flex-col gap-2">
            {runtimeTabs.map((tab) => {
              const isActive = tab.view === currentView;
              return (
                <button
                  key={tab.view}
                  type="button"
                  aria-label={tab.label}
                  onClick={() => setCurrentView(tab.view)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[18px] border px-3 py-3 text-left transition-all",
                    isActive
                      ? "border-primary/24 bg-[linear-gradient(180deg,hsl(var(--primary)/0.14)_0%,hsl(var(--panel-surface)/0.94)_100%)] text-foreground"
                      : "border-border/60 bg-background/62 text-foreground hover:bg-background/82",
                  )}
                >
                  {tab.icon ? (
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/82 text-primary">
                      <tab.icon className="h-4 w-4" />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {tab.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </aside>
  );
}

function RuntimeConsole({
  activeApp,
  canGoBack = false,
  currentView,
  isCurrentAppTakeoverActive,
  isProxyRunning,
  onBack,
  returnTarget,
  setCurrentView,
  activeProviderId,
}: RuntimeConsoleProps) {
  const { t } = useTranslation();
  const { settings, isLoading, updateSettings, autoSaveSettings } =
    useSettings();
  const activeAppLabel = t(`apps.${activeApp}`, { defaultValue: activeApp });

  const runtimeFocus =
    currentView === "runtimeTakeover"
      ? {
          title: t("shell.runtime.console.takeoverTitle", {
            defaultValue: "接管控制",
          }),
          description: t("shell.runtime.console.takeoverDescription", {
            defaultValue:
              "聚焦当前代理服务下的产品接管开关，确保不同产品按照你的运行策略接入代理。",
          }),
          defaultSections: ["proxy"],
          helper: t("shell.runtime.console.takeoverHelper", {
            defaultValue:
              "当前视图已聚焦接管区域。展开 Proxy 面板即可按产品启用或关闭接管。",
          }),
        }
      : currentView === "runtimeFailover"
        ? {
            title: t("shell.runtime.console.failoverTitle", {
              defaultValue: "故障转移",
            }),
            description: t("shell.runtime.console.failoverDescription", {
              defaultValue:
                "聚焦自动故障转移队列、优先级和熔断恢复策略，确保代理链路具备稳定的降级能力。",
            }),
            defaultSections: ["failover"],
            helper: t("shell.runtime.console.failoverHelper", {
              defaultValue:
                "当前视图已聚焦故障转移区域。你可以直接检查队列、优先级和自动切换配置。",
            }),
          }
        : {
            title: t("shell.runtime.console.overviewTitle", {
              defaultValue: "代理、接管与故障转移",
            }),
            description: t("shell.runtime.console.overviewDescription", {
              defaultValue:
                "这里集中放置运行链路控制项。保留原有行为，只将入口迁移到 Runtime 域。",
            }),
            defaultSections: ["proxy", "failover"],
            helper: t("shell.runtime.console.overviewHelper", {
              defaultValue:
                "运行链路控制保持原有能力，只是重新编排到了更清晰的 Runtime 结构里。",
            }),
          };

  const handleAutoSave = useCallback(
    async (updates: Partial<SettingsFormState>) => {
      updateSettings(updates);
      await autoSaveSettings(updates);
    },
    [autoSaveSettings, updateSettings],
  );

  const renderRuntimeBody = () => {
    if (currentView === "runtimeUsage") {
      return (
        <SurfaceSection
          title={t("shell.runtime.console.usageTitle", {
            defaultValue: "运行用量",
          })}
          description={t("shell.runtime.console.usageDescription", {
            defaultValue:
              "从日志、Provider 和模型三个维度审视当前工作区的真实消耗。",
          })}
          bodyClassName="p-4 sm:p-5"
        >
          <UsageDashboard />
        </SurfaceSection>
      );
    }

    if (currentView === "runtimeDiagnostics") {
      return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <SurfaceSection
            title={t("shell.runtime.console.diagnosticsModelTitle", {
              defaultValue: "模型检测",
            })}
            description={t(
              "shell.runtime.console.diagnosticsModelDescription",
              {
                defaultValue: "维护流式检查模型、超时策略和测试提示词。",
              },
            )}
          >
            <ModelTestConfigPanel />
          </SurfaceSection>
          <SurfaceSection
            title={t("shell.runtime.console.diagnosticsLogTitle", {
              defaultValue: "日志级别",
            })}
            description={t("shell.runtime.console.diagnosticsLogDescription", {
              defaultValue: "配置本地日志输出级别，便于排查连接和运行异常。",
            })}
          >
            <LogConfigPanel />
          </SurfaceSection>
        </div>
      );
    }

    return (
      <>
        <div className="mb-5 grid gap-4 xl:grid-cols-3">
          <div className="rounded-[24px] border border-border/70 bg-background/58 p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
                <Gauge className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {t("shell.runtime.console.proxyCardTitle", {
                    defaultValue: "Proxy Runtime",
                  })}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {isProxyRunning
                    ? t("shell.runtime.console.proxyCardOnline", {
                        defaultValue: "服务已启动",
                      })
                    : t("shell.runtime.console.proxyCardStandby", {
                        defaultValue: "当前处于待机状态",
                      })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background/58 p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {t("shell.runtime.console.takeoverCardTitle", {
                    defaultValue: "Takeover",
                  })}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {isCurrentAppTakeoverActive
                    ? t("shell.runtime.console.takeoverCardActive", {
                        defaultValue: "{{app}} 已接管当前产品流量",
                        app: activeAppLabel,
                      })
                    : t("shell.runtime.console.takeoverCardIdle", {
                        defaultValue: "{{app}} 当前未接管流量",
                        app: activeAppLabel,
                      })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background/58 p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Layers3 className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {t("shell.runtime.console.activeTargetTitle", {
                    defaultValue: "Active Target",
                  })}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {activeProviderId ??
                    t("shell.runtime.console.activeTargetEmpty", {
                      defaultValue: "尚未锁定活动目标",
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading || !settings ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-border/65 bg-background/55">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-[24px] border border-border/65 bg-background/55 p-4 text-sm text-muted-foreground">
              {runtimeFocus.helper}
            </div>
            <SurfaceSection
              title={runtimeFocus.title}
              description={runtimeFocus.description}
            >
              <ProxyTabContent
                settings={settings}
                onAutoSave={handleAutoSave}
                defaultSections={runtimeFocus.defaultSections}
              />
            </SurfaceSection>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col px-6 pb-8 pt-6 xl:px-8">
      <div className="grid min-h-0 gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <RuntimeWorkbenchRail
          activeApp={activeApp}
          canGoBack={canGoBack}
          currentView={currentView}
          isCurrentAppTakeoverActive={isCurrentAppTakeoverActive}
          isProxyRunning={isProxyRunning}
          onBack={onBack}
          returnTarget={returnTarget}
          setCurrentView={setCurrentView}
          activeProviderId={activeProviderId}
        />

        <div className="scroll-overlay min-h-0 min-w-0 overflow-y-auto pr-1">
          {renderRuntimeBody()}
        </div>
      </div>
    </div>
  );
}

export function AppContent({
  activeApp,
  activeDomain,
  activeProviderId,
  canGoBack = false,
  currentProviderId,
  currentView,
  effectiveUsageProvider,
  handleDisableOmo,
  handleDisableOmoSlim,
  handleDuplicateProvider,
  handleImportSuccess,
  handleOpenTerminal,
  handleOpenWebsite,
  isCurrentAppTakeoverActive,
  isLoading,
  isOpenClawView,
  isProxyRunning,
  mcpPanelRef,
  onBack,
  openclawHealthWarnings,
  openContextView,
  promptPanelRef,
  providers,
  saveUsageScript,
  setAsDefaultModel,
  setConfirmAction,
  setCurrentView,
  setEditingProvider,
  setIsAddOpen,
  setUsageProvider,
  skillsPageRef,
  switchProvider,
  returnTarget = null,
  unifiedSkillsPanelRef,
  usageProvider,
}: AppContentProps) {
  const navigateBack = onBack;

  const renderProductContent = () => {
    switch (currentView) {
      case "sessions":
        return <SessionManagerPage key={activeApp} appId={activeApp} />;
      case "workspace":
        return <WorkspaceFilesPanel />;
      case "openclawEnv":
        return <EnvPanel />;
      case "openclawTools":
        return <ToolsPanel />;
      case "openclawAgents":
        return <AgentsDefaultsPanel />;
      default:
        return (
          <div
            className="flex h-full min-h-0 flex-col px-8 pb-8 pt-6"
            data-tauri-no-drag
          >
            <div className="scroll-overlay flex-1 overflow-x-hidden overflow-y-auto px-1 pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeApp}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.18 }}
                  className="min-h-full space-y-4"
                >
                  <ProviderList
                    providers={providers}
                    currentProviderId={currentProviderId}
                    appId={activeApp}
                    isLoading={isLoading}
                    isProxyRunning={isProxyRunning}
                    isProxyTakeover={
                      isProxyRunning && isCurrentAppTakeoverActive
                    }
                    activeProviderId={activeProviderId}
                    onSwitch={switchProvider}
                    onEdit={setEditingProvider}
                    onDelete={(provider) =>
                      setConfirmAction({ provider, action: "delete" })
                    }
                    onRemoveFromConfig={
                      activeApp === "opencode" || activeApp === "openclaw"
                        ? (provider) =>
                            setConfirmAction({ provider, action: "remove" })
                        : undefined
                    }
                    onDisableOmo={
                      activeApp === "opencode" ? handleDisableOmo : undefined
                    }
                    onDisableOmoSlim={
                      activeApp === "opencode"
                        ? handleDisableOmoSlim
                        : undefined
                    }
                    onDuplicate={handleDuplicateProvider}
                    onConfigureUsage={setUsageProvider}
                    onOpenWebsite={handleOpenWebsite}
                    onOpenTerminal={
                      activeApp === "claude" ? handleOpenTerminal : undefined
                    }
                    onCreate={() => setIsAddOpen(true)}
                    onSetAsDefault={
                      activeApp === "openclaw" ? setAsDefaultModel : undefined
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        );
    }
  };

  const renderExtensionsContent = () => {
    switch (currentView) {
      case "prompts":
        return (
          <PromptPanel
            ref={promptPanelRef}
            open={true}
            onOpenChange={() => navigateBack()}
            appId={activeApp}
          />
        );
      case "skills":
        return (
          <UnifiedSkillsPanel
            ref={unifiedSkillsPanelRef}
            onOpenDiscovery={() => openContextView("skillsDiscovery")}
          />
        );
      case "skillsDiscovery":
        return (
          <SkillsPage
            ref={skillsPageRef}
            initialApp={
              activeApp === "opencode" || activeApp === "openclaw"
                ? "claude"
                : activeApp
            }
          />
        );
      case "mcp":
        return (
          <UnifiedMcpPanel
            ref={mcpPanelRef}
            onOpenChange={() => navigateBack()}
          />
        );
      case "agents":
        return <AgentsPanel onOpenChange={() => navigateBack()} />;
      case "universal":
        return (
          <div className="px-8 pt-6">
            <UniversalProviderPanel />
          </div>
        );
      default:
        return null;
    }
  };

  const renderControlCenter = () => (
    <SettingsPage
      open={true}
      onOpenChange={() => navigateBack()}
      onImportSuccess={handleImportSuccess}
      defaultTab={currentView as ControlCenterView}
      onTabChange={(tab) => setCurrentView(tab as View)}
      showCloseButton={false}
    />
  );

  const content = (() => {
    if (activeDomain === "runtime") {
      return (
        <RuntimeConsole
          activeApp={activeApp}
          canGoBack={canGoBack}
          currentView={currentView}
          isCurrentAppTakeoverActive={isCurrentAppTakeoverActive}
          isProxyRunning={isProxyRunning}
          onBack={onBack}
          returnTarget={returnTarget}
          setCurrentView={setCurrentView}
          activeProviderId={activeProviderId}
        />
      );
    }

    if (activeDomain === "extensions") {
      return renderExtensionsContent();
    }

    if (activeDomain === "control-center") {
      return renderControlCenter();
    }

    return renderProductContent();
  })();

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden animate-fade-in">
      {isOpenClawView && openclawHealthWarnings.length > 0 && (
        <OpenClawHealthBanner warnings={openclawHealthWarnings} />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeDomain}:${currentView}:${activeApp}`}
          className="flex h-full min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {content}
        </motion.div>
      </AnimatePresence>

      {effectiveUsageProvider && (
        <UsageScriptModal
          key={effectiveUsageProvider.id}
          provider={effectiveUsageProvider}
          appId={activeApp}
          isOpen={Boolean(usageProvider)}
          onClose={() => setUsageProvider(null)}
          onSave={(script) => {
            if (usageProvider) {
              void saveUsageScript(usageProvider, script);
            }
          }}
        />
      )}
    </main>
  );
}
