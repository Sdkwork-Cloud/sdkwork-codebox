import { forwardRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Provider } from "@/types";
import { AppContent } from "@/shell/AppContent";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key,
  }),
}));

const providerListSpy = vi.fn();
const settingsPageSpy = vi.fn();
const skillsPageSpy = vi.fn();
const openClawBannerSpy = vi.fn();
const proxyTabSpy = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => ({
    settings: {
      language: "zh",
      enableLocalProxy: true,
      enableFailoverToggle: true,
    },
    isLoading: false,
    updateSettings: vi.fn(),
    autoSaveSettings: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/components/providers/ProviderList", () => ({
  ProviderList: (props: any) => {
    providerListSpy(props);
    const provider = props.providers[props.currentProviderId];

    return (
      <div>
        <button onClick={() => props.onSwitch(provider)}>
          switch-provider
        </button>
        <button onClick={() => props.onEdit(provider)}>edit-provider</button>
        <button onClick={() => props.onDelete(provider)}>
          delete-provider
        </button>
        <button onClick={() => props.onDuplicate(provider)}>
          duplicate-provider
        </button>
        <button onClick={() => props.onConfigureUsage(provider)}>
          usage-provider
        </button>
        <button onClick={() => props.onOpenWebsite("https://example.com")}>
          open-website
        </button>
        <button onClick={() => props.onCreate?.()}>create-provider</button>
        <button onClick={() => props.onRemoveFromConfig?.(provider)}>
          remove-from-config
        </button>
        <button onClick={() => props.onSetAsDefault?.(provider)}>
          set-default
        </button>
      </div>
    );
  },
}));

vi.mock("@/components/settings/SettingsPage", () => ({
  SettingsPage: (props: any) => {
    settingsPageSpy(props);
    return (
      <div>
        <button onClick={() => props.onOpenChange(false)}>
          close-settings
        </button>
        <button onClick={() => props.onImportSuccess()}>import-success</button>
        <button onClick={() => props.onTabChange?.("about")}>switch-tab</button>
        <span>settings-default:{props.defaultTab}</span>
        <span>settings-close:{String(props.showCloseButton)}</span>
      </div>
    );
  },
}));

vi.mock("@/components/settings/ProxyTabContent", () => ({
  ProxyTabContent: (props: any) => {
    proxyTabSpy(props);
    return <div>proxy-tab</div>;
  },
}));

vi.mock("@/components/settings/LogConfigPanel", () => ({
  LogConfigPanel: () => <div>log-config-panel</div>,
}));

vi.mock("@/components/usage/ModelTestConfigPanel", () => ({
  ModelTestConfigPanel: () => <div>model-test-config-panel</div>,
}));

vi.mock("@/components/usage/UsageDashboard", () => ({
  UsageDashboard: () => <div>usage-dashboard</div>,
}));

vi.mock("@/components/UsageScriptModal", () => ({
  default: ({ isOpen, onSave, onClose, provider }: any) =>
    isOpen ? (
      <div>
        <span>usage-modal:{provider.id}</span>
        <button onClick={() => onSave("script-code")}>save-usage</button>
        <button onClick={() => onClose()}>close-usage</button>
      </div>
    ) : null,
}));

vi.mock("@/components/skills/SkillsPage", () => ({
  SkillsPage: forwardRef((props: any, _ref) => {
    skillsPageSpy(props);
    return <div>skills-page:{props.initialApp}</div>;
  }),
}));

vi.mock("@/components/skills/UnifiedSkillsPanel", () => ({
  default: forwardRef(({ onOpenDiscovery }: any, _ref) => (
    <button onClick={() => onOpenDiscovery()}>open-discovery</button>
  )),
}));

vi.mock("@/components/mcp/UnifiedMcpPanel", () => ({
  default: forwardRef(({ onOpenChange }: any, _ref) => (
    <button onClick={() => onOpenChange(false)}>close-mcp</button>
  )),
}));

vi.mock("@/components/prompts/PromptPanel", () => ({
  default: forwardRef(({ onOpenChange }: any, _ref) => (
    <button onClick={() => onOpenChange(false)}>close-prompts</button>
  )),
}));

vi.mock("@/components/agents/AgentsPanel", () => ({
  AgentsPanel: ({ onOpenChange }: any) => (
    <button onClick={() => onOpenChange(false)}>close-agents</button>
  ),
}));

vi.mock("@/components/universal", () => ({
  UniversalProviderPanel: () => <div>universal-panel</div>,
}));

vi.mock("@/components/sessions/SessionManagerPage", () => ({
  SessionManagerPage: ({ appId }: any) => <div>sessions:{appId}</div>,
}));

vi.mock("@/components/workspace/WorkspaceFilesPanel", () => ({
  default: () => <div>workspace-panel</div>,
}));

vi.mock("@/components/openclaw/EnvPanel", () => ({
  default: () => <div>env-panel</div>,
}));

