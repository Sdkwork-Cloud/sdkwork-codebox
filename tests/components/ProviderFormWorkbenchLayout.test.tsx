import { createContext, useContext, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProviderForm } from "@/components/providers/forms/ProviderForm";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/config/claudeProviderPresets", () => ({
  providerPresets: [],
}));

vi.mock("@/config/codexProviderPresets", () => ({
  codexProviderPresets: [],
}));

vi.mock("@/config/geminiProviderPresets", () => ({
  geminiProviderPresets: [],
}));

vi.mock("@/config/opencodeProviderPresets", () => ({
  opencodeProviderPresets: [],
}));

vi.mock("@/config/openclawProviderPresets", () => ({
  openclawProviderPresets: [],
}));

vi.mock("@/config/codexTemplates", () => ({
  getCodexCustomTemplate: () => ({
    auth: {},
    config: "",
  }),
}));

vi.mock("@/utils/providerConfigUtils", () => ({
  applyTemplateValues: (config: unknown) => config,
  hasApiKeyField: () => true,
}));

vi.mock("@/utils/providerMetaUtils", () => ({
  mergeProviderMeta: (_base: unknown, update: unknown) => update,
}));

vi.mock("@/components/providers/forms/OpenCodeFormFields", () => ({
  OpenCodeFormFields: () => <div>open-code-fields</div>,
}));

vi.mock("@/components/providers/forms/OpenClawFormFields", () => ({
  OpenClawFormFields: () => <div>openclaw-fields</div>,
}));

vi.mock("@/components/providers/forms/CodexConfigEditor", () => ({
  default: () => <div>codex-config-editor</div>,
}));

vi.mock("@/components/providers/forms/CommonConfigEditor", () => ({
  CommonConfigEditor: () => <div>common-config-editor</div>,
}));

vi.mock("@/components/providers/forms/GeminiConfigEditor", () => ({
  default: () => <div>gemini-config-editor</div>,
}));

vi.mock("@/components/JsonEditor", () => ({
  default: () => <div>json-editor</div>,
}));

vi.mock("@/components/providers/forms/ProviderPresetSelector", () => ({
  ProviderPresetSelector: () => <div>preset-selector</div>,
}));

vi.mock("@/components/providers/forms/BasicFormFields", () => ({
  BasicFormFields: ({ beforeNameSlot }: { beforeNameSlot?: ReactNode }) => (
    <div>
      <div>basic-form-fields</div>
      {beforeNameSlot}
    </div>
  ),
}));

vi.mock("@/components/providers/forms/ClaudeFormFields", () => ({
  ClaudeFormFields: () => <div>claude-fields</div>,
}));

vi.mock("@/components/providers/forms/CodexFormFields", () => ({
  CodexFormFields: () => <div>codex-fields</div>,
}));

vi.mock("@/components/providers/forms/GeminiFormFields", () => ({
  GeminiFormFields: () => <div>gemini-fields</div>,
}));

vi.mock("@/components/providers/forms/OmoFormFields", () => ({
  OmoFormFields: () => <div>omo-fields</div>,
}));

