import { createContext, useContext } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CodexConfigEditor from "@/components/providers/forms/CodexConfigEditor";
import GeminiConfigEditor from "@/components/providers/forms/GeminiConfigEditor";
import { CommonConfigEditor } from "@/components/providers/forms/CommonConfigEditor";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
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
  TabsList: ({ children }: any) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ value, children }: any) => {
    const ctx = useContext(TabsContext);
    return (
      <button
        type="button"
        role="tab"
        aria-selected={ctx.value === value}
        onClick={() => ctx.onValueChange?.(value)}
      >
        {children}
      </button>
    );
  },
  TabsContent: ({ value, children }: any) => {
    const ctx = useContext(TabsContext);
    if (ctx.value !== value) {
      return null;
    }
    return <div>{children}</div>;
  },
}));

vi.mock("@/components/JsonEditor", () => ({
  default: ({ value, onChange, language }: any) => (
    <textarea
      aria-label={`editor-${language ?? "plain"}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      readOnly={typeof onChange !== "function"}
    />
  ),
}));

vi.mock("@/components/common/FullScreenPanel", () => ({
  FullScreenPanel: ({ isOpen, children }: any) =>
    isOpen ? <div data-testid="fullscreen-panel">{children}</div> : null,
}));

describe("provider config editors", () => {
  it("organizes Claude config editing by file tabs instead of stacked blocks", () => {
    render(
      <CommonConfigEditor
        value={`{"env":{"ANTHROPIC_BASE_URL":"https://api.example.com"}}`}
        onChange={vi.fn()}
        useCommonConfig={true}
        onCommonConfigToggle={vi.fn()}
        commonConfigSnippet={`{"TEAM":"alpha"}`}
        onCommonConfigSnippetChange={vi.fn()}
        commonConfigError=""
        onEditClick={vi.fn()}
        isModalOpen={false}
        onModalClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("tab", { name: "settings.json" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "common snippet" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "common snippet" }));

    expect(screen.getByDisplayValue(`{"TEAM":"alpha"}`)).toBeInTheDocument();
  });

  it("separates Codex auth, config, and common snippet into file tabs", () => {
    render(
      <CodexConfigEditor
        authValue={`{"OPENAI_API_KEY":"sk-test"}`}
        configValue={`[model_providers.openai]\nbase_url = "https://api.example.com"`}
        onAuthChange={vi.fn()}
        onConfigChange={vi.fn()}
        useCommonConfig={true}
        onCommonConfigToggle={vi.fn()}
        commonConfigSnippet={`model = "gpt-5"`}
        onCommonConfigSnippetChange={vi.fn(() => true)}
        onCommonConfigErrorClear={vi.fn()}
        commonConfigError=""
        authError=""
        configError=""
      />,
    );

    expect(screen.getByRole("tab", { name: "auth.json" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "config.toml" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "common.toml" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("provider-config-workbench")).toHaveClass(
      "xl:grid-cols-[172px_minmax(0,1fr)]",
    );

    fireEvent.click(screen.getByRole("tab", { name: "config.toml" }));
    expect(
      screen.getByRole("textbox", { name: "editor-javascript" }),
    ).toHaveValue(
      `[model_providers.openai]\nbase_url = "https://api.example.com"`,
    );
  });

  it("separates Gemini env, config, and common snippet into file tabs", () => {
    render(
      <GeminiConfigEditor
        envValue={`GOOGLE_GEMINI_BASE_URL=https://api.example.com`}
        configValue={`{"timeout":30000}`}
        onEnvChange={vi.fn()}
        onConfigChange={vi.fn()}
        useCommonConfig={true}
        onCommonConfigToggle={vi.fn()}
        commonConfigSnippet={`{"TEAM":"beta"}`}
        onCommonConfigSnippetChange={vi.fn(() => true)}
        onCommonConfigErrorClear={vi.fn()}
        commonConfigError=""
        envError=""
        configError=""
      />,
    );

    expect(screen.getByRole("tab", { name: ".env" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "config.json" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "common snippet" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "config.json" }));
    expect(screen.getByDisplayValue(`{"timeout":30000}`)).toBeInTheDocument();
  });
});
