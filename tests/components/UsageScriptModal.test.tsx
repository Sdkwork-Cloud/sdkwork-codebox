import { createContext, useContext } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UsageScriptModal from "@/components/UsageScriptModal";
import type { Provider } from "@/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  }),
}));

vi.mock("@/lib/query", () => ({
  useSettingsQuery: () => ({
    data: {
      usageConfirmed: true,
    },
  }),
}));

vi.mock("@/lib/api", () => ({
  usageApi: {
    testScript: vi.fn(),
  },
  settingsApi: {
    save: vi.fn(),
  },
}));

vi.mock("@/components/common/FullScreenPanel", () => ({
  FullScreenPanel: ({
    isOpen,
    children,
    footer,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="fullscreen-panel">
        {children}
        <div>{footer}</div>
      </div>
    ) : null,
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("@/components/JsonEditor", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      data-testid="usage-script-editor"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    type = "button",
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
  }) => (
    <button type={type} onClick={onClick}>
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
    children: React.ReactNode;
    htmlFor?: string;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: ({
    checked,
    onCheckedChange,
    "aria-label": ariaLabel,
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    "aria-label"?: string;
  }) => (
    <input
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
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
  }: {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <TabsContext.Provider
      value={{ value: value ?? defaultValue ?? "", onValueChange }}
    >
      <div>{children}</div>
    </TabsContext.Provider>
  ),
  TabsList: ({ children }: { children: React.ReactNode }) => (
    <div role="tablist">{children}</div>
  ),
  TabsTrigger: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => {
    const ctx = useContext(TabsContext);
    return (
      <button type="button" role="tab" onClick={() => ctx.onValueChange?.(value)}>
        {children}
      </button>
    );
  },
  TabsContent: ({
    value,
    children,
  }: {
    value: string;
    children: React.ReactNode;
  }) => {
    const ctx = useContext(TabsContext);
    if (ctx.value !== value) {
      return null;
    }
    return <div>{children}</div>;
  },
}));

function createProvider(code: string): Provider {
  return {
    id: "provider-1",
    name: "Provider One",
    settingsConfig: {
      env: {
        ANTHROPIC_API_KEY: "sk-test",
        ANTHROPIC_BASE_URL: "https://api.example.com",
      },
    },
    meta: {
      usage_script: {
        enabled: true,
        language: "javascript",
        code,
        timeout: 10,
        templateType: "general",
      },
    },
  };
}

describe("UsageScriptModal", () => {
  it("re-syncs editor state from the latest provider config when reopened", () => {
    const firstProvider = createProvider(
      "return { remaining: 1, unit: 'USD' };",
    );
    const secondProvider = createProvider(
      "return { remaining: 2, unit: 'USD' };",
    );

    const { rerender } = render(
      <UsageScriptModal
        provider={firstProvider}
        appId="claude"
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByTestId("usage-script-editor")).toHaveValue(
      "return { remaining: 1, unit: 'USD' };",
    );

    rerender(
      <UsageScriptModal
        provider={secondProvider}
        appId="claude"
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    rerender(
      <UsageScriptModal
        provider={secondProvider}
        appId="claude"
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByTestId("usage-script-editor")).toHaveValue(
      "return { remaining: 2, unit: 'USD' };",
    );
  });
});
