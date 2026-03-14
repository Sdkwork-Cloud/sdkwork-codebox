import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Provider } from "@/types";
import { EditProviderDialog } from "@/components/providers/EditProviderDialog";
import type { ProviderFormValues } from "@/components/providers/forms/ProviderForm";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogClose: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/lib/api", () => ({
  openclawApi: {
    getLiveProvider: vi.fn(),
  },
  providersApi: {
    getCurrent: vi.fn(),
  },
  vscodeApi: {
    getLiveProviderSettings: vi.fn(),
  },
}));

let mockFormValues: ProviderFormValues;

vi.mock("@/components/providers/forms/ProviderForm", () => ({
  ProviderForm: ({
    onSubmit,
  }: {
    onSubmit: (values: ProviderFormValues) => void;
  }) => (
    <form
      id="provider-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(mockFormValues);
      }}
    />
  ),
}));

function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: overrides.id ?? "provider-1",
    name: overrides.name ?? "Provider One",
    settingsConfig: overrides.settingsConfig ?? {
      env: { ANTHROPIC_BASE_URL: "https://provider.example.com" },
    },
    websiteUrl: overrides.websiteUrl,
    notes: overrides.notes,
    meta: overrides.meta,
    category: overrides.category,
    icon: overrides.icon,
    iconColor: overrides.iconColor,
    createdAt: overrides.createdAt,
    sortIndex: overrides.sortIndex,
  };
}

describe("EditProviderDialog", () => {
  beforeEach(() => {
    mockFormValues = {
      name: "Updated Provider",
      websiteUrl: "https://provider.example.com",
      settingsConfig: JSON.stringify({ env: {}, config: {} }),
    };
  });

  it("使用右侧操作抽屉承载编辑供应商流程", () => {
    render(
      <EditProviderDialog
        open
        provider={createProvider()}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        appId="opencode"
      />,
    );

    expect(
      screen.getByTestId("provider-edit-operation-drawer"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("fullscreen-panel")).not.toBeInTheDocument();
  });

  it("继续通过 provider-form 保存编辑结果", async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    const handleOpenChange = vi.fn();

    render(
      <EditProviderDialog
        open
        provider={createProvider()}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        appId="opencode"
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "common.save",
      }),
    );

    await waitFor(() => expect(handleSubmit).toHaveBeenCalledTimes(1));

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
