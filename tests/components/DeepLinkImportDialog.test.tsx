import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emitTauriEvent } from "../msw/tauriMocks";
import { createTestQueryClient } from "../utils/testQueryClient";
import { DeepLinkImportDialog } from "@/components/DeepLinkImportDialog";

const importFromDeeplinkMock = vi.fn();
const mergeDeeplinkConfigMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === "apps.claude") return "Claude";
      if (key === "apps.codex") return "Codex";
      if (key === "apps.gemini") return "Gemini";
      if (key === "apps.opencode") return "OpenCode";
      if (key === "apps.openclaw") return "OpenClaw";
      if (key === "deeplink.importSuccessDescription" && params?.name) {
        return `imported ${String(params.name)}`;
      }
      if (key === "deeplink.importMultiSuccessDescription" && params?.count) {
        return `imported ${String(params.count)} apps`;
      }
      return key;
    },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
    warning: vi.fn(),
  },
}));

vi.mock("@/lib/api/deeplink", () => ({
  deeplinkApi: {
    parseDeeplink: vi.fn(),
    mergeDeeplinkConfig: (...args: unknown[]) =>
      mergeDeeplinkConfigMock(...args),
    importFromDeeplink: (...args: unknown[]) => importFromDeeplinkMock(...args),
  },
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: ({ name }: { name: string }) => <span>{name}</span>,
}));

const renderDialog = (
  onNavigateToProviders = vi.fn(),
  visibleApps = {
    claude: true,
    codex: true,
    gemini: true,
    opencode: true,
    openclaw: true,
  },
) =>
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <DeepLinkImportDialog
        activeApp="claude"
        visibleApps={visibleApps}
        onNavigateToProviders={onNavigateToProviders}
      />
    </QueryClientProvider>,
  );

describe("DeepLinkImportDialog", () => {
  beforeEach(() => {
    mergeDeeplinkConfigMock.mockImplementation(async (request) => request);
    importFromDeeplinkMock.mockResolvedValue({
      type: "provider",
      id: "provider-1",
    });
  });

  it("supports selecting multiple target products when provider deep link omits app", async () => {
    const onNavigateToProviders = vi.fn();
    renderDialog(onNavigateToProviders);

    await act(async () => {
      emitTauriEvent("deeplink-import", {
        version: "v1",
        resource: "provider",
        name: "Shared Provider",
        endpoint: "https://api.example.com",
        apiKey: "sk-shared",
      });
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(onNavigateToProviders).toHaveBeenCalledWith("claude"),
    );

    const importButton = await screen.findByRole("button", {
      name: "deeplink.import",
    });
    expect(importButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Codex/i }));
    fireEvent.click(screen.getByRole("button", { name: /Gemini/i }));
    expect(importButton).not.toBeDisabled();

    fireEvent.click(importButton);

    await waitFor(() =>
      expect(importFromDeeplinkMock).toHaveBeenCalledTimes(2),
    );
    expect(importFromDeeplinkMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        app: "codex",
        name: "Shared Provider",
      }),
    );
    expect(importFromDeeplinkMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        app: "gemini",
        name: "Shared Provider",
      }),
    );
  });

  it("still allows multi-select imports when sidebar visibility hides other products", async () => {
    const onNavigateToProviders = vi.fn();
    renderDialog(onNavigateToProviders, {
      claude: true,
      codex: false,
      gemini: false,
      opencode: false,
      openclaw: false,
    });

    await act(async () => {
      emitTauriEvent("deeplink-import", {
        version: "v1",
        resource: "provider",
        name: "Hidden Targets Provider",
        endpoint: "https://api.example.com",
        apiKey: "sk-hidden",
      });
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(onNavigateToProviders).toHaveBeenCalledWith("claude"),
    );

    expect(
      screen.getByRole("button", { name: /Codex/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Gemini/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Codex/i }));
    fireEvent.click(screen.getByRole("button", { name: /Gemini/i }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "deeplink.import",
      }),
    );

    await waitFor(() =>
      expect(importFromDeeplinkMock).toHaveBeenCalledTimes(2),
    );
    expect(importFromDeeplinkMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        app: "codex",
        name: "Hidden Targets Provider",
      }),
    );
    expect(importFromDeeplinkMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        app: "gemini",
        name: "Hidden Targets Provider",
      }),
    );
  });
});