vi.mock("@/components/providers/forms/ProviderAdvancedConfig", () => ({
  ProviderAdvancedConfig: () => <div>advanced-config</div>,
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

vi.mock("@/components/providers/forms/hooks", () => ({
  useProviderCategory: () => ({ category: "custom" }),
  useApiKeyState: () => ({
    apiKey: "",
    handleApiKeyChange: vi.fn(),
    showApiKey: () => true,
  }),
  useBaseUrlState: () => ({
    baseUrl: "",
    handleClaudeBaseUrlChange: vi.fn(),
  }),
  useModelState: () => ({
    claudeModel: "",
    reasoningModel: "",
    defaultHaikuModel: "",
    defaultSonnetModel: "",
    defaultOpusModel: "",
    handleModelChange: vi.fn(),
  }),
  useCodexConfigState: () => ({
    codexAuth: "{}",
    codexConfig: "",
    codexApiKey: "",
    codexBaseUrl: "",
    codexModelName: "",
    codexAuthError: "",
    setCodexAuth: vi.fn(),
    handleCodexApiKeyChange: vi.fn(),
    handleCodexBaseUrlChange: vi.fn(),
    handleCodexModelNameChange: vi.fn(),
    handleCodexConfigChange: vi.fn(),
    resetCodexConfig: vi.fn(),
  }),
  useApiKeyLink: () => ({
    shouldShowApiKeyLink: false,
    websiteUrl: "",
    isPartner: false,
    partnerPromotionKey: undefined,
  }),
  useTemplateValues: () => ({
    templateValues: {},
    templateValueEntries: [],
    selectedPreset: null,
    handleTemplateValueChange: vi.fn(),
    validateTemplateValues: () => ({ isValid: true }),
  }),
  useCommonConfigSnippet: () => ({
    useCommonConfig: false,
    commonConfigSnippet: "{}",
    commonConfigError: "",
    handleCommonConfigToggle: vi.fn(),
    handleCommonConfigSnippetChange: vi.fn(),
    isExtracting: false,
    handleExtract: vi.fn(),
  }),
  useCodexCommonConfig: () => ({
    useCommonConfig: false,
    commonConfigSnippet: "",
    commonConfigError: "",
    handleCommonConfigToggle: vi.fn(),
    handleCommonConfigSnippetChange: vi.fn(() => true),
    isExtracting: false,
    handleExtract: vi.fn(),
    clearCommonConfigError: vi.fn(),
  }),
  useSpeedTestEndpoints: () => [],
  useCodexTomlValidation: () => ({
    configError: "",
    debouncedValidate: vi.fn(),
  }),
  useGeminiConfigState: () => ({
    geminiEnv: "",
    geminiConfig: "{}",
    geminiApiKey: "",
    geminiBaseUrl: "",
    geminiModel: "",
    envError: "",
    configError: "",
    handleGeminiApiKeyChange: vi.fn(),
    handleGeminiBaseUrlChange: vi.fn(),
    handleGeminiModelChange: vi.fn(),
    handleGeminiEnvChange: vi.fn(),
    handleGeminiConfigChange: vi.fn(),
    resetGeminiConfig: vi.fn(),
    envStringToObj: () => ({}),
    envObjToString: () => "",
  }),
  useGeminiCommonConfig: () => ({
    useCommonConfig: false,
    commonConfigSnippet: "{}",
    commonConfigError: "",
    handleCommonConfigToggle: vi.fn(),
    handleCommonConfigSnippetChange: vi.fn(() => true),
    isExtracting: false,
    handleExtract: vi.fn(),
    clearCommonConfigError: vi.fn(),
  }),
  useOmoModelSource: () => ({
    omoModelOptions: [],
    omoModelVariantsMap: {},
    omoPresetMetaMap: {},
    existingOpencodeKeys: [],
  }),
  useOpencodeFormState: () => ({
    opencodeProviderKey: "",
    setOpencodeProviderKey: vi.fn(),
    opencodeNpm: "",
    handleOpencodeNpmChange: vi.fn(),
    opencodeApiKey: "",
    handleOpencodeApiKeyChange: vi.fn(),
    opencodeBaseUrl: "",
    handleOpencodeBaseUrlChange: vi.fn(),
    opencodeModels: {},
    handleOpencodeModelsChange: vi.fn(),
    opencodeExtraOptions: "",
    handleOpencodeExtraOptionsChange: vi.fn(),
    resetOpencodeState: vi.fn(),
  }),
  useOmoDraftState: () => ({
    omoAgents: {},
    setOmoAgents: vi.fn(),
    omoCategories: {},
    setOmoCategories: vi.fn(),
    omoOtherFieldsStr: "",
    setOmoOtherFieldsStr: vi.fn(),
    mergedOmoJsonPreview: "{}",
    resetOmoDraftState: vi.fn(),
  }),
  useOpenclawFormState: () => ({
    openclawProviderKey: "",
    setOpenclawProviderKey: vi.fn(),
    openclawBaseUrl: "",
    openclawApiKey: "",
    openclawApi: "openai-completions",
    openclawModels: [],
    openclawUserAgent: true,
    existingOpenclawKeys: [],
    handleOpenclawBaseUrlChange: vi.fn(),
    handleOpenclawApiKeyChange: vi.fn(),
    handleOpenclawApiChange: vi.fn(),
    handleOpenclawModelsChange: vi.fn(),
    handleOpenclawUserAgentChange: vi.fn(),
    resetOpenclawState: vi.fn(),
  }),
}));

describe("ProviderForm workbench layout", () => {
  it("uses a strict left-rail workbench without snapshot sidebars", () => {
    render(
      <ProviderForm
        appId="claude"
        submitLabel="save"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          name: "Test Provider",
          settingsConfig: {},
          category: "custom",
        }}
        showButtons={false}
      />,
    );

    expect(screen.getByText("工作阶段")).toBeInTheDocument();
    expect(screen.getByText("当前上下文")).toBeInTheDocument();
    expect(screen.queryByText("当前快照")).not.toBeInTheDocument();
    expect(screen.queryByText("录入建议")).not.toBeInTheDocument();
    expect(screen.getByTestId("provider-form-workbench")).toHaveClass(
      "xl:grid-cols-[188px_minmax(0,1fr)]",
    );
  });

  it("renders config workbench directly without an extra section shell", () => {
    render(
      <ProviderForm
        appId="claude"
        submitLabel="save"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          name: "Test Provider",
          settingsConfig: {},
          category: "custom",
        }}
        showButtons={false}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /配置文件/i }));

    expect(screen.getByText("common-config-editor")).toBeInTheDocument();
    expect(
      screen.queryByText("按文件维度直接编辑与校验最终落盘内容，避免在长表单中来回跳转。"),
    ).not.toBeInTheDocument();
  });
});
