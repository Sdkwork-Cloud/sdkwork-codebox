import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStreamCheck } from "@/hooks/useStreamCheck";

const toastSuccessMock = vi.fn();
const toastWarningMock = vi.fn();
const toastErrorMock = vi.fn();
const streamCheckProviderMock = vi.fn();
const resetCircuitBreakerMutateMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    warning: (...args: unknown[]) => toastWarningMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      (options?.defaultValue as string) ?? key,
  }),
}));

vi.mock("@/lib/api/model-test", () => ({
  DEFAULT_STREAM_CHECK_TIMEOUT_MS: 75_000,
  isStreamCheckTimeoutError: (error: unknown) =>
    error instanceof Error && error.name === "StreamCheckTimeoutError",
  streamCheckProvider: (...args: unknown[]) => streamCheckProviderMock(...args),
}));

vi.mock("@/lib/query/failover", () => ({
  useResetCircuitBreaker: () => ({
    mutate: resetCircuitBreakerMutateMock,
  }),
}));

describe("useStreamCheck", () => {
  beforeEach(() => {
    toastSuccessMock.mockReset();
    toastWarningMock.mockReset();
    toastErrorMock.mockReset();
    streamCheckProviderMock.mockReset();
    resetCircuitBreakerMutateMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks providers as checking during successful model tests and clears state afterwards", async () => {
    let resolveCheck: ((value: unknown) => void) | undefined;
    streamCheckProviderMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
    );

    const { result } = renderHook(() => useStreamCheck("claude"));

    let checkPromise: Promise<unknown> | undefined;
    act(() => {
      checkPromise = result.current.checkProvider("provider-1", "Provider One");
    });

    expect(result.current.isChecking("provider-1")).toBe(true);

    await act(async () => {
      resolveCheck?.({
        status: "operational",
        success: true,
        message: "ok",
        responseTimeMs: 320,
        modelUsed: "claude-3.7",
        testedAt: Date.now(),
        retryCount: 0,
      });
      await checkPromise;
    });

    expect(result.current.isChecking("provider-1")).toBe(false);
    expect(resetCircuitBreakerMutateMock).toHaveBeenCalledWith({
      providerId: "provider-1",
      appType: "claude",
    });
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("releases checking state and shows a timeout message when model test stalls", async () => {
    vi.useFakeTimers();
    streamCheckProviderMock.mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error("timeout");
            error.name = "StreamCheckTimeoutError";
            reject(error);
          }, 1_000);
        }),
    );

    const { result } = renderHook(() => useStreamCheck("codex"));

    let checkPromise: Promise<unknown> | undefined;
    act(() => {
      checkPromise = result.current.checkProvider("provider-2", "Provider Two");
    });

    expect(result.current.isChecking("provider-2")).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
      await checkPromise;
    });

    expect(result.current.isChecking("provider-2")).toBe(false);
    expect(toastErrorMock).toHaveBeenCalledWith(
      "Provider Two 测试超时，请检查网络、代理或模型配置后重试。",
      expect.objectContaining({ closeButton: true }),
    );
  });
});
