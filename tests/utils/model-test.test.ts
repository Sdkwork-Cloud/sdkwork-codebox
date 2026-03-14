import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isStreamCheckTimeoutError,
  streamCheckProvider,
} from "@/lib/api/model-test";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

describe("model-test api", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects with a timeout error when the Tauri command hangs", async () => {
    vi.useFakeTimers();
    invokeMock.mockReturnValue(new Promise(() => {}));

    const promise = streamCheckProvider("claude", "provider-1", {
      timeoutMs: 1_000,
    });
    const rejection = promise.catch((error) => error);

    await vi.advanceTimersByTimeAsync(1_000);

    await expect(rejection).resolves.toMatchObject({
      name: "StreamCheckTimeoutError",
      timeoutMs: 1_000,
    });

    expect(isStreamCheckTimeoutError(await rejection)).toBe(true);
  });

  it("returns the native response when the Tauri command completes in time", async () => {
    const expected = {
      status: "operational",
      success: true,
      message: "ok",
      responseTimeMs: 180,
      modelUsed: "claude-3.7",
      testedAt: Date.now(),
      retryCount: 0,
    };
    invokeMock.mockResolvedValue(expected);

    await expect(
      streamCheckProvider("claude", "provider-1", {
        timeoutMs: 1_000,
      }),
    ).resolves.toEqual(expected);
  });
});
