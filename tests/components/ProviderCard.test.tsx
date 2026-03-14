import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Provider } from "@/types";
import { ProviderCard } from "@/components/providers/ProviderCard";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown> | string) => {
      if (typeof options === "string") {
        return options;
      }
      return (options?.defaultValue as string) ?? key;
    },
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => <div data-testid="provider-icon" />,
}));

vi.mock("@/components/UsageFooter", () => ({
  default: () => <div data-testid="usage-footer" />,
}));

vi.mock("@/components/common/ProviderHealthBadge", () => ({
  ProviderHealthBadge: () => <div>health-badge</div>,
}));

vi.mock("@/components/providers/FailoverPriorityBadge", () => ({
  FailoverPriorityBadge: () => <div>priority-badge</div>,
}));

vi.mock("@/lib/query/failover", () => ({
  useProviderHealth: () => ({ data: null }),
}));

vi.mock("@/lib/query/queries", () => ({
  useUsageQuery: () => ({ data: null }),
}));

function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: overrides.id ?? "provider-1",
    name: overrides.name ?? "Provider One",
    settingsConfig: overrides.settingsConfig ?? {},
    websiteUrl: overrides.websiteUrl ?? "https://provider.example.com",
    meta: overrides.meta,
    category: overrides.category,
    ...overrides,
  };
}

describe("ProviderCard", () => {
  it("renders the action bar as immediately clickable controls", () => {
    const provider = createProvider();
    const onSwitch = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onDuplicate = vi.fn();
    const onConfigureUsage = vi.fn();
    const onOpenWebsite = vi.fn();
    const onTest = vi.fn();

    render(
      <ProviderCard
        provider={provider}
        isCurrent={false}
        appId="claude"
        onSwitch={onSwitch}
        onEdit={onEdit}
        onDelete={onDelete}
        onConfigureUsage={onConfigureUsage}
        onOpenWebsite={onOpenWebsite}
        onDuplicate={onDuplicate}
        onTest={onTest}
        isProxyRunning={false}
      />,
    );

    const editButton = screen.getByTitle("common.edit");
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute("data-tauri-no-drag");

    fireEvent.click(screen.getByRole("button", { name: "provider.enable" }));
    fireEvent.click(editButton);
    fireEvent.click(screen.getByTitle("provider.duplicate"));
    fireEvent.click(screen.getByTitle("provider.configureUsage"));
    fireEvent.click(screen.getByTitle("common.delete"));
    fireEvent.click(screen.getByTitle("测试模型"));
    fireEvent.click(screen.getByTitle("https://provider.example.com"));

    expect(onSwitch).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onConfigureUsage).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onTest).toHaveBeenCalledTimes(1);
    expect(onOpenWebsite).toHaveBeenCalledWith("https://provider.example.com");
  });

  it("shows additive-mode actions without hover dependency for openclaw", () => {
    const provider = createProvider();
    const onSwitch = vi.fn();
    const onSetAsDefault = vi.fn();

    render(
      <ProviderCard
        provider={provider}
        isCurrent={false}
        appId="openclaw"
        isInConfig={true}
        onSwitch={onSwitch}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onConfigureUsage={vi.fn()}
        onOpenWebsite={vi.fn()}
        onDuplicate={vi.fn()}
        isProxyRunning={false}
        onSetAsDefault={onSetAsDefault}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "设为默认" }));
    fireEvent.click(screen.getByRole("button", { name: "移除" }));

    expect(onSetAsDefault).toHaveBeenCalledTimes(1);
    expect(onSwitch).not.toHaveBeenCalled();
  });
});
