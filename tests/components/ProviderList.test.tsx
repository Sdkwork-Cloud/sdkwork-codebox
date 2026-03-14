import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import i18n from "i18next";
import type { Provider } from "@/types";
import { ProviderList } from "@/components/providers/ProviderList";
import zhLocale from "../../packages/sdkwork-codebox-i18n/src/i18n/locales/zh.json";

const useDragSortMock = vi.fn();
const useSortableMock = vi.fn();
const providerCardRenderSpy = vi.fn();
const importDefaultMock = vi.fn();
const importOpenCodeFromLiveMock = vi.fn();
const importOpenClawFromLiveMock = vi.fn();
const getOpenCodeLiveProviderIdsMock = vi.fn();
const settingsApiGetMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastInfoMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("@/hooks/useDragSort", () => ({
  useDragSort: (...args: unknown[]) => useDragSortMock(...args),
}));

vi.mock("@/lib/api/providers", () => ({
  providersApi: {
    importDefault: (...args: unknown[]) => importDefaultMock(...args),
    importOpenCodeFromLive: (...args: unknown[]) =>
      importOpenCodeFromLiveMock(...args),
    importOpenClawFromLive: (...args: unknown[]) =>
      importOpenClawFromLiveMock(...args),
    getOpenCodeLiveProviderIds: (...args: unknown[]) =>
      getOpenCodeLiveProviderIdsMock(...args),
  },
}));

vi.mock("@/lib/api/settings", () => ({
  settingsApi: {
    get: (...args: unknown[]) => settingsApiGetMock(...args),
  },
}));

vi.mock("@/hooks/useOpenClaw", () => ({
  useOpenClawLiveProviderIds: () => ({ data: [] }),
  useOpenClawDefaultModel: () => ({ data: null }),
}));

