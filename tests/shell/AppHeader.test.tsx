import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/shell/AppHeader";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      (options?.defaultValue as string) ?? key,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, title, ...props }: any) => (
    <button onClick={onClick} title={title} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => <span data-testid="provider-icon" />,
}));

vi.mock("@/components/proxy/ProxyToggle", () => ({
  ProxyToggle: ({ activeApp }: any) => <div>proxy-toggle:{activeApp}</div>,
}));

vi.mock("@/components/proxy/FailoverToggle", () => ({
  FailoverToggle: ({ activeApp }: any) => (
    <div>failover-toggle:{activeApp}</div>
  ),
}));

function createProps(
  overrides: Partial<React.ComponentProps<typeof AppHeader>> = {},
) {
  const props: React.ComponentProps<typeof AppHeader> = {
    activeApp: "claude" as const,
    activeDomain: "products" as const,
    currentView: "providers" as const,
    hasSkillsSupport: true,
    isCurrentAppTakeoverActive: true,
    isProxyRunning: true,
    onOpenAddProvider: vi.fn(),
    onBack: vi.fn(),
    openContextView: vi.fn(),
    canGoBack: false,
    setCurrentView: vi.fn(),
    promptPanelRef: { current: { openAdd: vi.fn() } },
    mcpPanelRef: { current: { openImport: vi.fn(), openAdd: vi.fn() } },
    skillsPageRef: {
      current: { refresh: vi.fn(), openRepoManager: vi.fn() },
    },
    unifiedSkillsPanelRef: {
      current: { openInstallFromZip: vi.fn(), openImport: vi.fn() },
    },
    toolbarRef: createRef<HTMLDivElement>(),
    enableLocalProxy: true,
    enableFailoverToggle: true,
    activeProviderId: "provider-1",
    ...overrides,
  };

  return props;
}

describe("AppHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders openclaw product tabs and routes product-specific views", () => {
    const props = createProps({
      activeApp: "openclaw",
      activeDomain: "products",
      currentView: "providers",
      enableLocalProxy: false,
      enableFailoverToggle: false,
    });

    render(<AppHeader {...props} />);

    expect(screen.getByText("apps.openclaw")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "供应商" }),
    ).toBeInTheDocument();
    expect(screen.getByText("provider-1")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "供应商" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tab", { name: "Workspace" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "环境变量" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "工具权限" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Agents 配置" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "会话管理" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Prompts" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Skills" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "MCP" })).not.toBeInTheDocument();
    expect(
      screen.queryByText("维护 OpenClaw 环境变量和密钥配置。"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("provider.addProvider"));
    expect(props.onOpenAddProvider).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("tab", { name: "环境变量" }));
    expect(props.setCurrentView).toHaveBeenCalledWith("openclawEnv");
  });

  it("renders product workspace tabs and contextual actions for regular apps", () => {
    const props = createProps({
      activeDomain: "extensions",
      currentView: "prompts",
      isCurrentAppTakeoverActive: false,
      isProxyRunning: false,
    });

    render(<AppHeader {...props} />);

    expect(screen.getByText("apps.claude")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Prompts" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "供应商" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Prompts" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "MCP" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Agents" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "统一供应商" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "会话管理" })).toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Workspace" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "环境变量" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "工具权限" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Agents 配置" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("高频提示词与模板。"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("prompts.add"));
    expect(props.promptPanelRef.current.openAdd).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("tab", { name: "Skills" }));
    expect(props.setCurrentView).toHaveBeenCalledWith("skills");

    fireEvent.click(screen.getByRole("tab", { name: "Agents" }));
    expect(props.setCurrentView).toHaveBeenCalledWith("agents");
  });

  it("shows proxy and failover toggles on the provider workspace for regular apps", () => {
    const props = createProps({
      activeDomain: "products",
      currentView: "providers",
      isCurrentAppTakeoverActive: false,
      isProxyRunning: false,
    });

    render(<AppHeader {...props} />);

    expect(screen.getByText("proxy-toggle:claude")).toBeInTheDocument();
    expect(screen.getByText("failover-toggle:claude")).toBeInTheDocument();
  });

  it("exposes a runtime entry outside the sidebar", () => {
    const props = createProps({
      activeDomain: "products",
      currentView: "providers",
    });

    render(<AppHeader {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Runtime" }));
    expect(props.openContextView).toHaveBeenCalledWith("runtimeProxy");
  });

  it("reopens the remembered runtime workbench view instead of always resetting", () => {
    const props = createProps({
      activeDomain: "products",
      currentView: "providers",
      runtimeEntryView: "runtimeUsage" as any,
    } as any);

    render(<AppHeader {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Runtime" }));
    expect(props.openContextView).toHaveBeenCalledWith("runtimeUsage");
  });

  it("shows a contextual back action when a return target exists", () => {
    const props = createProps({
      activeDomain: "runtime",
      currentView: "runtimeProxy",
      canGoBack: true,
    });

    render(<AppHeader {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "返回" }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("keeps runtime controls wired", () => {
    const runtimeProps = createProps({
      activeDomain: "runtime",
      currentView: "runtimeProxy",
    });

    render(<AppHeader {...runtimeProps} />);

    expect(screen.getByRole("button", { name: "Runtime" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Proxy" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Takeover" })).toBeInTheDocument();
    expect(screen.getByText("Takeover active")).toBeInTheDocument();
  });

  it("keeps skills discovery actions wired", () => {
    const discoveryProps = createProps({
      activeDomain: "extensions",
      currentView: "skillsDiscovery",
      isCurrentAppTakeoverActive: false,
      isProxyRunning: false,
    });

    render(<AppHeader {...discoveryProps} />);

    fireEvent.click(screen.getByText("skills.refresh"));
    fireEvent.click(screen.getByText("skills.repoManager"));
    expect(discoveryProps.skillsPageRef.current.refresh).toHaveBeenCalledTimes(
      1,
    );
    expect(
      discoveryProps.skillsPageRef.current.openRepoManager,
    ).toHaveBeenCalledTimes(1);
  });
});
