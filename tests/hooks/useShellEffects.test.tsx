import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useShellEffects } from "@/shell/useShellEffects";
import type { EnvConflict } from "@/types/env";

const onSwitchedMock = vi.fn();
const updateTrayMenuMock = vi.fn();
const listenMock = vi.fn();
const invokeMock = vi.fn();
const checkAllEnvConflictsMock = vi.fn();
const checkEnvConflictsMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/lib/api", () => ({
  providersApi: {
    onSwitched: (...args: unknown[]) => onSwitchedMock(...args),
    updateTrayMenu: (...args: unknown[]) => updateTrayMenuMock(...args),
  },
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => listenMock(...args),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@/lib/api/env", () => ({
  checkAllEnvConflicts: (...args: unknown[]) =>
    checkAllEnvConflictsMock(...args),
  checkEnvConflicts: (...args: unknown[]) => checkEnvConflictsMock(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

type TauriEventHandler = (event: { payload: unknown }) => void | Promise<void>;
type UseShellEffectsProps = Parameters<typeof useShellEffects>[0];

const eventHandlers = new Map<string, TauriEventHandler>();

const conflictA: EnvConflict = {
  varName: "ANTHROPIC_API_KEY",
  varValue: "sk-ant",
  sourceType: "file",
  sourcePath: "/env/a",
};

const conflictB: EnvConflict = {
  varName: "OPENAI_API_KEY",
  varValue: "sk-openai",
  sourceType: "system",
  sourcePath: "/env/b",
};

function createQueryClientMock() {
  return {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  };
}

function createStateHarness(initialConflicts: EnvConflict[] = []) {
  let envConflicts = [...initialConflicts];
  let showEnvBanner = false;

  const setEnvConflicts = vi.fn((value) => {
    envConflicts =
      typeof value === "function" ? value(envConflicts) : [...value];
  });
  const setShowEnvBanner = vi.fn((value) => {
    showEnvBanner =
      typeof value === "function" ? value(showEnvBanner) : Boolean(value);
  });

  return {
    get envConflicts() {
      return envConflicts;
    },
    get showEnvBanner() {
      return showEnvBanner;
    },
    setEnvConflicts,
    setShowEnvBanner,
  };
}

describe("useShellEffects", () => {
  beforeEach(() => {
    onSwitchedMock.mockReset();
    updateTrayMenuMock.mockReset();
    listenMock.mockReset();
    invokeMock.mockReset();
    checkAllEnvConflictsMock.mockReset();
    checkEnvConflictsMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    eventHandlers.clear();
    localStorage.clear();
    sessionStorage.clear();
    document.body.style.overflow = "";

    onSwitchedMock.mockImplementation(async (handler) => {
      eventHandlers.set("provider-switched", handler);
      return () => {
        eventHandlers.delete("provider-switched");
      };
    });

    updateTrayMenuMock.mockResolvedValue(true);

    listenMock.mockImplementation(async (eventName, handler) => {
      eventHandlers.set(String(eventName), handler as TauriEventHandler);
      return () => {
        eventHandlers.delete(String(eventName));
      };
    });

    invokeMock.mockImplementation((command: string) => {
      if (command === "get_migration_result") {
        return Promise.resolve(false);
      }

      if (command === "get_skills_migration_result") {
        return Promise.resolve(null);
      }

      return Promise.resolve(null);
    });

    checkAllEnvConflictsMock.mockResolvedValue({
      claude: [],
      codex: [],
      gemini: [],
    });
    checkEnvConflictsMock.mockResolvedValue([]);
  });

  it("refetches providers only for switch events of the active app", async () => {
    const queryClient = createQueryClientMock();
    const refetchProviders = vi.fn().mockResolvedValue(undefined);
    const stateHarness = createStateHarness();

    const initialProps: UseShellEffectsProps = {
      activeApp: "codex" as const,
      activeDomain: "products" as const,
      currentView: "providers" as const,
      queryClient: queryClient as any,
      refetchProviders,
      navigateBack: vi.fn(),
      openContextView: vi.fn(),
      setEnvConflicts: stateHarness.setEnvConflicts,
      setShowEnvBanner: stateHarness.setShowEnvBanner,
      t: ((key: string, options?: Record<string, unknown>) =>
        (options?.defaultValue as string) ?? key) as any,
    };

    renderHook((props: UseShellEffectsProps) => useShellEffects(props), {
      initialProps,
    });

    await waitFor(() => {
      expect(onSwitchedMock).toHaveBeenCalledTimes(1);
    });

    await eventHandlers.get("provider-switched")?.({
      appType: "claude",
      providerId: "claude-1",
    } as any);
    expect(refetchProviders).not.toHaveBeenCalled();

    await eventHandlers.get("provider-switched")?.({
      appType: "codex",
      providerId: "codex-1",
    } as any);

    await waitFor(() => {
      expect(refetchProviders).toHaveBeenCalledTimes(1);
    });
  });

  it("reacts to universal sync and auto webdav failures", async () => {
    const queryClient = createQueryClientMock();
    const stateHarness = createStateHarness();
    const t = vi.fn((key: string, options?: Record<string, unknown>) => {
      if (key === "settings.webdavSync.autoSyncFailedToast") {
        return `auto sync failed: ${options?.error}`;
      }

      return (options?.defaultValue as string) ?? key;
    });

    renderHook(() =>
      useShellEffects({
        activeApp: "claude",
        activeDomain: "products",
        currentView: "providers",
        queryClient: queryClient as any,
        refetchProviders: vi.fn().mockResolvedValue(undefined),
        navigateBack: vi.fn(),
        openContextView: vi.fn(),
        setEnvConflicts: stateHarness.setEnvConflicts,
        setShowEnvBanner: stateHarness.setShowEnvBanner,
        t: t as any,
      }),
    );

    await waitFor(() => {
      expect(listenMock).toHaveBeenCalled();
    });

    await eventHandlers.get("universal-provider-synced")?.({ payload: null });

    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["providers"],
      });
      expect(updateTrayMenuMock).toHaveBeenCalledTimes(1);
    });

    await eventHandlers.get("webdav-sync-status-updated")?.({
      payload: { source: "manual", status: "error", error: "ignored" },
    });
    expect(toastErrorMock).not.toHaveBeenCalled();

    await eventHandlers.get("webdav-sync-status-updated")?.({
      payload: { source: "auto", status: "error", error: "network timeout" },
    });

    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["settings"],
      });
      expect(toastErrorMock).toHaveBeenCalledWith(
        "auto sync failed: network timeout",
      );
    });
  });

  it("loads env conflicts on startup and deduplicates conflicts on app switch", async () => {
    const queryClient = createQueryClientMock();
    const stateHarness = createStateHarness();

    checkAllEnvConflictsMock.mockResolvedValueOnce({
      claude: [conflictA],
      codex: [],
      gemini: [],
    });
    checkEnvConflictsMock
      .mockResolvedValueOnce([conflictA])
      .mockResolvedValueOnce([conflictA, conflictB]);

    const initialProps: UseShellEffectsProps = {
      activeApp: "claude" as const,
      activeDomain: "products" as const,
      currentView: "providers" as const,
      queryClient: queryClient as any,
      refetchProviders: vi.fn().mockResolvedValue(undefined),
      navigateBack: vi.fn(),
      openContextView: vi.fn(),
      setEnvConflicts: stateHarness.setEnvConflicts,
      setShowEnvBanner: stateHarness.setShowEnvBanner,
      t: ((key: string, options?: Record<string, unknown>) =>
        (options?.defaultValue as string) ?? key) as any,
    };

    const { rerender } = renderHook(
      (props: UseShellEffectsProps) => useShellEffects(props),
      {
        initialProps,
      },
    );

    await waitFor(() => {
      expect(stateHarness.envConflicts).toEqual([conflictA]);
      expect(stateHarness.showEnvBanner).toBe(true);
    });

    rerender({
      activeApp: "codex",
      activeDomain: "products",
      currentView: "providers",
      queryClient: queryClient as any,
      refetchProviders: vi.fn().mockResolvedValue(undefined),
      navigateBack: vi.fn(),
      openContextView: vi.fn(),
      setEnvConflicts: stateHarness.setEnvConflicts,
      setShowEnvBanner: stateHarness.setShowEnvBanner,
      t: ((key: string, options?: Record<string, unknown>) =>
        (options?.defaultValue as string) ?? key) as any,
    });

    await waitFor(() => {
      expect(stateHarness.envConflicts).toEqual([conflictA, conflictB]);
    });
  });

  it("handles command shortcuts and escape back navigation safely", async () => {
    const queryClient = createQueryClientMock();
    const stateHarness = createStateHarness();
    const navigateBack = vi.fn();
    const openContextView = vi.fn();

    const initialProps: UseShellEffectsProps = {
      activeApp: "claude" as const,
      activeDomain: "extensions" as const,
      currentView: "skillsDiscovery" as const,
      queryClient: queryClient as any,
      refetchProviders: vi.fn().mockResolvedValue(undefined),
      navigateBack,
      openContextView,
      setEnvConflicts: stateHarness.setEnvConflicts,
      setShowEnvBanner: stateHarness.setShowEnvBanner,
      t: ((key: string, options?: Record<string, unknown>) =>
        (options?.defaultValue as string) ?? key) as any,
    };

    const { rerender } = renderHook(
      (props: UseShellEffectsProps) => useShellEffects(props),
      {
        initialProps,
      },
    );

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: ",",
        metaKey: true,
        bubbles: true,
      }),
    );

    expect(openContextView).toHaveBeenCalledWith("appearance");

    openContextView.mockClear();
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );
    expect(navigateBack).toHaveBeenCalledTimes(1);

    navigateBack.mockClear();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );
    expect(navigateBack).not.toHaveBeenCalled();
    input.remove();

    rerender({
      activeApp: "claude",
      activeDomain: "products",
      currentView: "providers",
      queryClient: queryClient as any,
      refetchProviders: vi.fn().mockResolvedValue(undefined),
      navigateBack,
      openContextView,
      setEnvConflicts: stateHarness.setEnvConflicts,
      setShowEnvBanner: stateHarness.setShowEnvBanner,
      t: ((key: string, options?: Record<string, unknown>) =>
        (options?.defaultValue as string) ?? key) as any,
    });

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );
    expect(navigateBack).not.toHaveBeenCalled();

    rerender({
      activeApp: "openclaw",
      activeDomain: "products",
      currentView: "workspace",
      queryClient: queryClient as any,
      refetchProviders: vi.fn().mockResolvedValue(undefined),
      navigateBack,
      openContextView,
      setEnvConflicts: stateHarness.setEnvConflicts,
      setShowEnvBanner: stateHarness.setShowEnvBanner,
      t: ((key: string, options?: Record<string, unknown>) =>
        (options?.defaultValue as string) ?? key) as any,
    });

    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      }),
    );
    expect(navigateBack).not.toHaveBeenCalled();
  });
});