vi.mock("@/components/openclaw/ToolsPanel", () => ({
  default: () => <div>tools-panel</div>,
}));

vi.mock("@/components/openclaw/AgentsDefaultsPanel", () => ({
  default: () => <div>agents-defaults-panel</div>,
}));

vi.mock("@/components/openclaw/OpenClawHealthBanner", () => ({
  default: ({ warnings }: any) => {
    openClawBannerSpy(warnings);
    return <div>openclaw-health-banner</div>;
  },
}));

function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: overrides.id ?? "provider-1",
    name: overrides.name ?? "Provider One",
    settingsConfig: overrides.settingsConfig ?? {},
    ...overrides,
  };
}

function createProps(
  overrides: Partial<React.ComponentProps<typeof AppContent>> = {},
) {
  const provider = createProvider();

  const props: React.ComponentProps<typeof AppContent> = {
    activeApp: "claude" as const,
    activeDomain: "products" as const,
    currentProviderId: provider.id,
    currentView: "providers" as const,
    handleDisableOmo: vi.fn(),
    handleDisableOmoSlim: vi.fn(),
    handleDuplicateProvider: vi.fn().mockResolvedValue(undefined),
    handleImportSuccess: vi.fn().mockResolvedValue(undefined),
    handleOpenTerminal: vi.fn().mockResolvedValue(undefined),
    handleOpenWebsite: vi.fn().mockResolvedValue(undefined),
    isCurrentAppTakeoverActive: false,
    isLoading: false,
    isOpenClawView: false,
    isProxyRunning: false,
    openclawHealthWarnings: [],
    promptPanelRef: { current: {} },
    mcpPanelRef: { current: {} },
    onBack: vi.fn(),
    openContextView: vi.fn(),
    providers: { [provider.id]: provider },
    setConfirmAction: vi.fn(),
    setCurrentView: vi.fn(),
    setEditingProvider: vi.fn(),
    setIsAddOpen: vi.fn(),
    setUsageProvider: vi.fn(),
    setAsDefaultModel: vi.fn().mockResolvedValue(undefined),
    skillsPageRef: { current: {} },
    switchProvider: vi.fn().mockResolvedValue(undefined),
    unifiedSkillsPanelRef: { current: {} },
    usageProvider: null,
    saveUsageScript: vi.fn().mockResolvedValue(undefined),
    effectiveUsageProvider: null,
    activeProviderId: undefined,
    ...overrides,
  };

  return props;
}

