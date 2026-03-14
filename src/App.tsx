import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { Provider, VisibleApps } from "@/types";
import type { EnvConflict } from "@/types/env";
import { useProvidersQuery, useSettingsQuery } from "@/lib/query";
import { providersApi, settingsApi, type AppId } from "@/lib/api";
import { checkAllEnvConflicts } from "@/lib/api/env";
import { openclawKeys } from "@/lib/query/openclawKeys";
import { useProviderActions } from "@/hooks/useProviderActions";
import { useOpenClawHealth } from "@/hooks/useOpenClaw";
import { useProxyStatus } from "@/hooks/useProxyStatus";
import { useLastValidValue } from "@/hooks/useLastValidValue";
import { extractErrorMessage } from "@/utils/errorUtils";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";
import { EditProviderDialog } from "@/components/providers/EditProviderDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EnvWarningBanner } from "@/components/env/EnvWarningBanner";
import { DeepLinkImportDialog } from "@/components/DeepLinkImportDialog";
import {
  useDisableCurrentOmo,
  useDisableCurrentOmoSlim,
} from "@/lib/query/omo";
import { AppContent } from "./shell/AppContent";
import { AppHeader } from "./shell/AppHeader";
import {
  DRAG_BAR_HEIGHT,
  getBackView,
  getDomainForView,
  getFirstVisibleApp,
  getInitialApp,
  getInitialDomain,
  getInitialProductViewState,
  getInitialViewState,
  normalizeViewState,
  persistNavigationState,
  resolveViewForDomain,
  type ControlCenterView,
  type Domain,
  type NavigationContext,
  type DomainViewState,
  type ProductViewState,
  type ProviderConfirmAction,
  type View,
} from "./shell/navigation";
import { AppSidebar } from "./shell/AppSidebar";
import { useShellEffects } from "./shell/useShellEffects";

