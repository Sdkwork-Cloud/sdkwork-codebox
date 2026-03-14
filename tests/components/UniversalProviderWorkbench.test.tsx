import { createContext, useContext, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UniversalProviderFormModal } from "@/components/universal/UniversalProviderFormModal";
import { UniversalProviderCard } from "@/components/universal/UniversalProviderCard";
import type { UniversalProvider } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key,
  }),
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => <div data-testid="provider-icon" />,
}));

vi.mock("@/components/common/FullScreenPanel", () => ({
  FullScreenPanel: ({ children }: { children: ReactNode }) => (
    <div data-testid="fullscreen-panel">{children}</div>
  ),
}));

vi.mock("@/components/common/OperationDrawer", () => ({
  OperationDrawer: ({
    children,
    testId,
    footer,
  }: {
    children: ReactNode;
    testId?: string;
    footer?: ReactNode;
  }) => (
    <div data-testid={testId}>
      {children}
      <div>{footer}</div>
    </div>
  ),
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    type = "button",
    className,
    ...props
  }: {
    children: ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
    className?: string;
  }) => (
    <button type={type} onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}));

vi.mock("@/components/JsonEditor", () => ({
  default: ({ value }: { value: string }) => <div>{value}</div>,
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

function createUniversalProvider(
  overrides: Partial<UniversalProvider> = {},
): UniversalProvider {
  return {
    id: overrides.id ?? "universal-1",
    name: overrides.name ?? "NewAPI",
    providerType: overrides.providerType ?? "newapi",
    baseUrl: overrides.baseUrl ?? "https://api.example.com",
    apiKey: overrides.apiKey ?? "sk-test",
    apps:
      overrides.apps ?? {
        claude: true,
        codex: true,
        gemini: true,
      },
    models:
      overrides.models ?? {
        claude: {
          model: "claude-sonnet-4-20250514",
          haikuModel: "claude-haiku-4-20250514",
          sonnetModel: "claude-sonnet-4-20250514",
          opusModel: "claude-sonnet-4-20250514",
        },
        codex: {
          model: "gpt-5.4",
          reasoningEffort: "high",
        },
        gemini: {
          model: "gemini-2.5-pro",
        },
      },
    createdAt: overrides.createdAt ?? 1,
    websiteUrl: overrides.websiteUrl,
    notes: overrides.notes,
    icon: overrides.icon,
    iconColor: overrides.iconColor,
  };
}

describe("Universal provider workbench", () => {
  it("uses the operation drawer workbench with tabbed sections", () => {
    render(
      <UniversalProviderFormModal
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId("universal-provider-operation-drawer"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("fullscreen-panel")).not.toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "基础信息" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "配置预览" }),
    ).toBeInTheDocument();
  });

  it("keeps card actions directly visible without hover-only opacity", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onSync = vi.fn();

    render(
      <UniversalProviderCard
        provider={createUniversalProvider()}
        onEdit={onEdit}
        onDelete={onDelete}
        onSync={onSync}
      />,
    );

    const actions = screen.getByTestId("universal-provider-card-actions");
    expect(actions.className).not.toContain("opacity-0");

    fireEvent.click(
      screen.getByRole("button", {
        name: "同步到应用",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "编辑",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "删除",
      }),
    );

    expect(onSync).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
