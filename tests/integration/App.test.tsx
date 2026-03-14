import { Suspense, type ComponentType } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { resetProviderState } from "../msw/state";
import { emitTauriEvent } from "../msw/tauriMocks";
import { createTestQueryClient } from "../utils/testQueryClient";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/shell/AppHeader", () => ({
  AppHeader: ({
    activeApp,
    activeDomain,
    onOpenAddProvider,
    openContextView,
    onBack,
    canGoBack,
    setCurrentView,
  }: any) => (
    <div data-testid="app-header">
      <span data-testid="active-app">{activeApp}</span>
      <span data-testid="active-domain">{activeDomain}</span>
      <button onClick={() => onOpenAddProvider()}>create</button>
      <button onClick={() => openContextView?.("runtimeProxy")}>
        open-runtime
      </button>
      {canGoBack ? <button onClick={() => onBack?.()}>go-back</button> : null}
      <button onClick={() => setCurrentView("providers")}>
        view-providers
      </button>
      <button onClick={() => setCurrentView("workspace")}>
        view-workspace
      </button>
      <button onClick={() => setCurrentView("sessions")}>view-sessions</button>
      <button onClick={() => setCurrentView("prompts")}>view-prompts</button>
      <button onClick={() => setCurrentView("agents")}>view-agents</button>
      <button onClick={() => setCurrentView("runtimeUsage")}>
        view-runtime-usage
      </button>
    </div>
  ),
}));

vi.mock("@/shell/AppSidebar", () => ({
  AppSidebar: ({
    activeApp,
    activeDomain,
    onOpenControlCenter,
    setActiveApp,
  }: any) => (
    <div data-testid="app-sidebar">
      <span data-testid="sidebar-active-app">{activeApp}</span>
      <span data-testid="sidebar-active-domain">{activeDomain}</span>
      <button onClick={() => setActiveApp("claude")}>switch-claude</button>
      <button onClick={() => setActiveApp("codex")}>switch-codex</button>
      <button onClick={() => setActiveApp("openclaw")}>switch-openclaw</button>
      <button onClick={() => onOpenControlCenter("appearance")}>
        open-control-center
      </button>
      <button onClick={() => onOpenControlCenter("about")}>
        open-control-center-about
      </button>
    </div>
  ),
}));

vi.mock("@/shell/AppContent", () => ({
  AppContent: ({
    activeApp,
    activeDomain,
    currentView,
    providers,
    currentProviderId,
    switchProvider,
    setEditingProvider,
    handleDuplicateProvider,
    setUsageProvider,
    handleOpenWebsite,
    usageProvider,
    effectiveUsageProvider,
    saveUsageScript,
  }: any) => (
    <div>
      <div data-testid="active-domain">{activeDomain}</div>
      <div data-testid="current-view">{currentView}</div>
      <div data-testid="content-active-app">{activeApp}</div>
      <div data-testid="provider-list">{JSON.stringify(providers)}</div>
      <div data-testid="current-provider">{currentProviderId}</div>
      <button onClick={() => switchProvider(providers[currentProviderId])}>
        switch
      </button>
      <button onClick={() => setEditingProvider(providers[currentProviderId])}>
        edit
      </button>
      <button
        onClick={() => handleDuplicateProvider(providers[currentProviderId])}
      >
        duplicate
      </button>
      <button onClick={() => setUsageProvider(providers[currentProviderId])}>
        usage
      </button>
      <button onClick={() => handleOpenWebsite("https://example.com")}>
        open-website
      </button>
      {effectiveUsageProvider && (
        <div data-testid="usage-modal">
          <span data-testid="usage-provider">{effectiveUsageProvider.id}</span>
          <button
            onClick={() => {
              if (usageProvider) {
                void saveUsageScript(usageProvider, "script-code");
              }
            }}
          >
            save-script
          </button>
          <button onClick={() => setUsageProvider(null)}>close-usage</button>
        </div>
      )}
    </div>
  ),
}));

vi.mock("@/components/providers/AddProviderDialog", () => ({
  AddProviderDialog: ({ open, onOpenChange, onSubmit, appId }: any) =>
    open ? (
      <div data-testid="add-provider-dialog">
        <button
          onClick={() =>
            onSubmit({
              name: `New ${appId} Provider`,
              settingsConfig: {},
              category: "custom",
              sortIndex: 99,
            })
          }
        >
          confirm-add
        </button>
        <button onClick={() => onOpenChange(false)}>close-add</button>
      </div>
    ) : null,
}));

vi.mock("@/components/providers/EditProviderDialog", () => ({
  EditProviderDialog: ({ open, provider, onSubmit, onOpenChange }: any) =>
    open ? (
      <div data-testid="edit-provider-dialog">
        <button
          onClick={() =>
            onSubmit({
              ...provider,
              name: `${provider.name}-edited`,
            })
          }
        >
          confirm-edit
        </button>
        <button onClick={() => onOpenChange(false)}>close-edit</button>
      </div>
    ) : null,
}));

