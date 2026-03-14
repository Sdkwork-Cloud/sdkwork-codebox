import { createContext, useContext } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UsageDashboard } from "@/components/usage/UsageDashboard";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key,
  }),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/components/usage/UsageSummaryCards", () => ({
  UsageSummaryCards: () => <div>usage-summary-cards</div>,
}));

vi.mock("@/components/usage/UsageTrendChart", () => ({
  UsageTrendChart: () => <div>usage-trend-chart</div>,
}));

vi.mock("@/components/usage/RequestLogTable", () => ({
  RequestLogTable: () => <div>request-log-table</div>,
}));

vi.mock("@/components/usage/ProviderStatsTable", () => ({
  ProviderStatsTable: () => <div>provider-stats-table</div>,
}));

vi.mock("@/components/usage/ModelStatsTable", () => ({
  ModelStatsTable: () => <div>model-stats-table</div>,
}));

vi.mock("@/components/usage/PricingConfigPanel", () => ({
  PricingConfigPanel: () => <div>pricing-config-panel</div>,
}));

const TabsContext = createContext<{
  value: string;
  onValueChange?: (value: string) => void;
}>({
  value: "",
});

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    value,
    defaultValue,
    onValueChange,
    children,
    className,
    ...props
  }: any) => (
    <TabsContext.Provider
      value={{ value: value ?? defaultValue ?? "", onValueChange }}
    >
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  ),
  TabsList: ({ children, className, ...props }: any) => (
    <div role="tablist" className={className} {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ value, children, className, ...props }: any) => {
    const ctx = useContext(TabsContext);
    return (
      <button
        type="button"
        role="tab"
        aria-selected={ctx.value === value}
        className={className}
        onClick={() => ctx.onValueChange?.(value)}
        {...props}
      >
        {children}
      </button>
    );
  },
  TabsContent: ({ value, children, className, ...props }: any) => {
    const ctx = useContext(TabsContext);
    if (ctx.value !== value) {
      return null;
    }
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  },
}));

describe("UsageDashboard layout", () => {
  it("uses a left-rail analysis workbench and keeps pricing in the same tab system", () => {
    render(<UsageDashboard />);

    expect(screen.getByText("usage-summary-cards")).toBeInTheDocument();
    expect(screen.getByText("usage-trend-chart")).toBeInTheDocument();
    expect(screen.getByTestId("usage-dashboard-analysis-tabs")).toHaveClass(
      "xl:grid-cols-[220px_minmax(0,1fr)]",
    );

    fireEvent.click(screen.getByRole("tab", { name: /pricing/i }));

    expect(screen.getByText("pricing-config-panel")).toBeInTheDocument();
  });
});