function App() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hasSkillsSupport = true;
  const initialApp = getInitialApp();

  const [activeApp, setActiveApp] = useState<AppId>(initialApp);
  const [activeDomain, setActiveDomain] = useState<Domain>(() =>
    getInitialDomain(initialApp, hasSkillsSupport),
  );
  const [viewState, setViewState] = useState<DomainViewState>(() =>
    getInitialViewState(initialApp, hasSkillsSupport),
  );
  const [productViewState, setProductViewState] = useState<ProductViewState>(
    () => getInitialProductViewState(hasSkillsSupport),
  );
  const [navigationHistory, setNavigationHistory] = useState<
    NavigationContext[]
  >([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const currentView =
    activeDomain === "products"
      ? productViewState[activeApp]
      : viewState[activeDomain];
  const currentContextRef = useRef<NavigationContext>({
    activeApp,
    activeDomain,
    view: currentView,
  });
  const navigationHistoryRef = useRef<NavigationContext[]>([]);

  useEffect(() => {
    currentContextRef.current = {
      activeApp,
      activeDomain,
      view: currentView,
    };
  }, [activeApp, activeDomain, currentView]);

  useEffect(() => {
    navigationHistoryRef.current = navigationHistory;
  }, [navigationHistory]);

  useEffect(() => {
    persistNavigationState(
      activeDomain,
      {
        ...viewState,
        products: productViewState[activeApp],
      },
      productViewState,
    );
  }, [activeApp, activeDomain, productViewState, viewState]);

  const { data: settingsData } = useSettingsQuery();
  const visibleApps: VisibleApps = settingsData?.visibleApps ?? {
    claude: true,
    codex: true,
    gemini: true,
    opencode: true,
    openclaw: true,
  };

  useEffect(() => {
    setNavigationHistory((prev) => {
      const next = prev.filter((entry) => visibleApps[entry.activeApp]);
      return next.length === prev.length ? prev : next;
    });
  }, [visibleApps]);

  useEffect(() => {
    if (!visibleApps[activeApp]) {
      const nextApp = getFirstVisibleApp(visibleApps);
      setNavigationHistory([]);
      setActiveApp(nextApp);
      setViewState((prev) =>
        normalizeViewState(
          nextApp,
          {
            ...prev,
            products: productViewState[nextApp],
          },
          hasSkillsSupport,
        ),
      );
    }
  }, [visibleApps, activeApp, hasSkillsSupport, productViewState]);

  const applyViewChange = useCallback(
    (targetApp: AppId, nextView: View) => {
      const nextDomain = getDomainForView(nextView);
      const resolvedView = resolveViewForDomain(
        nextDomain,
        nextView,
        targetApp,
        hasSkillsSupport,
      ) as View;
      const resolvedProductView =
        nextDomain === "products"
          ? (resolvedView as ProductViewState[AppId])
          : productViewState[targetApp];

      if (nextDomain === "products") {
        setProductViewState((prev) => ({
          ...prev,
          [targetApp]: resolvedProductView as ProductViewState[AppId],
        }));
      }

      setViewState((prev) =>
        normalizeViewState(
          targetApp,
          {
            ...prev,
            products: resolvedProductView,
            [nextDomain]: resolvedView,
          },
          hasSkillsSupport,
        ),
      );
      setActiveApp(targetApp);
      setActiveDomain(nextDomain);
    },
    [hasSkillsSupport, productViewState],
  );

  const handleSelectApp = useCallback(
    (nextApp: AppId) => {
      setNavigationHistory([]);
      setActiveApp(nextApp);
      setViewState((prev) =>
        normalizeViewState(
          nextApp,
          {
            ...prev,
            products: productViewState[nextApp],
          },
          hasSkillsSupport,
        ),
      );
      setActiveDomain("products");
    },
    [hasSkillsSupport, productViewState],
  );

  const pushNavigationContext = useCallback((context: NavigationContext) => {
    const lastContext = navigationHistoryRef.current.at(-1);
    const isDuplicate =
      lastContext?.activeApp === context.activeApp &&
      lastContext.activeDomain === context.activeDomain &&
      lastContext.view === context.view;

    if (!isDuplicate) {
      setNavigationHistory((prev) => [...prev, context]);
    }
  }, []);

  const handleSetCurrentView = useCallback(
    (nextView: View) => {
      const currentContext = currentContextRef.current;
      const nextDomain = getDomainForView(nextView);
      const resolvedNextView = resolveViewForDomain(
        nextDomain,
        nextView,
        activeApp,
        hasSkillsSupport,
      ) as View;
      const isSameContext =
        currentContext.activeApp === activeApp &&
        currentContext.activeDomain === nextDomain &&
        currentContext.view === resolvedNextView;
      const shouldPreserveReturnTarget =
        (currentContext.activeDomain === "products" &&
          nextDomain === "extensions") ||
        (currentContext.activeDomain === nextDomain &&
          nextDomain !== "products");

      if (isSameContext) {
        return;
      }

      if (shouldPreserveReturnTarget) {
        pushNavigationContext(currentContext);
      } else if (nextDomain === "products") {
        setNavigationHistory([]);
      }
      applyViewChange(activeApp, resolvedNextView);
    },
    [activeApp, applyViewChange, hasSkillsSupport, pushNavigationContext],
  );

  const handleOpenContextView = useCallback(
    (nextView: View) => {
      const currentContext = currentContextRef.current;
      const nextDomain = getDomainForView(nextView);
      const resolvedNextView = resolveViewForDomain(
        nextDomain,
        nextView,
        activeApp,
        hasSkillsSupport,
      ) as View;
      const isSameContext =
        currentContext.activeApp === activeApp &&
        currentContext.activeDomain === nextDomain &&
        currentContext.view === resolvedNextView;

      if (isSameContext) {
        return;
      }

      pushNavigationContext(currentContext);

      applyViewChange(activeApp, resolvedNextView);
    },
    [activeApp, applyViewChange, hasSkillsSupport, pushNavigationContext],
  );

  const resolveFallbackBackView = useCallback(
    (context: NavigationContext): View => {
      if (context.view === "skillsDiscovery") {
        return "skills";
      }

      if (context.activeDomain === "products") {
        return getBackView(context.view);
      }

      return productViewState[context.activeApp];
    },
    [productViewState],
  );

  const handleNavigateBack = useCallback(() => {
    const currentContext = currentContextRef.current;
    const lastContext = navigationHistoryRef.current.at(-1);

    if (lastContext) {
      setNavigationHistory((prev) => prev.slice(0, -1));
      applyViewChange(lastContext.activeApp, lastContext.view);
      return;
    }

    const fallbackView = resolveFallbackBackView(currentContext);

    if (fallbackView === currentContext.view) {
      return;
    }

    applyViewChange(currentContext.activeApp, fallbackView);
  }, [applyViewChange, resolveFallbackBackView]);

  const canGoBack = navigationHistory.length > 0 || activeDomain !== "products";

  const returnTarget = useMemo<NavigationContext | null>(() => {
    const lastContext = navigationHistory.at(-1);
    if (lastContext) {
      return lastContext;
    }

    const currentContext = currentContextRef.current;
    const fallbackView = resolveFallbackBackView(currentContext);
    if (fallbackView === currentContext.view) {
      return null;
    }

    return {
      activeApp: currentContext.activeApp,
      activeDomain: getDomainForView(fallbackView),
      view: fallbackView,
    };
  }, [navigationHistory, resolveFallbackBackView]);

  const handleOpenControlCenter = useCallback(
    (tab: ControlCenterView) => {
      handleOpenContextView(tab);
    },
    [handleOpenContextView],
  );

  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [usageProvider, setUsageProvider] = useState<Provider | null>(null);
  const [confirmAction, setConfirmAction] =
    useState<ProviderConfirmAction | null>(null);
  const [envConflicts, setEnvConflicts] = useState<EnvConflict[]>([]);
  const [showEnvBanner, setShowEnvBanner] = useState(false);

  const effectiveEditingProvider = useLastValidValue(editingProvider);
  const effectiveUsageProvider = useLastValidValue(usageProvider);

  const promptPanelRef = useRef<any>(null);
  const mcpPanelRef = useRef<any>(null);
  const skillsPageRef = useRef<any>(null);
  const unifiedSkillsPanelRef = useRef<any>(null);
  const {
    isRunning: isProxyRunning,
    takeoverStatus,
    status: proxyStatus,
  } = useProxyStatus();
  const isCurrentAppTakeoverActive = takeoverStatus?.[activeApp] || false;
  const activeProviderId = useMemo(() => {
    const target = proxyStatus?.active_targets?.find(
      (t) => t.app_type === activeApp,
    );
    return target?.provider_id;
  }, [proxyStatus?.active_targets, activeApp]);

  const { data, isLoading, refetch } = useProvidersQuery(activeApp, {
    isProxyRunning,
  });
  const providers = useMemo(() => data?.providers ?? {}, [data]);
  const currentProviderId = data?.currentProviderId ?? "";
  const isOpenClawView =
    activeApp === "openclaw" &&
    activeDomain === "products" &&
    (currentView === "providers" ||
      currentView === "workspace" ||
      currentView === "sessions" ||
      currentView === "openclawEnv" ||
      currentView === "openclawTools" ||
      currentView === "openclawAgents");
  const { data: openclawHealthWarnings = [] } =
    useOpenClawHealth(isOpenClawView);

  const {
    addProvider,
    updateProvider,
    switchProvider,
    deleteProvider,
    saveUsageScript,
    setAsDefaultModel,
  } = useProviderActions(activeApp);

  const disableOmoMutation = useDisableCurrentOmo();
  const handleDisableOmo = () => {
    disableOmoMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("omo.disabled", { defaultValue: "OMO 已停用" }));
      },
      onError: (error: Error) => {
        toast.error(
          t("omo.disableFailed", {
            defaultValue: "停用 OMO 失败: {{error}}",
            error: extractErrorMessage(error),
          }),
        );
      },
    });
  };

  const disableOmoSlimMutation = useDisableCurrentOmoSlim();
  const handleDisableOmoSlim = () => {
    disableOmoSlimMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("omo.disabled", { defaultValue: "OMO 已停用" }));
      },
      onError: (error: Error) => {
        toast.error(
          t("omo.disableFailed", {
            defaultValue: "停用 OMO 失败: {{error}}",
            error: extractErrorMessage(error),
          }),
        );
      },
    });
  };

  useShellEffects({
    activeApp,
    activeDomain,
    currentView,
    navigateBack: handleNavigateBack,
    openContextView: handleOpenContextView,
    queryClient,
    refetchProviders: refetch,
    setEnvConflicts,
    setShowEnvBanner,
    t,
  });

  const handleOpenWebsite = async (url: string) => {
    try {
      await settingsApi.openExternal(url);
    } catch (error) {
      const detail =
        extractErrorMessage(error) ||
        t("notifications.openLinkFailed", {
          defaultValue: "链接打开失败",
        });
      toast.error(detail);
    }
  };

  const handleEditProvider = async (provider: Provider) => {
    await updateProvider(provider);
    setEditingProvider(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { provider, action } = confirmAction;

    if (action === "remove") {
      // Remove from live config only (for additive mode apps like OpenCode/OpenClaw)
      // Does NOT delete from database - provider remains in the list
      await providersApi.removeFromLiveConfig(provider.id, activeApp);
      // Invalidate queries to refresh the isInConfig state
      if (activeApp === "opencode") {
        await queryClient.invalidateQueries({
          queryKey: ["opencodeLiveProviderIds"],
        });
      } else if (activeApp === "openclaw") {
        await queryClient.invalidateQueries({
          queryKey: openclawKeys.liveProviderIds,
        });
        await queryClient.invalidateQueries({
          queryKey: openclawKeys.health,
        });
      }
      toast.success(
        t("notifications.removeFromConfigSuccess", {
          defaultValue: "已从配置移除",
        }),
        { closeButton: true },
      );
    } else {
      await deleteProvider(provider.id);
    }
    setConfirmAction(null);
  };

  const generateUniqueOpencodeKey = (
    originalKey: string,
    existingKeys: string[],
  ): string => {
    const baseKey = `${originalKey}-copy`;

    if (!existingKeys.includes(baseKey)) {
      return baseKey;
    }

    let counter = 2;
    while (existingKeys.includes(`${baseKey}-${counter}`)) {
      counter++;
    }
    return `${baseKey}-${counter}`;
  };

  const handleDuplicateProvider = async (provider: Provider) => {
    const newSortIndex =
      provider.sortIndex !== undefined ? provider.sortIndex + 1 : undefined;

    const duplicatedProvider: Omit<Provider, "id" | "createdAt"> & {
      providerKey?: string;
    } = {
      name: `${provider.name} copy`,
      settingsConfig: JSON.parse(JSON.stringify(provider.settingsConfig)), // 深拷贝
      websiteUrl: provider.websiteUrl,
      category: provider.category,
      sortIndex: newSortIndex, // 复制原 sortIndex + 1
      meta: provider.meta
        ? JSON.parse(JSON.stringify(provider.meta))
        : undefined, // 深拷贝
      icon: provider.icon,
      iconColor: provider.iconColor,
    };

    if (activeApp === "opencode") {
      const existingKeys = Object.keys(providers);
      duplicatedProvider.providerKey = generateUniqueOpencodeKey(
        provider.id,
        existingKeys,
      );
    }

    if (provider.sortIndex !== undefined) {
      const updates = Object.values(providers)
        .filter(
          (p) =>
            p.sortIndex !== undefined &&
            p.sortIndex >= newSortIndex! &&
            p.id !== provider.id,
        )
        .map((p) => ({
          id: p.id,
          sortIndex: p.sortIndex! + 1,
        }));

      if (updates.length > 0) {
        try {
          await providersApi.updateSortOrder(updates, activeApp);
        } catch (error) {
          console.error("[App] Failed to update sort order", error);
          toast.error(
            t("provider.sortUpdateFailed", {
              defaultValue: "排序更新失败",
            }),
          );
          return; // 如果排序更新失败，不继续添加
        }
      }
    }

    await addProvider(duplicatedProvider);
  };

  const handleOpenTerminal = async (provider: Provider) => {
    try {
      await providersApi.openTerminal(provider.id, activeApp);
      toast.success(
        t("provider.terminalOpened", {
          defaultValue: "终端已打开",
        }),
      );
    } catch (error) {
      console.error("[App] Failed to open terminal", error);
      const errorMessage = extractErrorMessage(error);
      toast.error(
        t("provider.terminalOpenFailed", {
          defaultValue: "打开终端失败",
        }) + (errorMessage ? `: ${errorMessage}` : ""),
      );
    }
  };

  const handleImportSuccess = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["providers"],
        refetchType: "all",
      });
      await queryClient.refetchQueries({
        queryKey: ["providers"],
        type: "all",
      });
    } catch (error) {
      console.error("[App] Failed to refresh providers after import", error);
      await refetch();
    }
    try {
      await providersApi.updateTrayMenu();
    } catch (error) {
      console.error("[App] Failed to refresh tray menu", error);
    }
  };

  const handleNavigateToProviderImport = useCallback(
    (app: AppId) => {
      setNavigationHistory([]);
      applyViewChange(app, "providers");
    },
    [applyViewChange],
  );

  return (
    <div
      className="app-shell relative flex h-screen flex-col overflow-hidden text-foreground selection:bg-primary/30"
      style={{ overflowX: "hidden", paddingTop: DRAG_BAR_HEIGHT }}
    >
      <div className="app-shell-overlay pointer-events-none absolute inset-0" />
      <div
        className="fixed top-0 left-0 right-0 z-[60]"
        data-tauri-drag-region
        style={{ WebkitAppRegion: "drag", height: DRAG_BAR_HEIGHT } as any}
      />
      {showEnvBanner && envConflicts.length > 0 && (
        <EnvWarningBanner
          conflicts={envConflicts}
          onDismiss={() => {
            setShowEnvBanner(false);
            sessionStorage.setItem("env_banner_dismissed", "true");
          }}
          onDeleted={async () => {
            try {
              const allConflicts = await checkAllEnvConflicts();
              const flatConflicts = Object.values(allConflicts).flat();
              setEnvConflicts(flatConflicts);
              if (flatConflicts.length === 0) {
                setShowEnvBanner(false);
              }
            } catch (error) {
              console.error(
                "[App] Failed to re-check conflicts after deletion:",
                error,
              );
            }
          }}
        />
      )}
      <div className="relative flex min-h-0 flex-1 gap-3 p-3 pt-4">
        <AppSidebar
          activeApp={activeApp}
          activeDomain={activeDomain}
          controlCenterEntryView={
            viewState["control-center"] as ControlCenterView
          }
          isCurrentAppTakeoverActive={isCurrentAppTakeoverActive}
          isProxyRunning={isProxyRunning}
          onOpenControlCenter={handleOpenControlCenter}
          setActiveApp={handleSelectApp}
          visibleApps={visibleApps}
        />

        <section className="app-main-panel relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-border/70">
          <div className="app-main-panel-glow pointer-events-none absolute inset-x-0 top-0 h-32" />
          <AppHeader
            activeApp={activeApp}
            activeDomain={activeDomain}
            currentView={currentView}
            runtimeEntryView={viewState.runtime}
            hasSkillsSupport={hasSkillsSupport}
            isCurrentAppTakeoverActive={isCurrentAppTakeoverActive}
            isProxyRunning={isProxyRunning}
            canGoBack={canGoBack}
            onBack={handleNavigateBack}
            onOpenAddProvider={() => setIsAddOpen(true)}
            openContextView={handleOpenContextView}
            setCurrentView={handleSetCurrentView}
            promptPanelRef={promptPanelRef}
            mcpPanelRef={mcpPanelRef}
            skillsPageRef={skillsPageRef}
            unifiedSkillsPanelRef={unifiedSkillsPanelRef}
            enableLocalProxy={settingsData?.enableLocalProxy}
            enableFailoverToggle={settingsData?.enableFailoverToggle}
            activeProviderId={activeProviderId}
          />

          <AppContent
            activeApp={activeApp}
            activeDomain={activeDomain}
            activeProviderId={activeProviderId}
            currentProviderId={currentProviderId}
            currentView={currentView}
            effectiveUsageProvider={effectiveUsageProvider}
            handleDisableOmo={handleDisableOmo}
            handleDisableOmoSlim={handleDisableOmoSlim}
            handleDuplicateProvider={handleDuplicateProvider}
            handleImportSuccess={handleImportSuccess}
            handleOpenTerminal={handleOpenTerminal}
            handleOpenWebsite={handleOpenWebsite}
            isCurrentAppTakeoverActive={isCurrentAppTakeoverActive}
            isLoading={isLoading}
            isOpenClawView={isOpenClawView}
            isProxyRunning={isProxyRunning}
            canGoBack={canGoBack}
            onBack={handleNavigateBack}
            openclawHealthWarnings={openclawHealthWarnings}
            openContextView={handleOpenContextView}
            promptPanelRef={promptPanelRef}
            mcpPanelRef={mcpPanelRef}
            providers={providers}
            saveUsageScript={saveUsageScript}
            setAsDefaultModel={setAsDefaultModel}
            setConfirmAction={setConfirmAction}
            setCurrentView={handleSetCurrentView}
            setEditingProvider={setEditingProvider}
            setIsAddOpen={setIsAddOpen}
            setUsageProvider={setUsageProvider}
            skillsPageRef={skillsPageRef}
            switchProvider={switchProvider}
            returnTarget={returnTarget}
            unifiedSkillsPanelRef={unifiedSkillsPanelRef}
            usageProvider={usageProvider}
          />
        </section>
      </div>

      <AddProviderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        appId={activeApp}
        onSubmit={addProvider}
      />

      <EditProviderDialog
        open={Boolean(editingProvider)}
        provider={effectiveEditingProvider}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProvider(null);
          }
        }}
        onSubmit={handleEditProvider}
        appId={activeApp}
        isProxyTakeover={isProxyRunning && isCurrentAppTakeoverActive}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.action === "remove"
            ? t("confirm.removeProvider")
            : t("confirm.deleteProvider")
        }
        message={
          confirmAction
            ? confirmAction.action === "remove"
              ? t("confirm.removeProviderMessage", {
                  name: confirmAction.provider.name,
                })
              : t("confirm.deleteProviderMessage", {
                  name: confirmAction.provider.name,
                })
            : ""
        }
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setConfirmAction(null)}
      />

      <DeepLinkImportDialog
        activeApp={activeApp}
        visibleApps={visibleApps}
        onNavigateToProviders={handleNavigateToProviderImport}
      />
    </div>
  );
}

export default App;