vi.mock("@/components/UsageScriptModal", () => ({
  default: ({ isOpen, provider, onSave, onClose }: any) =>
    isOpen ? (
      <div data-testid="usage-modal">
        <span data-testid="usage-provider">{provider?.id}</span>
        <button onClick={() => onSave("script-code")}>save-script</button>
        <button onClick={() => onClose()}>close-usage</button>
      </div>
    ) : null,
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <button onClick={() => onConfirm()}>confirm-delete</button>
        <button onClick={() => onCancel()}>cancel-delete</button>
      </div>
    ) : null,
}));

const renderApp = (AppComponent: ComponentType) => {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback={<div data-testid="loading">loading</div>}>
        <AppComponent />
      </Suspense>
    </QueryClientProvider>,
  );
};

describe("App integration with MSW", () => {
  beforeEach(() => {
    resetProviderState();
    localStorage.clear();
    sessionStorage.clear();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it("covers basic provider flows via real hooks", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-codex"));
    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "codex-1",
      ),
    );

    fireEvent.click(screen.getByText("usage"));
    expect(screen.getByTestId("usage-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("save-script"));
    fireEvent.click(screen.getByText("close-usage"));

    fireEvent.click(screen.getByText("create"));
    expect(screen.getByTestId("add-provider-dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("confirm-add"));
    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toMatch(
        /New codex Provider/,
      ),
    );

    fireEvent.click(screen.getByText("edit"));
    expect(screen.getByTestId("edit-provider-dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByText("confirm-edit"));
    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toMatch(
        /-edited/,
      ),
    );

    fireEvent.click(screen.getByText("switch"));
    fireEvent.click(screen.getByText("duplicate"));
    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toMatch(/copy/),
    );

    fireEvent.click(screen.getByText("open-website"));

    emitTauriEvent("provider-switched", {
      appType: "codex",
      providerId: "codex-2",
    });

    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalled();
  }, 20000);

  it("shows toast when auto sync fails in background", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    emitTauriEvent("webdav-sync-status-updated", {
      source: "auto",
      status: "error",
      error: "network timeout",
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });
  }, 20000);

  it("returns to the selected product workspace when switching from settings", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("open-control-center"));
    await waitFor(() =>
      expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
        "control-center",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "appearance",
      ),
    );

    fireEvent.click(screen.getByText("switch-codex"));

    await waitFor(() =>
      expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
        "products",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("providers"),
    );
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "codex",
      ),
    );
  }, 20000);

  it("falls back to the first OpenClaw product tab when switching from extensions without saved product state", async () => {
    localStorage.setItem("codebox-active-domain", "extensions");
    localStorage.setItem(
      "codebox-domain-views",
      JSON.stringify({
        products: "providers",
        runtime: "runtimeProxy",
        extensions: "prompts",
        "control-center": "appearance",
      }),
    );

    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
        "extensions",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("prompts"),
    );

    fireEvent.click(screen.getByText("switch-openclaw"));

    await waitFor(() =>
      expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
        "products",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "openclaw",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("providers"),
    );
  }, 20000);

  it("falls back to the first valid tab for the next product and restores the previous product tab", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-openclaw"));
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "openclaw",
      ),
    );

    fireEvent.click(screen.getByText("view-workspace"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );

    fireEvent.click(screen.getByText("switch-codex"));
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "codex",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("providers"),
    );

    fireEvent.click(screen.getByText("switch-openclaw"));
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "openclaw",
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );
  }, 20000);

  it("returns to the prior workspace after opening runtime contextually", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-openclaw"));
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "openclaw",
      ),
    );

    fireEvent.click(screen.getByText("view-workspace"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );

    fireEvent.click(screen.getByText("open-runtime"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "runtimeProxy",
      ),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "runtime",
    );
    expect(screen.getByText("go-back")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-back"));

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
    expect(screen.getByTestId("content-active-app")).toHaveTextContent(
      "openclaw",
    );
  }, 20000);

  it("keeps product workspace tabs stable on Escape", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-openclaw"));
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "openclaw",
      ),
    );

    fireEvent.click(screen.getByText("view-workspace"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );

    fireEvent.keyDown(window, {
      key: "Escape",
      bubbles: true,
    });

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
  }, 20000);

  it("keeps nested contextual jumps reversible between runtime and settings", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-openclaw"));
    fireEvent.click(screen.getByText("view-workspace"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );

    fireEvent.click(screen.getByText("open-runtime"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "runtimeProxy",
      ),
    );

    fireEvent.click(screen.getByText("open-control-center"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "appearance",
      ),
    );

    fireEvent.click(screen.getByText("go-back"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "runtimeProxy",
      ),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "runtime",
    );

    fireEvent.click(screen.getByText("go-back"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
  }, 20000);

  it("returns to the previous runtime view before leaving the runtime domain", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("open-runtime"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "runtimeProxy",
      ),
    );

    fireEvent.click(screen.getByText("view-runtime-usage"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "runtimeUsage",
      ),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "runtime",
    );

    fireEvent.click(screen.getByText("go-back"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "runtimeProxy",
      ),
    );

    fireEvent.click(screen.getByText("go-back"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("providers"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
  }, 20000);

  it("returns to the previous product tab after entering prompts from a session workflow", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-codex"));
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "codex",
      ),
    );

    fireEvent.click(screen.getByText("view-sessions"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("sessions"),
    );

    fireEvent.click(screen.getByText("view-prompts"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("prompts"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "extensions",
    );
    expect(screen.getByText("go-back")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-back"));

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("sessions"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
    expect(screen.getByTestId("content-active-app")).toHaveTextContent("codex");
  }, 20000);

  it("returns to the previous extensions view before leaving the extensions domain", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-codex"));
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "codex",
      ),
    );

    fireEvent.click(screen.getByText("view-prompts"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("prompts"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "extensions",
    );

    fireEvent.click(screen.getByText("view-agents"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("agents"),
    );

    fireEvent.click(screen.getByText("go-back"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("prompts"),
    );

    fireEvent.click(screen.getByText("go-back"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("providers"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
  }, 20000);

  it("falls back to the remembered product tab when leaving a restored runtime view", async () => {
    localStorage.setItem("codebox-last-app", "openclaw");
    localStorage.setItem("codebox-active-domain", "runtime");
    localStorage.setItem(
      "codebox-domain-views",
      JSON.stringify({
        products: "workspace",
        runtime: "runtimeProxy",
        extensions: "prompts",
        "control-center": "appearance",
      }),
    );
    localStorage.setItem(
      "codebox-product-views",
      JSON.stringify({
        claude: "providers",
        codex: "providers",
        gemini: "providers",
        opencode: "providers",
        openclaw: "workspace",
      }),
    );

    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "runtimeProxy",
      ),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "runtime",
    );
    expect(screen.getByTestId("content-active-app")).toHaveTextContent(
      "openclaw",
    );
    expect(screen.getByText("go-back")).toBeInTheDocument();

    fireEvent.keyDown(window, {
      key: "Escape",
      bubbles: true,
    });

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("workspace"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
  }, 20000);

  it("surfaces a visible return path from a restored control-center view", async () => {
    localStorage.setItem("codebox-last-app", "codex");
    localStorage.setItem("codebox-active-domain", "control-center");
    localStorage.setItem(
      "codebox-domain-views",
      JSON.stringify({
        products: "sessions",
        runtime: "runtimeProxy",
        extensions: "prompts",
        "control-center": "appearance",
      }),
    );
    localStorage.setItem(
      "codebox-product-views",
      JSON.stringify({
        claude: "providers",
        codex: "sessions",
        gemini: "providers",
        opencode: "providers",
        openclaw: "workspace",
      }),
    );

    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "appearance",
      ),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "control-center",
    );
    expect(screen.getByText("go-back")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-back"));

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("sessions"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
    expect(screen.getByTestId("content-active-app")).toHaveTextContent("codex");
  }, 20000);

  it("returns to the previous control-center view before leaving settings", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("provider-list").textContent).toContain(
        "claude-1",
      ),
    );

    fireEvent.click(screen.getByText("switch-codex"));
    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "codex",
      ),
    );

    fireEvent.click(screen.getByText("view-sessions"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("sessions"),
    );

    fireEvent.click(screen.getByText("open-control-center"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "appearance",
      ),
    );

    fireEvent.click(screen.getByText("open-control-center-about"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("about"),
    );

    fireEvent.click(screen.getByText("go-back"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent(
        "appearance",
      ),
    );

    fireEvent.click(screen.getByText("go-back"));
    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("sessions"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
  }, 20000);

  it("surfaces a visible return path from a restored extensions view", async () => {
    localStorage.setItem("codebox-last-app", "codex");
    localStorage.setItem("codebox-active-domain", "extensions");
    localStorage.setItem(
      "codebox-domain-views",
      JSON.stringify({
        products: "sessions",
        runtime: "runtimeProxy",
        extensions: "prompts",
        "control-center": "appearance",
      }),
    );
    localStorage.setItem(
      "codebox-product-views",
      JSON.stringify({
        claude: "providers",
        codex: "sessions",
        gemini: "providers",
        opencode: "providers",
        openclaw: "workspace",
      }),
    );

    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("prompts"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "extensions",
    );
    expect(screen.getByText("go-back")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-back"));

    await waitFor(() =>
      expect(screen.getByTestId("current-view")).toHaveTextContent("sessions"),
    );
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
    expect(screen.getByTestId("content-active-app")).toHaveTextContent("codex");
  }, 20000);

  it("opens the providers page for the target product when a provider deep link arrives", async () => {
    const { default: App } = await import("@/App");
    renderApp(App);

    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "claude",
      ),
    );

    await act(async () => {
      emitTauriEvent("deeplink-import", {
        version: "v1",
        resource: "provider",
        app: "codex",
        name: "DeepLink Codex",
        endpoint: "https://api.example.com",
        apiKey: "sk-test",
      });
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(screen.getByTestId("content-active-app")).toHaveTextContent(
        "codex",
      ),
    );
    expect(screen.getByTestId("current-view")).toHaveTextContent("providers");
    expect(screen.getAllByTestId("active-domain").at(-1)).toHaveTextContent(
      "products",
    );
  }, 20000);
});
