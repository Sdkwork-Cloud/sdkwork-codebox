import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RequestLogTable } from "@/components/usage/RequestLogTable";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key,
    i18n: {
      resolvedLanguage: "en",
      language: "en",
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/lib/query/usage", () => ({
  usageKeys: {
    logs: () => ["usage", "logs"],
  },
  useRequestLogs: () => ({
    data: {
      data: [
        {
          requestId: "req-1",
          createdAt: 1710000000,
          providerName: "OpenClaw",
          model: "gpt-5",
          requestModel: "gpt-5",
          inputTokens: 1200,
          outputTokens: 800,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          totalCostUsd: "0.0123",
          costMultiplier: "1",
          durationMs: 2400,
          latencyMs: 2400,
          isStreaming: true,
          firstTokenMs: 800,
          statusCode: 200,
        },
      ],
      total: 1,
    },
    isLoading: false,
  }),
}));

vi.mock("@/components/usage/RequestDetailPanel", () => ({
  RequestDetailPanel: ({ requestId }: { requestId: string }) => (
    <div data-testid="request-detail-panel">{requestId}</div>
  ),
}));

describe("RequestLogTable", () => {
  it("opens the request detail panel when a log row is selected", () => {
    render(<RequestLogTable refreshIntervalMs={0} />);

    fireEvent.click(screen.getByText("OpenClaw"));

    expect(screen.getByTestId("request-detail-panel")).toHaveTextContent(
      "req-1",
    );
  });
});