vi.mock("@/lib/query/omo", () => ({
  useCurrentOmoProviderId: () => ({ data: null }),
  useCurrentOmoSlimProviderId: () => ({ data: null }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    info: (...args: unknown[]) => toastInfoMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock("@/components/providers/ProviderCard", () => ({
  ProviderCard: (props: any) => {
    providerCardRenderSpy(props);
    const {
      provider,
      onSwitch,
      onEdit,
      onDelete,
      onDuplicate,
      onConfigureUsage,
    } = props;

    return (
      <div data-testid={`provider-card-${provider.id}`}>
        <button
          data-testid={`switch-${provider.id}`}
          onClick={() => onSwitch(provider)}
        >
          switch
        </button>
        <button
          data-testid={`edit-${provider.id}`}
          onClick={() => onEdit(provider)}
        >
          edit
        </button>
        <button
          data-testid={`duplicate-${provider.id}`}
          onClick={() => onDuplicate(provider)}
        >
          duplicate
        </button>
        <button
          data-testid={`usage-${provider.id}`}
          onClick={() => onConfigureUsage(provider)}
        >
          usage
        </button>
        <button
          data-testid={`delete-${provider.id}`}
          onClick={() => onDelete(provider)}
        >
          delete
        </button>
        <span data-testid={`is-current-${provider.id}`}>
          {props.isCurrent ? "current" : "inactive"}
        </span>
        <span data-testid={`drag-attr-${provider.id}`}>
          {props.dragHandleProps?.attributes?.["data-dnd-id"] ?? "none"}
        </span>
      </div>
    );
  },
}));

vi.mock("@/components/UsageFooter", () => ({
  default: () => <div data-testid="usage-footer" />,
}));

vi.mock("@dnd-kit/sortable", async () => {
  const actual = await vi.importActual<any>("@dnd-kit/sortable");

  return {
    ...actual,
    useSortable: (...args: unknown[]) => useSortableMock(...args),
  };
});

// Mock hooks that use QueryClient
vi.mock("@/hooks/useStreamCheck", () => ({
  useStreamCheck: () => ({
    checkProvider: vi.fn(),
    isChecking: () => false,
  }),
}));

vi.mock("@/lib/query/failover", () => ({
  useAutoFailoverEnabled: () => ({ data: false }),
  useFailoverQueue: () => ({ data: [] }),
  useAddToFailoverQueue: () => ({ mutate: vi.fn() }),
  useRemoveFromFailoverQueue: () => ({ mutate: vi.fn() }),
  useReorderFailoverQueue: () => ({ mutate: vi.fn() }),
}));

function createProvider(overrides: Partial<Provider> = {}): Provider {
  return {
    id: overrides.id ?? "provider-1",
    name: overrides.name ?? "Test Provider",
    settingsConfig: overrides.settingsConfig ?? {},
    category: overrides.category,
    createdAt: overrides.createdAt,
    sortIndex: overrides.sortIndex,
    meta: overrides.meta,
    websiteUrl: overrides.websiteUrl,
  };
}

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  useDragSortMock.mockReset();
  useSortableMock.mockReset();
  providerCardRenderSpy.mockClear();
  importDefaultMock.mockReset();
  importOpenCodeFromLiveMock.mockReset();
  importOpenClawFromLiveMock.mockReset();
  getOpenCodeLiveProviderIdsMock.mockReset();
  settingsApiGetMock.mockReset();
  toastSuccessMock.mockReset();
  toastInfoMock.mockReset();
  toastErrorMock.mockReset();

  useSortableMock.mockImplementation(({ id }: { id: string }) => ({
    setNodeRef: vi.fn(),
    attributes: { "data-dnd-id": id },
    listeners: { onPointerDown: vi.fn() },
    transform: null,
    transition: null,
    isDragging: false,
  }));

  useDragSortMock.mockReturnValue({
    sortedProviders: [],
    sensors: [],
    handleDragEnd: vi.fn(),
  });

  importDefaultMock.mockResolvedValue(true);
  importOpenCodeFromLiveMock.mockResolvedValue(1);
  importOpenClawFromLiveMock.mockResolvedValue(1);
  getOpenCodeLiveProviderIdsMock.mockResolvedValue([]);
  settingsApiGetMock.mockResolvedValue({ streamCheckConfirmed: true });
});

describe("ProviderList Component", () => {
  it("should render skeleton placeholders when loading", () => {
    const { container } = renderWithQueryClient(
      <ProviderList
        providers={{}}
        currentProviderId=""
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
        isLoading
      />,
    );

    const placeholders = container.querySelectorAll(
      ".border-dashed.border-muted-foreground\\/40",
    );
    expect(placeholders).toHaveLength(3);
  });

  it("should show empty state and trigger create callback when no providers exist", () => {
    const handleCreate = vi.fn();
    useDragSortMock.mockReturnValueOnce({
      sortedProviders: [],
      sensors: [],
      handleDragEnd: vi.fn(),
    });
    i18n.addResourceBundle("zh", "translation", zhLocale, true, true);

    try {
      renderWithQueryClient(
        <ProviderList
          providers={{}}
          currentProviderId=""
          appId="claude"
          onSwitch={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
          onOpenWebsite={vi.fn()}
          onCreate={handleCreate}
        />,
      );

      const addButton = screen.getByRole("button", {
        name: "添加供应商",
      });
      expect(
        screen.getByText(
          "除 Key 和请求地址外的数据（如插件配置）会被保存到通用配置片段，用于在不同供应商之间共享",
        ),
      ).toBeInTheDocument();
      fireEvent.click(addButton);

      expect(handleCreate).toHaveBeenCalledTimes(1);
    } finally {
      i18n.removeResourceBundle("zh", "translation");
    }
  });

  it("should hide snippet hint for apps that did not show it before migration", () => {
    useDragSortMock.mockReturnValueOnce({
      sortedProviders: [],
      sensors: [],
      handleDragEnd: vi.fn(),
    });
    i18n.addResourceBundle("zh", "translation", zhLocale, true, true);

    try {
      renderWithQueryClient(
        <ProviderList
          providers={{}}
          currentProviderId=""
          appId="openclaw"
          onSwitch={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
          onOpenWebsite={vi.fn()}
        />,
      );

      expect(
        screen.queryByText(
          "除 Key 和请求地址外的数据（如插件配置）会被保存到通用配置片段，用于在不同供应商之间共享",
        ),
      ).not.toBeInTheDocument();
    } finally {
      i18n.removeResourceBundle("zh", "translation");
    }
  });

  it("should render in order returned by useDragSort and pass through action callbacks", () => {
    const providerA = createProvider({ id: "a", name: "A" });
    const providerB = createProvider({ id: "b", name: "B" });

    const handleSwitch = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const handleDuplicate = vi.fn();
    const handleUsage = vi.fn();
    const handleOpenWebsite = vi.fn();

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerB, providerA],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ a: providerA, b: providerB }}
        currentProviderId="b"
        appId="claude"
        onSwitch={handleSwitch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onConfigureUsage={handleUsage}
        onOpenWebsite={handleOpenWebsite}
      />,
    );

    // Verify sort order
    expect(providerCardRenderSpy).toHaveBeenCalledTimes(2);
    expect(providerCardRenderSpy.mock.calls[0][0].provider.id).toBe("b");
    expect(providerCardRenderSpy.mock.calls[1][0].provider.id).toBe("a");

    // Verify current provider marker
    expect(providerCardRenderSpy.mock.calls[0][0].isCurrent).toBe(true);

    // Drag attributes from useSortable
    expect(
      providerCardRenderSpy.mock.calls[0][0].dragHandleProps?.attributes[
      "data-dnd-id"
      ],
    ).toBe("b");
    expect(
      providerCardRenderSpy.mock.calls[1][0].dragHandleProps?.attributes[
      "data-dnd-id"
      ],
    ).toBe("a");

    // Trigger action buttons
    fireEvent.click(screen.getByTestId("switch-b"));
    fireEvent.click(screen.getByTestId("edit-b"));
    fireEvent.click(screen.getByTestId("duplicate-b"));
    fireEvent.click(screen.getByTestId("usage-b"));
    fireEvent.click(screen.getByTestId("delete-a"));

    expect(handleSwitch).toHaveBeenCalledWith(providerB);
    expect(handleEdit).toHaveBeenCalledWith(providerB);
    expect(handleDuplicate).toHaveBeenCalledWith(providerB);
    expect(handleUsage).toHaveBeenCalledWith(providerB);
    expect(handleDelete).toHaveBeenCalledWith(providerA);

    // Verify useDragSort call parameters
    expect(useDragSortMock).toHaveBeenCalledWith(
      { a: providerA, b: providerB },
      "claude",
    );
  });

  it("filters providers with the search input", () => {
    const providerAlpha = createProvider({ id: "alpha", name: "Alpha Labs" });
    const providerBeta = createProvider({ id: "beta", name: "Beta Works" });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerAlpha, providerBeta],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ alpha: providerAlpha, beta: providerBeta }}
        currentProviderId=""
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "f", metaKey: true });
    const searchInput = screen.getByPlaceholderText(
      "Search name, notes, or URL...",
    );
    // Initially both providers are rendered
    expect(screen.getByTestId("provider-card-alpha")).toBeInTheDocument();
    expect(screen.getByTestId("provider-card-beta")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "beta" } });
    expect(screen.queryByTestId("provider-card-alpha")).not.toBeInTheDocument();
    expect(screen.getByTestId("provider-card-beta")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "gamma" } });
    expect(screen.queryByTestId("provider-card-alpha")).not.toBeInTheDocument();
    expect(screen.queryByTestId("provider-card-beta")).not.toBeInTheDocument();
    expect(
      screen.getByText("No providers match your search."),
    ).toBeInTheDocument();
  });

  it("shows visible search and import actions above additive provider lists", () => {
    const providerAlpha = createProvider({ id: "alpha", name: "Alpha Labs" });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerAlpha],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ alpha: providerAlpha }}
        currentProviderId="alpha"
        appId="opencode"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "搜索供应商" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "导入当前配置" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "搜索供应商" }));

    expect(
      screen.getByRole("textbox", { name: "Search providers" }),
    ).toBeInTheDocument();
  });

  it("hides bootstrap import action for populated non-additive provider lists", () => {
    const providerAlpha = createProvider({ id: "alpha", name: "Alpha Labs" });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerAlpha],
      sensors: [],
      handleDragEnd: vi.fn(),
    });

    renderWithQueryClient(
      <ProviderList
        providers={{ alpha: providerAlpha }}
        currentProviderId="alpha"
        appId="claude"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "导入当前配置" }),
    ).not.toBeInTheDocument();
  });

  it("shows a contextual message when additive import finds no new providers", async () => {
    const providerAlpha = createProvider({ id: "alpha", name: "Alpha Labs" });

    useDragSortMock.mockReturnValue({
      sortedProviders: [providerAlpha],
      sensors: [],
      handleDragEnd: vi.fn(),
    });
    importOpenCodeFromLiveMock.mockResolvedValueOnce(0);

    renderWithQueryClient(
      <ProviderList
        providers={{ alpha: providerAlpha }}
        currentProviderId="alpha"
        appId="opencode"
        onSwitch={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onOpenWebsite={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "导入当前配置" }));

    await waitFor(() => {
      expect(toastInfoMock).toHaveBeenCalledWith("provider.importNothingNew");
    });
    expect(toastInfoMock).not.toHaveBeenCalledWith("provider.noProviders");
  });
});