describe("AppContent", () => {
  beforeEach(() => {
    providerListSpy.mockReset();
    settingsPageSpy.mockReset();
    skillsPageSpy.mockReset();
    openClawBannerSpy.mockReset();
    proxyTabSpy.mockReset();
  });

  it("routes control-center and skills discovery views correctly", () => {
    const settingsProps = createProps({
      activeDomain: "control-center",
      currentView: "about",
    });

    render(<AppContent {...settingsProps} />);
    expect(screen.getByText("settings-default:about")).toBeInTheDocument();
    expect(screen.getByText("settings-close:false")).toBeInTheDocument();

    fireEvent.click(screen.getByText("close-settings"));
    fireEvent.click(screen.getByText("import-success"));
    fireEvent.click(screen.getByText("switch-tab"));

    expect(settingsProps.onBack).toHaveBeenCalledTimes(1);
    expect(settingsProps.handleImportSuccess).toHaveBeenCalledTimes(1);
    expect(settingsProps.setCurrentView).toHaveBeenCalledWith("about");

    const discoveryProps = createProps({
      activeDomain: "extensions",
      currentView: "skillsDiscovery",
      activeApp: "openclaw",
    });

    render(<AppContent {...discoveryProps} />);
    expect(screen.getByText("skills-page:claude")).toBeInTheDocument();
  });

  it("wires provider list callbacks and usage save flow", async () => {
    const provider = createProvider({ id: "openclaw-1" });
    const props = createProps({
      activeApp: "openclaw",
      activeDomain: "products",
      providers: { [provider.id]: provider },
      currentProviderId: provider.id,
      usageProvider: provider,
      effectiveUsageProvider: provider,
      isOpenClawView: true,
      openclawHealthWarnings: [{ code: "warn", message: "warning" }],
    });

    render(<AppContent {...props} />);

    expect(screen.getByText("openclaw-health-banner")).toBeInTheDocument();
    expect(openClawBannerSpy).toHaveBeenCalledWith([
      { code: "warn", message: "warning" },
    ]);

    fireEvent.click(screen.getByText("switch-provider"));
    fireEvent.click(screen.getByText("edit-provider"));
    fireEvent.click(screen.getByText("delete-provider"));
    fireEvent.click(screen.getByText("duplicate-provider"));
    fireEvent.click(screen.getByText("usage-provider"));
    fireEvent.click(screen.getByText("open-website"));
    fireEvent.click(screen.getByText("create-provider"));
    fireEvent.click(screen.getByText("remove-from-config"));
    fireEvent.click(screen.getByText("set-default"));
    fireEvent.click(screen.getByText("save-usage"));
    fireEvent.click(screen.getByText("close-usage"));

    expect(props.switchProvider).toHaveBeenCalledWith(provider);
    expect(props.setEditingProvider).toHaveBeenCalledWith(provider);
    expect(props.setConfirmAction).toHaveBeenCalledWith({
      provider,
      action: "remove",
    });
    expect(props.handleDuplicateProvider).toHaveBeenCalledWith(provider);
    expect(props.setUsageProvider).toHaveBeenCalledWith(provider);
    expect(props.handleOpenWebsite).toHaveBeenCalledWith("https://example.com");
    expect(props.setIsAddOpen).toHaveBeenCalledWith(true);
    expect(props.setAsDefaultModel).toHaveBeenCalledWith(provider);
    expect(props.saveUsageScript).toHaveBeenCalledWith(provider, "script-code");
    expect(props.setUsageProvider).toHaveBeenCalledWith(null);
  });

  it("maps runtime and extension domain content to the rebuilt shell", () => {
    const runtimeProps = createProps({
      activeDomain: "runtime",
      currentView: "runtimeProxy",
      isProxyRunning: true,
      isCurrentAppTakeoverActive: true,
      activeProviderId: "provider-1",
    });

    render(<AppContent {...runtimeProps} />);
    expect(screen.getByText("proxy-tab")).toBeInTheDocument();
    expect(proxyTabSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        defaultSections: ["proxy", "failover"],
      }),
    );

    const takeoverProps = createProps({
      activeDomain: "runtime",
      currentView: "runtimeTakeover",
    });
    render(<AppContent {...takeoverProps} />);
    expect(proxyTabSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        defaultSections: ["proxy"],
      }),
    );

    const failoverProps = createProps({
      activeDomain: "runtime",
      currentView: "runtimeFailover",
    });
    render(<AppContent {...failoverProps} />);
    expect(proxyTabSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        defaultSections: ["failover"],
      }),
    );

    const usageProps = createProps({
      activeDomain: "runtime",
      currentView: "runtimeUsage",
    });
    render(<AppContent {...usageProps} />);
    expect(screen.getByText("usage-dashboard")).toBeInTheDocument();

    const diagnosticsProps = createProps({
      activeDomain: "runtime",
      currentView: "runtimeDiagnostics",
    });
    render(<AppContent {...diagnosticsProps} />);
    expect(screen.getByText("model-test-config-panel")).toBeInTheDocument();
    expect(screen.getByText("log-config-panel")).toBeInTheDocument();

    const universalProps = createProps({
      activeDomain: "extensions",
      currentView: "universal",
    });
    render(<AppContent {...universalProps} />);
    expect(screen.getByText("universal-panel")).toBeInTheDocument();
  });

  it("provides a shell viewport scroll container for tall pages", () => {
    const props = createProps({
      activeDomain: "extensions",
      currentView: "universal",
    });

    const { container } = render(<AppContent {...props} />);

    const viewport = container.querySelector("main > div");
    expect(viewport).toHaveClass("h-full");
    expect(viewport).toHaveClass("overflow-y-auto");
    expect(viewport).toHaveClass("overflow-x-hidden");
  });

  it("surfaces an explicit runtime return path and in-panel stage switching", () => {
    const props = createProps({
      activeDomain: "runtime",
      currentView: "runtimeUsage",
    }) as any;
    props.canGoBack = true;
    props.returnTarget = {
      activeApp: "openclaw",
      activeDomain: "products",
      view: "workspace",
    };

    render(<AppContent {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /返回到/i }));
    expect(props.onBack).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Takeover" }));
    expect(props.setCurrentView).toHaveBeenCalledWith("runtimeTakeover");
  });

  it("routes extension close callbacks back to providers", () => {
    const promptsProps = createProps({
      activeDomain: "extensions",
      currentView: "prompts",
    });
    render(<AppContent {...promptsProps} />);
    fireEvent.click(screen.getByText("close-prompts"));
    expect(promptsProps.onBack).toHaveBeenCalledTimes(1);

    const mcpProps = createProps({
      activeDomain: "extensions",
      currentView: "mcp",
    });
    render(<AppContent {...mcpProps} />);
    fireEvent.click(screen.getByText("close-mcp"));
    expect(mcpProps.onBack).toHaveBeenCalledTimes(1);

    const agentsProps = createProps({
      activeDomain: "extensions",
      currentView: "agents",
    });
    render(<AppContent {...agentsProps} />);
    fireEvent.click(screen.getByText("close-agents"));
    expect(agentsProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("opens skills discovery as a contextual jump", () => {
    const props = createProps({
      activeDomain: "extensions",
      currentView: "skills",
    });

    render(<AppContent {...props} />);
    fireEvent.click(screen.getByText("open-discovery"));

    expect(props.openContextView).toHaveBeenCalledWith("skillsDiscovery");
  });
});
