import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  FileCode2,
  Info,
  Link2,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { providerSchema, type ProviderFormData } from "@/lib/schemas/provider";
import type { AppId } from "@/lib/api";
import type {
  ProviderCategory,
  ProviderMeta,
  ProviderTestConfig,
  ProviderProxyConfig,
  ClaudeApiFormat,
  ClaudeApiKeyField,
} from "@/types";
import {
  providerPresets,
  type ProviderPreset,
} from "@/config/claudeProviderPresets";
import {
  codexProviderPresets,
  type CodexProviderPreset,
} from "@/config/codexProviderPresets";
import {
  geminiProviderPresets,
  type GeminiProviderPreset,
} from "@/config/geminiProviderPresets";
import {
  opencodeProviderPresets,
  type OpenCodeProviderPreset,
} from "@/config/opencodeProviderPresets";
import {
  openclawProviderPresets,
  type OpenClawProviderPreset,
  type OpenClawSuggestedDefaults,
} from "@/config/openclawProviderPresets";
import { OpenCodeFormFields } from "./OpenCodeFormFields";
import { OpenClawFormFields } from "./OpenClawFormFields";
import type { UniversalProviderPreset } from "@/config/universalProviderPresets";
import {
  applyTemplateValues,
  hasApiKeyField,
} from "@/utils/providerConfigUtils";
import { mergeProviderMeta } from "@/utils/providerMetaUtils";
import { getCodexCustomTemplate } from "@/config/codexTemplates";
import CodexConfigEditor from "./CodexConfigEditor";
import { CommonConfigEditor } from "./CommonConfigEditor";
import GeminiConfigEditor from "./GeminiConfigEditor";
import JsonEditor from "@/components/JsonEditor";
import { Label } from "@/components/ui/label";
import { ProviderPresetSelector } from "./ProviderPresetSelector";
import { BasicFormFields } from "./BasicFormFields";
import { ClaudeFormFields } from "./ClaudeFormFields";
import { CodexFormFields } from "./CodexFormFields";
import { GeminiFormFields } from "./GeminiFormFields";
import { OmoFormFields } from "./OmoFormFields";
import {
  getProviderWorkbenchTabForField,
  getProviderWorkbenchTabs,
  type ProviderWorkbenchTabDefinition,
  type ProviderWorkbenchTabId,
} from "./providerWorkbench";
import { parseOmoOtherFieldsObject } from "@/types/omo";
import {
  ProviderAdvancedConfig,
  type PricingModelSourceOption,
} from "./ProviderAdvancedConfig";
import {
  useProviderCategory,
  useApiKeyState,
  useBaseUrlState,
  useModelState,
  useCodexConfigState,
  useApiKeyLink,
  useTemplateValues,
  useCommonConfigSnippet,
  useCodexCommonConfig,
  useSpeedTestEndpoints,
  useCodexTomlValidation,
  useGeminiConfigState,
  useGeminiCommonConfig,
  useOmoModelSource,
  useOpencodeFormState,
  useOmoDraftState,
  useOpenclawFormState,
} from "./hooks";
import {
  CLAUDE_DEFAULT_CONFIG,
  CODEX_DEFAULT_CONFIG,
  GEMINI_DEFAULT_CONFIG,
  OPENCODE_DEFAULT_CONFIG,
  OPENCLAW_DEFAULT_CONFIG,
  normalizePricingSource,
} from "./helpers/opencodeFormUtils";

type PresetEntry = {
  id: string;
  preset:
    | ProviderPreset
    | CodexProviderPreset
    | GeminiProviderPreset
    | OpenCodeProviderPreset
    | OpenClawProviderPreset;
};

interface ProviderFormProps {
  appId: AppId;
  providerId?: string;
  submitLabel: string;
  onSubmit: (values: ProviderFormValues) => void;
  onCancel: () => void;
  onUniversalPresetSelect?: (preset: UniversalProviderPreset) => void;
  onManageUniversalProviders?: () => void;
  initialData?: {
    name?: string;
    websiteUrl?: string;
    notes?: string;
    settingsConfig?: Record<string, unknown>;
    category?: ProviderCategory;
    meta?: ProviderMeta;
    icon?: string;
    iconColor?: string;
  };
  showButtons?: boolean;
}

export function ProviderForm({
  appId,
  providerId,
  submitLabel,
  onSubmit,
  onCancel,
  onUniversalPresetSelect,
  onManageUniversalProviders,
  initialData,
  showButtons = true,
}: ProviderFormProps) {
  const { t } = useTranslation();
  const isEditMode = Boolean(initialData);
  const [activeWorkbenchTab, setActiveWorkbenchTab] =
    useState<ProviderWorkbenchTabId>(isEditMode ? "basic" : "preset");

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
    initialData ? null : "custom",
  );
  const [activePreset, setActivePreset] = useState<{
    id: string;
    category?: ProviderCategory;
    isPartner?: boolean;
    partnerPromotionKey?: string;
    suggestedDefaults?: OpenClawSuggestedDefaults;
  } | null>(null);
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [isCodexEndpointModalOpen, setIsCodexEndpointModalOpen] =
    useState(false);

  const [draftCustomEndpoints, setDraftCustomEndpoints] = useState<string[]>(
    () => {
      if (initialData) return [];
      return [];
    },
  );
  const [endpointAutoSelect, setEndpointAutoSelect] = useState<boolean>(
    () => initialData?.meta?.endpointAutoSelect ?? true,
  );

  const [testConfig, setTestConfig] = useState<ProviderTestConfig>(
    () => initialData?.meta?.testConfig ?? { enabled: false },
  );
  const [proxyConfig, setProxyConfig] = useState<ProviderProxyConfig>(
    () => initialData?.meta?.proxyConfig ?? { enabled: false },
  );
  const [pricingConfig, setPricingConfig] = useState<{
    enabled: boolean;
    costMultiplier?: string;
    pricingModelSource: PricingModelSourceOption;
  }>(() => ({
    enabled:
      initialData?.meta?.costMultiplier !== undefined ||
      initialData?.meta?.pricingModelSource !== undefined,
    costMultiplier: initialData?.meta?.costMultiplier,
    pricingModelSource: normalizePricingSource(
      initialData?.meta?.pricingModelSource,
    ),
  }));

  const { category } = useProviderCategory({
    appId,
    selectedPresetId,
    isEditMode,
    initialCategory: initialData?.category,
  });
  const isOmoCategory = appId === "opencode" && category === "omo";
  const isOmoSlimCategory = appId === "opencode" && category === "omo-slim";
  const isAnyOmoCategory = isOmoCategory || isOmoSlimCategory;

  useEffect(() => {
    setSelectedPresetId(initialData ? null : "custom");
    setActivePreset(null);

    if (!initialData) {
      setDraftCustomEndpoints([]);
    }
    setEndpointAutoSelect(initialData?.meta?.endpointAutoSelect ?? true);
    setTestConfig(initialData?.meta?.testConfig ?? { enabled: false });
    setProxyConfig(initialData?.meta?.proxyConfig ?? { enabled: false });
    setPricingConfig({
      enabled:
        initialData?.meta?.costMultiplier !== undefined ||
        initialData?.meta?.pricingModelSource !== undefined,
      costMultiplier: initialData?.meta?.costMultiplier,
      pricingModelSource: normalizePricingSource(
        initialData?.meta?.pricingModelSource,
      ),
    });
  }, [appId, initialData]);

  const defaultValues: ProviderFormData = useMemo(
    () => ({
      name: initialData?.name ?? "",
      websiteUrl: initialData?.websiteUrl ?? "",
      notes: initialData?.notes ?? "",
      settingsConfig: initialData?.settingsConfig
        ? JSON.stringify(initialData.settingsConfig, null, 2)
        : appId === "codex"
          ? CODEX_DEFAULT_CONFIG
          : appId === "gemini"
            ? GEMINI_DEFAULT_CONFIG
            : appId === "opencode"
              ? OPENCODE_DEFAULT_CONFIG
              : appId === "openclaw"
                ? OPENCLAW_DEFAULT_CONFIG
                : CLAUDE_DEFAULT_CONFIG,
      icon: initialData?.icon ?? "",
      iconColor: initialData?.iconColor ?? "",
    }),
    [initialData, appId],
  );

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const handleSettingsConfigChange = useCallback(
    (config: string) => {
      form.setValue("settingsConfig", config);
    },
    [form],
  );

  const [localApiKeyField, setLocalApiKeyField] = useState<ClaudeApiKeyField>(
    () => {
      if (appId !== "claude") return "ANTHROPIC_AUTH_TOKEN";
      if (initialData?.meta?.apiKeyField) return initialData.meta.apiKeyField;
      // Infer from existing config env
      const env = (initialData?.settingsConfig as Record<string, unknown>)
        ?.env as Record<string, unknown> | undefined;
      if (env?.ANTHROPIC_API_KEY !== undefined) return "ANTHROPIC_API_KEY";
      return "ANTHROPIC_AUTH_TOKEN";
    },
  );

  const {
    apiKey,
    handleApiKeyChange,
    showApiKey: shouldShowApiKey,
  } = useApiKeyState({
    initialConfig: form.getValues("settingsConfig"),
    onConfigChange: handleSettingsConfigChange,
    selectedPresetId,
    category,
    appType: appId,
    apiKeyField: appId === "claude" ? localApiKeyField : undefined,
  });

  const { baseUrl, handleClaudeBaseUrlChange } = useBaseUrlState({
    appType: appId,
    category,
    settingsConfig: form.getValues("settingsConfig"),
    codexConfig: "",
    onSettingsConfigChange: handleSettingsConfigChange,
    onCodexConfigChange: () => {},
  });

  const {
    claudeModel,
    reasoningModel,
    defaultHaikuModel,
    defaultSonnetModel,
    defaultOpusModel,
    handleModelChange,
  } = useModelState({
    settingsConfig: form.getValues("settingsConfig"),
    onConfigChange: handleSettingsConfigChange,
  });

  const [localApiFormat, setLocalApiFormat] = useState<ClaudeApiFormat>(() => {
    if (appId !== "claude") return "anthropic";
    return initialData?.meta?.apiFormat ?? "anthropic";
  });

  const handleApiFormatChange = useCallback((format: ClaudeApiFormat) => {
    setLocalApiFormat(format);
  }, []);

  const handleApiKeyFieldChange = useCallback(
    (field: ClaudeApiKeyField) => {
      const prev = localApiKeyField;
      setLocalApiKeyField(field);

      // Swap the env key name in settingsConfig
      try {
        const raw = form.getValues("settingsConfig");
        const config = JSON.parse(raw || "{}");
        if (config?.env && prev in config.env) {
          const value = config.env[prev];
          delete config.env[prev];
          config.env[field] = value;
          const updated = JSON.stringify(config, null, 2);
          form.setValue("settingsConfig", updated);
          handleSettingsConfigChange(updated);
        }
      } catch {
        // ignore parse errors during editing
      }
    },
    [localApiKeyField, form, handleSettingsConfigChange],
  );

  const {
    codexAuth,
    codexConfig,
    codexApiKey,
    codexBaseUrl,
    codexModelName,
    codexAuthError,
    setCodexAuth,
    handleCodexApiKeyChange,
    handleCodexBaseUrlChange,
    handleCodexModelNameChange,
    handleCodexConfigChange: originalHandleCodexConfigChange,
    resetCodexConfig,
  } = useCodexConfigState({ initialData });

  const { configError: codexConfigError, debouncedValidate } =
    useCodexTomlValidation();

  const handleCodexConfigChange = useCallback(
    (value: string) => {
      originalHandleCodexConfigChange(value);
      debouncedValidate(value);
    },
    [originalHandleCodexConfigChange, debouncedValidate],
  );

  useEffect(() => {
    if (appId === "codex" && !initialData && selectedPresetId === "custom") {
      const template = getCodexCustomTemplate();
      resetCodexConfig(template.auth, template.config);
    }
  }, [appId, initialData, selectedPresetId, resetCodexConfig]);

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const presetCategoryLabels: Record<string, string> = useMemo(
    () => ({
      official: t("providerForm.categoryOfficial", {
        defaultValue: "官方",
      }),
      cn_official: t("providerForm.categoryCnOfficial", {
        defaultValue: "国内官方",
      }),
      aggregator: t("providerForm.categoryAggregation", {
        defaultValue: "聚合服务",
      }),
      third_party: t("providerForm.categoryThirdParty", {
        defaultValue: "第三方",
      }),
      omo: "OMO",
    }),
    [t],
  );

  const presetEntries = useMemo(() => {
    if (appId === "codex") {
      return codexProviderPresets.map<PresetEntry>((preset, index) => ({
        id: `codex-${index}`,
        preset,
      }));
    } else if (appId === "gemini") {
      return geminiProviderPresets.map<PresetEntry>((preset, index) => ({
        id: `gemini-${index}`,
        preset,
      }));
    } else if (appId === "opencode") {
      return opencodeProviderPresets.map<PresetEntry>((preset, index) => ({
        id: `opencode-${index}`,
        preset,
      }));
    } else if (appId === "openclaw") {
      return openclawProviderPresets.map<PresetEntry>((preset, index) => ({
        id: `openclaw-${index}`,
        preset,
      }));
    }
    return providerPresets.map<PresetEntry>((preset, index) => ({
      id: `claude-${index}`,
      preset,
    }));
  }, [appId]);

  const {
    templateValues,
    templateValueEntries,
    selectedPreset: templatePreset,
    handleTemplateValueChange,
    validateTemplateValues,
  } = useTemplateValues({
    selectedPresetId: appId === "claude" ? selectedPresetId : null,
    presetEntries: appId === "claude" ? presetEntries : [],
    settingsConfig: form.getValues("settingsConfig"),
    onConfigChange: handleSettingsConfigChange,
  });

  const {
    useCommonConfig,
    commonConfigSnippet,
    commonConfigError,
    handleCommonConfigToggle,
    handleCommonConfigSnippetChange,
    isExtracting: isClaudeExtracting,
    handleExtract: handleClaudeExtract,
  } = useCommonConfigSnippet({
    settingsConfig: form.getValues("settingsConfig"),
    onConfigChange: handleSettingsConfigChange,
    initialData: appId === "claude" ? initialData : undefined,
    initialEnabled:
      appId === "claude" ? initialData?.meta?.commonConfigEnabled : undefined,
    selectedPresetId: selectedPresetId ?? undefined,
    enabled: appId === "claude",
  });

  const {
    useCommonConfig: useCodexCommonConfigFlag,
    commonConfigSnippet: codexCommonConfigSnippet,
    commonConfigError: codexCommonConfigError,
    handleCommonConfigToggle: handleCodexCommonConfigToggle,
    handleCommonConfigSnippetChange: handleCodexCommonConfigSnippetChange,
    isExtracting: isCodexExtracting,
    handleExtract: handleCodexExtract,
    clearCommonConfigError: clearCodexCommonConfigError,
  } = useCodexCommonConfig({
    codexConfig,
    onConfigChange: handleCodexConfigChange,
    initialData: appId === "codex" ? initialData : undefined,
    initialEnabled:
      appId === "codex" ? initialData?.meta?.commonConfigEnabled : undefined,
    selectedPresetId: selectedPresetId ?? undefined,
  });

  const {
    geminiEnv,
    geminiConfig,
    geminiApiKey,
    geminiBaseUrl,
    geminiModel,
    envError,
    configError: geminiConfigError,
    handleGeminiApiKeyChange: originalHandleGeminiApiKeyChange,
    handleGeminiBaseUrlChange: originalHandleGeminiBaseUrlChange,
    handleGeminiModelChange: originalHandleGeminiModelChange,
    handleGeminiEnvChange,
    handleGeminiConfigChange,
    resetGeminiConfig,
    envStringToObj,
    envObjToString,
  } = useGeminiConfigState({
    initialData: appId === "gemini" ? initialData : undefined,
  });

  const updateGeminiEnvField = useCallback(
    (
      key: "GEMINI_API_KEY" | "GOOGLE_GEMINI_BASE_URL" | "GEMINI_MODEL",
      value: string,
    ) => {
      try {
        const config = JSON.parse(form.getValues("settingsConfig") || "{}") as {
          env?: Record<string, unknown>;
        };
        if (!config.env || typeof config.env !== "object") {
          config.env = {};
        }
        config.env[key] = value;
        form.setValue("settingsConfig", JSON.stringify(config, null, 2));
      } catch {}
    },
    [form],
  );

  const handleGeminiApiKeyChange = useCallback(
    (key: string) => {
      originalHandleGeminiApiKeyChange(key);
      updateGeminiEnvField("GEMINI_API_KEY", key.trim());
    },
    [originalHandleGeminiApiKeyChange, updateGeminiEnvField],
  );

  const handleGeminiBaseUrlChange = useCallback(
    (url: string) => {
      originalHandleGeminiBaseUrlChange(url);
      updateGeminiEnvField(
        "GOOGLE_GEMINI_BASE_URL",
        url.trim().replace(/\/+$/, ""),
      );
    },
    [originalHandleGeminiBaseUrlChange, updateGeminiEnvField],
  );

  const handleGeminiModelChange = useCallback(
    (model: string) => {
      originalHandleGeminiModelChange(model);
      updateGeminiEnvField("GEMINI_MODEL", model.trim());
    },
    [originalHandleGeminiModelChange, updateGeminiEnvField],
  );

  const {
    useCommonConfig: useGeminiCommonConfigFlag,
    commonConfigSnippet: geminiCommonConfigSnippet,
    commonConfigError: geminiCommonConfigError,
    handleCommonConfigToggle: handleGeminiCommonConfigToggle,
    handleCommonConfigSnippetChange: handleGeminiCommonConfigSnippetChange,
    isExtracting: isGeminiExtracting,
    handleExtract: handleGeminiExtract,
    clearCommonConfigError: clearGeminiCommonConfigError,
  } = useGeminiCommonConfig({
    envValue: geminiEnv,
    onEnvChange: handleGeminiEnvChange,
    envStringToObj,
    envObjToString,
    initialData: appId === "gemini" ? initialData : undefined,
    initialEnabled:
      appId === "gemini" ? initialData?.meta?.commonConfigEnabled : undefined,
    selectedPresetId: selectedPresetId ?? undefined,
  });

  // ── Extracted hooks: OpenCode / OMO / OpenClaw ─────────────────────

  const {
    omoModelOptions,
    omoModelVariantsMap,
    omoPresetMetaMap,
    existingOpencodeKeys,
  } = useOmoModelSource({ isOmoCategory: isAnyOmoCategory, providerId });

  const opencodeForm = useOpencodeFormState({
    initialData,
    appId,
    providerId,
    onSettingsConfigChange: (config) => form.setValue("settingsConfig", config),
    getSettingsConfig: () => form.getValues("settingsConfig"),
  });

  const initialOmoSettings =
    appId === "opencode" &&
    (initialData?.category === "omo" || initialData?.category === "omo-slim")
      ? (initialData.settingsConfig as Record<string, unknown> | undefined)
      : undefined;

  const omoDraft = useOmoDraftState({
    initialOmoSettings,
    isEditMode,
    appId,
    category,
  });

  const openclawForm = useOpenclawFormState({
    initialData,
    appId,
    providerId,
    onSettingsConfigChange: (config) => form.setValue("settingsConfig", config),
    getSettingsConfig: () => form.getValues("settingsConfig"),
  });

  const handleSubmit = (values: ProviderFormData) => {
    if (appId === "claude" && templateValueEntries.length > 0) {
      const validation = validateTemplateValues();
      if (!validation.isValid && validation.missingField) {
        setActiveWorkbenchTab("connection");
        toast.error(
          t("providerForm.fillParameter", {
            label: validation.missingField.label,
            defaultValue: `请填写 ${validation.missingField.label}`,
          }),
        );
        return;
      }
    }

    if (!values.name.trim()) {
      setActiveWorkbenchTab("basic");
      toast.error(
        t("providerForm.fillSupplierName", {
          defaultValue: "请填写供应商名称",
        }),
      );
      return;
    }

    if (appId === "opencode" && !isAnyOmoCategory) {
      const keyPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!opencodeForm.opencodeProviderKey.trim()) {
        setActiveWorkbenchTab("basic");
        toast.error(t("opencode.providerKeyRequired"));
        return;
      }
      if (!keyPattern.test(opencodeForm.opencodeProviderKey)) {
        setActiveWorkbenchTab("basic");
        toast.error(t("opencode.providerKeyInvalid"));
        return;
      }
      if (
        !isEditMode &&
        existingOpencodeKeys.includes(opencodeForm.opencodeProviderKey)
      ) {
        setActiveWorkbenchTab("basic");
        toast.error(t("opencode.providerKeyDuplicate"));
        return;
      }
      if (Object.keys(opencodeForm.opencodeModels).length === 0) {
        setActiveWorkbenchTab("connection");
        toast.error(t("opencode.modelsRequired"));
        return;
      }
    }

    // OpenClaw: validate provider key
    if (appId === "openclaw") {
      const keyPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
      if (!openclawForm.openclawProviderKey.trim()) {
        setActiveWorkbenchTab("basic");
        toast.error(t("openclaw.providerKeyRequired"));
        return;
      }
      if (!keyPattern.test(openclawForm.openclawProviderKey)) {
        setActiveWorkbenchTab("basic");
        toast.error(t("openclaw.providerKeyInvalid"));
        return;
      }
      if (
        !isEditMode &&
        openclawForm.existingOpenclawKeys.includes(
          openclawForm.openclawProviderKey,
        )
      ) {
        setActiveWorkbenchTab("basic");
        toast.error(t("openclaw.providerKeyDuplicate"));
        return;
      }
    }

    // 非官方供应商必填校验：端点和 API Key
    // cloud_provider（如 Bedrock）通过模板变量处理认证，跳过通用校验
    if (category !== "official" && category !== "cloud_provider") {
      if (appId === "claude") {
        if (!baseUrl.trim()) {
          setActiveWorkbenchTab("connection");
          toast.error(
            t("providerForm.endpointRequired", {
              defaultValue: "非官方供应商请填写 API 端点",
            }),
          );
          return;
        }
        if (!apiKey.trim()) {
          setActiveWorkbenchTab("connection");
          toast.error(
            t("providerForm.apiKeyRequired", {
              defaultValue: "非官方供应商请填写 API Key",
            }),
          );
          return;
        }
      } else if (appId === "codex") {
        if (!codexBaseUrl.trim()) {
          setActiveWorkbenchTab("connection");
          toast.error(
            t("providerForm.endpointRequired", {
              defaultValue: "非官方供应商请填写 API 端点",
            }),
          );
          return;
        }
        if (!codexApiKey.trim()) {
          setActiveWorkbenchTab("connection");
          toast.error(
            t("providerForm.apiKeyRequired", {
              defaultValue: "非官方供应商请填写 API Key",
            }),
          );
          return;
        }
      } else if (appId === "gemini") {
        if (!geminiBaseUrl.trim()) {
          setActiveWorkbenchTab("connection");
          toast.error(
            t("providerForm.endpointRequired", {
              defaultValue: "非官方供应商请填写 API 端点",
            }),
          );
          return;
        }
        if (!geminiApiKey.trim()) {
          setActiveWorkbenchTab("connection");
          toast.error(
            t("providerForm.apiKeyRequired", {
              defaultValue: "非官方供应商请填写 API Key",
            }),
          );
          return;
        }
      }
    }

    let settingsConfig: string;

    if (appId === "codex") {
      try {
        const authJson = JSON.parse(codexAuth);
        const configObj = {
          auth: authJson,
          config: codexConfig ?? "",
        };
        settingsConfig = JSON.stringify(configObj);
      } catch (err) {
        settingsConfig = values.settingsConfig.trim();
      }
    } else if (appId === "gemini") {
      try {
        const envObj = envStringToObj(geminiEnv);
        const configObj = geminiConfig.trim() ? JSON.parse(geminiConfig) : {};
        const combined = {
          env: envObj,
          config: configObj,
        };
        settingsConfig = JSON.stringify(combined);
      } catch (err) {
        settingsConfig = values.settingsConfig.trim();
      }
    } else if (
      appId === "opencode" &&
      (category === "omo" || category === "omo-slim")
    ) {
      const omoConfig: Record<string, unknown> = {};
      if (Object.keys(omoDraft.omoAgents).length > 0) {
        omoConfig.agents = omoDraft.omoAgents;
      }
      if (
        category === "omo" &&
        Object.keys(omoDraft.omoCategories).length > 0
      ) {
        omoConfig.categories = omoDraft.omoCategories;
      }
      if (omoDraft.omoOtherFieldsStr.trim()) {
        try {
          const otherFields = parseOmoOtherFieldsObject(
            omoDraft.omoOtherFieldsStr,
          );
          if (!otherFields) {
            setActiveWorkbenchTab("connection");
            toast.error(
              t("omo.jsonMustBeObject", {
                field: t("omo.otherFields", {
                  defaultValue: "Other Config",
                }),
                defaultValue: "{{field}} must be a JSON object",
              }),
            );
            return;
          }
          omoConfig.otherFields = otherFields;
        } catch {
          setActiveWorkbenchTab("connection");
          toast.error(
            t("omo.invalidJson", {
              defaultValue: "Other Fields contains invalid JSON",
            }),
          );
          return;
        }
      }
      settingsConfig = JSON.stringify(omoConfig);
    } else {
      settingsConfig = values.settingsConfig.trim();
    }

    const payload: ProviderFormValues = {
      ...values,
      name: values.name.trim(),
      websiteUrl: values.websiteUrl?.trim() ?? "",
      settingsConfig,
    };

    if (appId === "opencode") {
      if (isAnyOmoCategory) {
        if (!isEditMode) {
          const prefix = category === "omo" ? "omo" : "omo-slim";
          payload.providerKey = `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
        }
      } else {
        payload.providerKey = opencodeForm.opencodeProviderKey;
      }
    } else if (appId === "openclaw") {
      payload.providerKey = openclawForm.openclawProviderKey;
    }

    if (isAnyOmoCategory && !payload.presetCategory) {
      payload.presetCategory = category;
    }

    if (activePreset) {
      payload.presetId = activePreset.id;
      if (activePreset.category) {
        payload.presetCategory = activePreset.category;
      }
      if (activePreset.isPartner) {
        payload.isPartner = activePreset.isPartner;
      }
      // OpenClaw: 传递预设的 suggestedDefaults 到提交数据
      if (activePreset.suggestedDefaults) {
        payload.suggestedDefaults = activePreset.suggestedDefaults;
      }
    }

    if (!isEditMode && draftCustomEndpoints.length > 0) {
      const customEndpointsToSave: Record<
        string,
        import("@/types").CustomEndpoint
      > = draftCustomEndpoints.reduce(
        (acc, url) => {
          const now = Date.now();
          acc[url] = { url, addedAt: now, lastUsed: undefined };
          return acc;
        },
        {} as Record<string, import("@/types").CustomEndpoint>,
      );

      const hadEndpoints =
        initialData?.meta?.custom_endpoints &&
        Object.keys(initialData.meta.custom_endpoints).length > 0;
      const needsClearEndpoints =
        hadEndpoints && draftCustomEndpoints.length === 0;

      let mergedMeta = needsClearEndpoints
        ? mergeProviderMeta(initialData?.meta, {})
        : mergeProviderMeta(initialData?.meta, customEndpointsToSave);

      if (activePreset?.isPartner) {
        mergedMeta = {
          ...(mergedMeta ?? {}),
          isPartner: true,
        };
      }

      if (activePreset?.partnerPromotionKey) {
        mergedMeta = {
          ...(mergedMeta ?? {}),
          partnerPromotionKey: activePreset.partnerPromotionKey,
        };
      }

      if (mergedMeta !== undefined) {
        payload.meta = mergedMeta;
      }
    }

    const baseMeta: ProviderMeta | undefined =
      payload.meta ?? (initialData?.meta ? { ...initialData.meta } : undefined);
    payload.meta = {
      ...(baseMeta ?? {}),
      commonConfigEnabled:
        appId === "claude"
          ? useCommonConfig
          : appId === "codex"
            ? useCodexCommonConfigFlag
            : appId === "gemini"
              ? useGeminiCommonConfigFlag
              : undefined,
      endpointAutoSelect,
      testConfig: testConfig.enabled ? testConfig : undefined,
      proxyConfig: proxyConfig.enabled ? proxyConfig : undefined,
      costMultiplier: pricingConfig.enabled
        ? pricingConfig.costMultiplier
        : undefined,
      pricingModelSource:
        pricingConfig.enabled && pricingConfig.pricingModelSource !== "inherit"
          ? pricingConfig.pricingModelSource
          : undefined,
      apiFormat:
        appId === "claude" && category !== "official"
          ? localApiFormat
          : undefined,
      apiKeyField:
        appId === "claude" &&
        category !== "official" &&
        localApiKeyField !== "ANTHROPIC_AUTH_TOKEN"
          ? localApiKeyField
          : undefined,
    };

    onSubmit(payload);
  };

  const handleInvalidSubmit = useCallback(
    (errors: FieldErrors<ProviderFormData>) => {
      const firstField = Object.keys(errors)[0];
      if (!firstField) {
        return;
      }
      setActiveWorkbenchTab(getProviderWorkbenchTabForField(firstField));
    },
    [],
  );

  const groupedPresets = useMemo(() => {
    return presetEntries.reduce<Record<string, PresetEntry[]>>((acc, entry) => {
      const category = entry.preset.category ?? "others";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(entry);
      return acc;
    }, {});
  }, [presetEntries]);

  const categoryKeys = useMemo(() => {
    return Object.keys(groupedPresets).filter(
      (key) => key !== "custom" && groupedPresets[key]?.length,
    );
  }, [groupedPresets]);

  const shouldShowSpeedTest =
    category !== "official" && category !== "cloud_provider";

  const {
    shouldShowApiKeyLink: shouldShowClaudeApiKeyLink,
    websiteUrl: claudeWebsiteUrl,
    isPartner: isClaudePartner,
    partnerPromotionKey: claudePartnerPromotionKey,
  } = useApiKeyLink({
    appId: "claude",
    category,
    selectedPresetId,
    presetEntries,
    formWebsiteUrl: form.watch("websiteUrl") || "",
  });

  const {
    shouldShowApiKeyLink: shouldShowCodexApiKeyLink,
    websiteUrl: codexWebsiteUrl,
    isPartner: isCodexPartner,
    partnerPromotionKey: codexPartnerPromotionKey,
  } = useApiKeyLink({
    appId: "codex",
    category,
    selectedPresetId,
    presetEntries,
    formWebsiteUrl: form.watch("websiteUrl") || "",
  });

  const {
    shouldShowApiKeyLink: shouldShowGeminiApiKeyLink,
    websiteUrl: geminiWebsiteUrl,
    isPartner: isGeminiPartner,
    partnerPromotionKey: geminiPartnerPromotionKey,
  } = useApiKeyLink({
    appId: "gemini",
    category,
    selectedPresetId,
    presetEntries,
    formWebsiteUrl: form.watch("websiteUrl") || "",
  });

  const {
    shouldShowApiKeyLink: shouldShowOpencodeApiKeyLink,
    websiteUrl: opencodeWebsiteUrl,
    isPartner: isOpencodePartner,
    partnerPromotionKey: opencodePartnerPromotionKey,
  } = useApiKeyLink({
    appId: "opencode",
    category,
    selectedPresetId,
    presetEntries,
    formWebsiteUrl: form.watch("websiteUrl") || "",
  });

  // 使用 API Key 链接 hook (OpenClaw)
  const {
    shouldShowApiKeyLink: shouldShowOpenclawApiKeyLink,
    websiteUrl: openclawWebsiteUrl,
    isPartner: isOpenclawPartner,
    partnerPromotionKey: openclawPartnerPromotionKey,
  } = useApiKeyLink({
    appId: "openclaw",
    category,
    selectedPresetId,
    presetEntries,
    formWebsiteUrl: form.watch("websiteUrl") || "",
  });

  // 使用端点测速候选 hook
  const speedTestEndpoints = useSpeedTestEndpoints({
    appId,
    selectedPresetId,
    presetEntries,
    baseUrl,
    codexBaseUrl,
    initialData,
  });

  const handlePresetChange = (value: string) => {
    setSelectedPresetId(value);
    if (value === "custom") {
      setActivePreset(null);
      form.reset(defaultValues);

      if (appId === "codex") {
        const template = getCodexCustomTemplate();
        resetCodexConfig(template.auth, template.config);
      }
      if (appId === "gemini") {
        resetGeminiConfig({}, {});
      }
      if (appId === "opencode") {
        opencodeForm.resetOpencodeState();
        omoDraft.resetOmoDraftState();
      }
      // OpenClaw 自定义模式：重置为空配置
      if (appId === "openclaw") {
        openclawForm.resetOpenclawState();
      }
      return;
    }

    const entry = presetEntries.find((item) => item.id === value);
    if (!entry) {
      return;
    }

    setActivePreset({
      id: value,
      category: entry.preset.category,
      isPartner: entry.preset.isPartner,
      partnerPromotionKey: entry.preset.partnerPromotionKey,
    });

    if (appId === "codex") {
      const preset = entry.preset as CodexProviderPreset;
      const auth = preset.auth ?? {};
      const config = preset.config ?? "";

      resetCodexConfig(auth, config);

      form.reset({
        name: preset.nameKey ? t(preset.nameKey) : preset.name,
        websiteUrl: preset.websiteUrl ?? "",
        settingsConfig: JSON.stringify({ auth, config }, null, 2),
        icon: preset.icon ?? "",
        iconColor: preset.iconColor ?? "",
      });
      return;
    }

    if (appId === "gemini") {
      const preset = entry.preset as GeminiProviderPreset;
      const env = (preset.settingsConfig as any)?.env ?? {};
      const config = (preset.settingsConfig as any)?.config ?? {};

      resetGeminiConfig(env, config);

      form.reset({
        name: preset.nameKey ? t(preset.nameKey) : preset.name,
        websiteUrl: preset.websiteUrl ?? "",
        settingsConfig: JSON.stringify(preset.settingsConfig, null, 2),
        icon: preset.icon ?? "",
        iconColor: preset.iconColor ?? "",
      });
      return;
    }

    if (appId === "opencode") {
      const preset = entry.preset as OpenCodeProviderPreset;
      const config = preset.settingsConfig;

      if (preset.category === "omo" || preset.category === "omo-slim") {
        omoDraft.resetOmoDraftState();
        form.reset({
          name: preset.category === "omo" ? "OMO" : "OMO Slim",
          websiteUrl: preset.websiteUrl ?? "",
          settingsConfig: JSON.stringify({}, null, 2),
          icon: preset.icon ?? "",
          iconColor: preset.iconColor ?? "",
        });
        return;
      }

      opencodeForm.resetOpencodeState(config);

      form.reset({
        name: preset.nameKey ? t(preset.nameKey) : preset.name,
        websiteUrl: preset.websiteUrl ?? "",
        settingsConfig: JSON.stringify(config, null, 2),
        icon: preset.icon ?? "",
        iconColor: preset.iconColor ?? "",
      });
      return;
    }

    // OpenClaw preset handling
    if (appId === "openclaw") {
      const preset = entry.preset as OpenClawProviderPreset;
      const config = preset.settingsConfig;

      // Update activePreset with suggestedDefaults for OpenClaw
      setActivePreset({
        id: value,
        category: preset.category,
        isPartner: preset.isPartner,
        partnerPromotionKey: preset.partnerPromotionKey,
        suggestedDefaults: preset.suggestedDefaults,
      });

      openclawForm.resetOpenclawState(config);

      // Update form fields
      form.reset({
        name: preset.nameKey ? t(preset.nameKey) : preset.name,
        websiteUrl: preset.websiteUrl ?? "",
        settingsConfig: JSON.stringify(config, null, 2),
        icon: preset.icon ?? "",
        iconColor: preset.iconColor ?? "",
      });
      return;
    }

    const preset = entry.preset as ProviderPreset;
    const config = applyTemplateValues(
      preset.settingsConfig,
      preset.templateValues,
    );

    if (preset.apiFormat) {
      setLocalApiFormat(preset.apiFormat);
    } else {
      setLocalApiFormat("anthropic");
    }

    setLocalApiKeyField(preset.apiKeyField ?? "ANTHROPIC_AUTH_TOKEN");

    form.reset({
      name: preset.nameKey ? t(preset.nameKey) : preset.name,
      websiteUrl: preset.websiteUrl ?? "",
      settingsConfig: JSON.stringify(config, null, 2),
      icon: preset.icon ?? "",
      iconColor: preset.iconColor ?? "",
    });
  };

  const settingsConfigErrorField = (
    <FormField
      control={form.control}
      name="settingsConfig"
      render={() => (
        <FormItem className="space-y-0">
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const providerDetailsContent =
    appId === "claude" ? (
      <ClaudeFormFields
        providerId={providerId}
        shouldShowApiKey={
          (category !== "cloud_provider" ||
            hasApiKeyField(form.getValues("settingsConfig"), "claude")) &&
          shouldShowApiKey(form.getValues("settingsConfig"), isEditMode)
        }
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        category={category}
        shouldShowApiKeyLink={shouldShowClaudeApiKeyLink}
        websiteUrl={claudeWebsiteUrl}
        isPartner={isClaudePartner}
        partnerPromotionKey={claudePartnerPromotionKey}
        templateValueEntries={templateValueEntries}
        templateValues={templateValues}
        templatePresetName={templatePreset?.name || ""}
        onTemplateValueChange={handleTemplateValueChange}
        shouldShowSpeedTest={shouldShowSpeedTest}
        baseUrl={baseUrl}
        onBaseUrlChange={handleClaudeBaseUrlChange}
        isEndpointModalOpen={isEndpointModalOpen}
        onEndpointModalToggle={setIsEndpointModalOpen}
        onCustomEndpointsChange={
          isEditMode ? undefined : setDraftCustomEndpoints
        }
        autoSelect={endpointAutoSelect}
        onAutoSelectChange={setEndpointAutoSelect}
        shouldShowModelSelector={category !== "official"}
        claudeModel={claudeModel}
        reasoningModel={reasoningModel}
        defaultHaikuModel={defaultHaikuModel}
        defaultSonnetModel={defaultSonnetModel}
        defaultOpusModel={defaultOpusModel}
        onModelChange={handleModelChange}
        speedTestEndpoints={speedTestEndpoints}
        apiFormat={localApiFormat}
        onApiFormatChange={handleApiFormatChange}
        apiKeyField={localApiKeyField}
        onApiKeyFieldChange={handleApiKeyFieldChange}
      />
    ) : appId === "codex" ? (
      <CodexFormFields
        providerId={providerId}
        codexApiKey={codexApiKey}
        onApiKeyChange={handleCodexApiKeyChange}
        category={category}
        shouldShowApiKeyLink={shouldShowCodexApiKeyLink}
        websiteUrl={codexWebsiteUrl}
        isPartner={isCodexPartner}
        partnerPromotionKey={codexPartnerPromotionKey}
        shouldShowSpeedTest={shouldShowSpeedTest}
        codexBaseUrl={codexBaseUrl}
        onBaseUrlChange={handleCodexBaseUrlChange}
        isEndpointModalOpen={isCodexEndpointModalOpen}
        onEndpointModalToggle={setIsCodexEndpointModalOpen}
        onCustomEndpointsChange={
          isEditMode ? undefined : setDraftCustomEndpoints
        }
        autoSelect={endpointAutoSelect}
        onAutoSelectChange={setEndpointAutoSelect}
        shouldShowModelField={category !== "official"}
        modelName={codexModelName}
        onModelNameChange={handleCodexModelNameChange}
        speedTestEndpoints={speedTestEndpoints}
      />
    ) : appId === "gemini" ? (
      <GeminiFormFields
        providerId={providerId}
        shouldShowApiKey={shouldShowApiKey(
          form.getValues("settingsConfig"),
          isEditMode,
        )}
        apiKey={geminiApiKey}
        onApiKeyChange={handleGeminiApiKeyChange}
        category={category}
        shouldShowApiKeyLink={shouldShowGeminiApiKeyLink}
        websiteUrl={geminiWebsiteUrl}
        isPartner={isGeminiPartner}
        partnerPromotionKey={geminiPartnerPromotionKey}
        shouldShowSpeedTest={shouldShowSpeedTest}
        baseUrl={geminiBaseUrl}
        onBaseUrlChange={handleGeminiBaseUrlChange}
        isEndpointModalOpen={isEndpointModalOpen}
        onEndpointModalToggle={setIsEndpointModalOpen}
        onCustomEndpointsChange={setDraftCustomEndpoints}
        autoSelect={endpointAutoSelect}
        onAutoSelectChange={setEndpointAutoSelect}
        shouldShowModelField={true}
        model={geminiModel}
        onModelChange={handleGeminiModelChange}
        speedTestEndpoints={speedTestEndpoints}
      />
    ) : appId === "opencode" && !isAnyOmoCategory ? (
      <OpenCodeFormFields
        npm={opencodeForm.opencodeNpm}
        onNpmChange={opencodeForm.handleOpencodeNpmChange}
        apiKey={opencodeForm.opencodeApiKey}
        onApiKeyChange={opencodeForm.handleOpencodeApiKeyChange}
        category={category}
        shouldShowApiKeyLink={shouldShowOpencodeApiKeyLink}
        websiteUrl={opencodeWebsiteUrl}
        isPartner={isOpencodePartner}
        partnerPromotionKey={opencodePartnerPromotionKey}
        baseUrl={opencodeForm.opencodeBaseUrl}
        onBaseUrlChange={opencodeForm.handleOpencodeBaseUrlChange}
        models={opencodeForm.opencodeModels}
        onModelsChange={opencodeForm.handleOpencodeModelsChange}
        extraOptions={opencodeForm.opencodeExtraOptions}
        onExtraOptionsChange={opencodeForm.handleOpencodeExtraOptionsChange}
      />
    ) : appId === "opencode" &&
      (category === "omo" || category === "omo-slim") ? (
      <OmoFormFields
        modelOptions={omoModelOptions}
        modelVariantsMap={omoModelVariantsMap}
        presetMetaMap={omoPresetMetaMap}
        agents={omoDraft.omoAgents}
        onAgentsChange={omoDraft.setOmoAgents}
        categories={category === "omo" ? omoDraft.omoCategories : undefined}
        onCategoriesChange={
          category === "omo" ? omoDraft.setOmoCategories : undefined
        }
        otherFieldsStr={omoDraft.omoOtherFieldsStr}
        onOtherFieldsStrChange={omoDraft.setOmoOtherFieldsStr}
        isSlim={category === "omo-slim"}
      />
    ) : appId === "openclaw" ? (
      <OpenClawFormFields
        baseUrl={openclawForm.openclawBaseUrl}
        onBaseUrlChange={openclawForm.handleOpenclawBaseUrlChange}
        apiKey={openclawForm.openclawApiKey}
        onApiKeyChange={openclawForm.handleOpenclawApiKeyChange}
        category={category}
        shouldShowApiKeyLink={shouldShowOpenclawApiKeyLink}
        websiteUrl={openclawWebsiteUrl}
        isPartner={isOpenclawPartner}
        partnerPromotionKey={openclawPartnerPromotionKey}
        api={openclawForm.openclawApi}
        onApiChange={openclawForm.handleOpenclawApiChange}
        models={openclawForm.openclawModels}
        onModelsChange={openclawForm.handleOpenclawModelsChange}
        userAgent={openclawForm.openclawUserAgent}
        onUserAgentChange={openclawForm.handleOpenclawUserAgentChange}
      />
    ) : null;

  const configEditorContent =
    appId === "codex" ? (
      <>
        <CodexConfigEditor
          authValue={codexAuth}
          configValue={codexConfig}
          onAuthChange={setCodexAuth}
          onConfigChange={handleCodexConfigChange}
          useCommonConfig={useCodexCommonConfigFlag}
          onCommonConfigToggle={handleCodexCommonConfigToggle}
          commonConfigSnippet={codexCommonConfigSnippet}
          onCommonConfigSnippetChange={handleCodexCommonConfigSnippetChange}
          onCommonConfigErrorClear={clearCodexCommonConfigError}
          commonConfigError={codexCommonConfigError}
          authError={codexAuthError}
          configError={codexConfigError}
          onExtract={handleCodexExtract}
          isExtracting={isCodexExtracting}
        />
        {settingsConfigErrorField}
      </>
    ) : appId === "gemini" ? (
      <>
        <GeminiConfigEditor
          envValue={geminiEnv}
          configValue={geminiConfig}
          onEnvChange={handleGeminiEnvChange}
          onConfigChange={handleGeminiConfigChange}
          useCommonConfig={useGeminiCommonConfigFlag}
          onCommonConfigToggle={handleGeminiCommonConfigToggle}
          commonConfigSnippet={geminiCommonConfigSnippet}
          onCommonConfigSnippetChange={handleGeminiCommonConfigSnippetChange}
          onCommonConfigErrorClear={clearGeminiCommonConfigError}
          commonConfigError={geminiCommonConfigError}
          envError={envError}
          configError={geminiConfigError}
          onExtract={handleGeminiExtract}
          isExtracting={isGeminiExtracting}
        />
        {settingsConfigErrorField}
      </>
    ) : appId === "opencode" &&
      (category === "omo" || category === "omo-slim") ? (
      <div className="space-y-2">
        <Label>{t("provider.configJson")}</Label>
        <JsonEditor
          value={omoDraft.mergedOmoJsonPreview}
          onChange={() => {}}
          rows={14}
          showValidation={false}
          language="json"
        />
      </div>
    ) : appId === "opencode" &&
      category !== "omo" &&
      category !== "omo-slim" ? (
      <>
        <div className="space-y-2">
          <Label htmlFor="settingsConfig">{t("provider.configJson")}</Label>
          <JsonEditor
            value={form.getValues("settingsConfig")}
            onChange={(config) => form.setValue("settingsConfig", config)}
            placeholder={`{
  "npm": "@ai-sdk/openai-compatible",
  "options": {
    "baseURL": "https://your-api-endpoint.com",
    "apiKey": "your-api-key-here"
  },
  "models": {}
}`}
            rows={14}
            showValidation={true}
            language="json"
          />
        </div>
        {settingsConfigErrorField}
      </>
    ) : appId === "openclaw" ? (
      <>
        <div className="space-y-2">
          <Label htmlFor="settingsConfig">{t("provider.configJson")}</Label>
          <JsonEditor
            value={form.getValues("settingsConfig")}
            onChange={(config) => form.setValue("settingsConfig", config)}
            placeholder={`{
  "baseUrl": "https://api.example.com/v1",
  "apiKey": "your-api-key-here",
  "api": "openai-completions",
  "models": []
}`}
            rows={14}
            showValidation={true}
            language="json"
          />
        </div>
        <FormField
          control={form.control}
          name="settingsConfig"
          render={() => (
            <FormItem className="space-y-0">
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    ) : (
      <>
        <CommonConfigEditor
          value={form.getValues("settingsConfig")}
          onChange={(value) => form.setValue("settingsConfig", value)}
          useCommonConfig={useCommonConfig}
          onCommonConfigToggle={handleCommonConfigToggle}
          commonConfigSnippet={commonConfigSnippet}
          onCommonConfigSnippetChange={handleCommonConfigSnippetChange}
          commonConfigError={commonConfigError}
          onExtract={handleClaudeExtract}
          isExtracting={isClaudeExtracting}
        />
        {settingsConfigErrorField}
      </>
    );

  const advancedConfigContent =
    !isAnyOmoCategory && appId !== "opencode" && appId !== "openclaw" ? (
      <ProviderAdvancedConfig
        testConfig={testConfig}
        proxyConfig={proxyConfig}
        pricingConfig={pricingConfig}
        onTestConfigChange={setTestConfig}
        onProxyConfigChange={setProxyConfig}
        onPricingConfigChange={setPricingConfig}
      />
    ) : null;

  const workbenchTabs = useMemo(
    () =>
      getProviderWorkbenchTabs({
        appId,
        isEditMode,
        hasAdvancedConfig: Boolean(advancedConfigContent),
        t,
      }),
    [appId, isEditMode, advancedConfigContent, t],
  );

  const activeWorkbenchDefinition =
    workbenchTabs.find((tab) => tab.id === activeWorkbenchTab) ??
    workbenchTabs[0];

  useEffect(() => {
    setActiveWorkbenchTab(isEditMode ? "basic" : "preset");
  }, [appId, isEditMode, providerId]);

  useEffect(() => {
    if (
      activeWorkbenchTab === "advanced" &&
      !workbenchTabs.some((tab) => tab.id === "advanced")
    ) {
      setActiveWorkbenchTab("config");
      return;
    }

    if (!workbenchTabs.some((tab) => tab.id === activeWorkbenchTab)) {
      setActiveWorkbenchTab(workbenchTabs[0]?.id ?? "basic");
    }
  }, [activeWorkbenchTab, workbenchTabs]);

  const selectedPresetLabel = useMemo(() => {
    if (isEditMode) {
      return t("provider.existingProvider", {
        defaultValue: "当前供应商",
      });
    }
    if (selectedPresetId === "custom") {
      return t("providerPreset.custom", { defaultValue: "自定义" });
    }
    const matchedPreset = presetEntries.find(
      (entry) => entry.id === selectedPresetId,
    );
    if (!matchedPreset) {
      return t("providerPreset.custom", { defaultValue: "自定义" });
    }
    return matchedPreset.preset.nameKey
      ? t(matchedPreset.preset.nameKey)
      : matchedPreset.preset.name;
  }, [isEditMode, presetEntries, selectedPresetId, t]);

  const categoryLabel =
    (category && presetCategoryLabels[category]) ||
    t("providerPreset.custom", { defaultValue: "自定义" });

  const providerKeySummary =
    appId === "opencode" && !isAnyOmoCategory
      ? opencodeForm.opencodeProviderKey
      : appId === "openclaw"
        ? openclawForm.openclawProviderKey
        : undefined;

  const modelCountSummary =
    appId === "opencode" && !isAnyOmoCategory
      ? Object.keys(opencodeForm.opencodeModels).length
      : appId === "openclaw"
        ? openclawForm.openclawModels.length
        : undefined;

  const detailsSectionTitle =
    appId === "openclaw"
      ? t("provider.sectionConnectionAndModels", {
          defaultValue: "连接与模型",
        })
      : appId === "opencode"
        ? t("provider.sectionRuntimeConfig", {
            defaultValue: "运行参数",
          })
        : t("provider.sectionAccessConfig", {
            defaultValue: "接入参数",
          });

  const detailsSectionDescription =
    appId === "openclaw"
      ? t("provider.sectionConnectionAndModelsHint", {
          defaultValue:
            "配置协议、端点、鉴权和模型列表，决定 OpenClaw 的接入能力。",
        })
      : appId === "opencode"
        ? t("provider.sectionRuntimeConfigHint", {
            defaultValue:
              "配置 npm 包、模型映射和运行扩展字段，决定 OpenCode 的供应商行为。",
          })
        : t("provider.sectionAccessConfigHint", {
            defaultValue:
              "补充 API Key、端点和模型参数，确保供应商配置可以直接投入使用。",
          });

  return (
    <Form {...form}>
      <form
        id="provider-form"
        onSubmit={form.handleSubmit(handleSubmit, handleInvalidSubmit)}
        className="space-y-6"
      >
        <Tabs
          data-testid="provider-form-workbench"
          value={activeWorkbenchTab}
          onValueChange={(value) =>
            setActiveWorkbenchTab(value as ProviderWorkbenchTabId)
          }
          className="grid min-w-0 gap-4 xl:grid-cols-[188px_minmax(0,1fr)]"
        >
          <ProviderWorkbenchRail tabs={workbenchTabs} />

          <div className="min-w-0 space-y-4">
            <section className="overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.95)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_18px_42px_-36px_hsl(var(--foreground)/0.28)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/55 px-4 py-3">
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {t("provider.workbenchContext", {
                      defaultValue: "当前上下文",
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-3 py-1 text-xs font-medium text-foreground">
                      {t(`apps.${appId}`)}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-3 py-1 text-xs font-medium text-foreground">
                      {isEditMode
                        ? t("common.edit", { defaultValue: "编辑" })
                        : t("common.add", { defaultValue: "新增" })}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {activeWorkbenchDefinition?.title}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-3 py-1 text-xs font-medium text-foreground">
                      {selectedPresetLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-3 py-1 text-xs font-medium text-foreground">
                      {categoryLabel}
                    </span>
                    {providerKeySummary ? (
                      <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-3 py-1 font-mono text-xs font-medium text-foreground">
                        {providerKeySummary}
                      </span>
                    ) : null}
                    {modelCountSummary !== undefined ? (
                      <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-3 py-1 text-xs font-medium text-foreground">
                        {t("provider.models", { defaultValue: "模型数" })}:{" "}
                        {modelCountSummary}
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {`${workbenchTabs.findIndex((tab) => tab.id === activeWorkbenchTab) + 1}/${workbenchTabs.length}`}
                </span>
              </div>

              <div className="p-4 xl:p-5">
                {!initialData && (
                  <TabsContent value="preset" className="mt-0">
                    <ProviderFormSection
                      title={t("providerPreset.label", {
                        defaultValue: "选择预设",
                      })}
                      description={t("providerPreset.sectionHint", {
                        defaultValue:
                          "先选择最接近的供应商模板，再继续补充细节，可以显著降低配置负担。",
                      })}
                      accent
                    >
                      <ProviderPresetSelector
                        selectedPresetId={selectedPresetId}
                        groupedPresets={groupedPresets}
                        categoryKeys={categoryKeys}
                        presetCategoryLabels={presetCategoryLabels}
                        onPresetChange={handlePresetChange}
                        onUniversalPresetSelect={onUniversalPresetSelect}
                        onManageUniversalProviders={onManageUniversalProviders}
                        category={category}
                      />
                    </ProviderFormSection>
                  </TabsContent>
                )}

                <TabsContent value="basic" className="mt-0">
                  <ProviderFormSection
                    title={t("provider.basicInfo", {
                      defaultValue: "基础信息",
                    })}
                    description={t("provider.basicInfoDescription", {
                      defaultValue:
                        "补充供应商身份信息和展示内容，便于后续在列表中快速识别与维护。",
                    })}
                  >
                    <BasicFormFields
                      form={form}
                      beforeNameSlot={
                        appId === "opencode" && !isAnyOmoCategory ? (
                          <div className="space-y-2">
                            <Label htmlFor="opencode-key">
                              {t("opencode.providerKey")}
                              <span className="text-destructive ml-1">*</span>
                            </Label>
                            <Input
                              id="opencode-key"
                              value={opencodeForm.opencodeProviderKey}
                              onChange={(e) =>
                                opencodeForm.setOpencodeProviderKey(
                                  e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, ""),
                                )
                              }
                              placeholder={t("opencode.providerKeyPlaceholder")}
                              disabled={isEditMode}
                              className={
                                (existingOpencodeKeys.includes(
                                  opencodeForm.opencodeProviderKey,
                                ) &&
                                  !isEditMode) ||
                                (opencodeForm.opencodeProviderKey.trim() !==
                                  "" &&
                                  !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(
                                    opencodeForm.opencodeProviderKey,
                                  ))
                                  ? "border-destructive"
                                  : ""
                              }
                            />
                            {existingOpencodeKeys.includes(
                              opencodeForm.opencodeProviderKey,
                            ) &&
                              !isEditMode && (
                                <p className="text-xs text-destructive">
                                  {t("opencode.providerKeyDuplicate")}
                                </p>
                              )}
                            {opencodeForm.opencodeProviderKey.trim() !== "" &&
                              !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(
                                opencodeForm.opencodeProviderKey,
                              ) && (
                                <p className="text-xs text-destructive">
                                  {t("opencode.providerKeyInvalid")}
                                </p>
                              )}
                            {!(
                              existingOpencodeKeys.includes(
                                opencodeForm.opencodeProviderKey,
                              ) && !isEditMode
                            ) &&
                              (opencodeForm.opencodeProviderKey.trim() === "" ||
                                /^[a-z0-9]+(-[a-z0-9]+)*$/.test(
                                  opencodeForm.opencodeProviderKey,
                                )) && (
                                <p className="text-xs text-muted-foreground">
                                  {t("opencode.providerKeyHint")}
                                </p>
                              )}
                          </div>
                        ) : appId === "openclaw" ? (
                          <div className="space-y-2">
                            <Label htmlFor="openclaw-key">
                              {t("openclaw.providerKey")}
                              <span className="text-destructive ml-1">*</span>
                            </Label>
                            <Input
                              id="openclaw-key"
                              value={openclawForm.openclawProviderKey}
                              onChange={(e) =>
                                openclawForm.setOpenclawProviderKey(
                                  e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, ""),
                                )
                              }
                              placeholder={t("openclaw.providerKeyPlaceholder")}
                              disabled={isEditMode}
                              className={
                                (openclawForm.existingOpenclawKeys.includes(
                                  openclawForm.openclawProviderKey,
                                ) &&
                                  !isEditMode) ||
                                (openclawForm.openclawProviderKey.trim() !==
                                  "" &&
                                  !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(
                                    openclawForm.openclawProviderKey,
                                  ))
                                  ? "border-destructive"
                                  : ""
                              }
                            />
                            {openclawForm.existingOpenclawKeys.includes(
                              openclawForm.openclawProviderKey,
                            ) &&
                              !isEditMode && (
                                <p className="text-xs text-destructive">
                                  {t("openclaw.providerKeyDuplicate")}
                                </p>
                              )}
                            {openclawForm.openclawProviderKey.trim() !== "" &&
                              !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(
                                openclawForm.openclawProviderKey,
                              ) && (
                                <p className="text-xs text-destructive">
                                  {t("openclaw.providerKeyInvalid")}
                                </p>
                              )}
                            {!(
                              openclawForm.existingOpenclawKeys.includes(
                                openclawForm.openclawProviderKey,
                              ) && !isEditMode
                            ) &&
                              (openclawForm.openclawProviderKey.trim() === "" ||
                                /^[a-z0-9]+(-[a-z0-9]+)*$/.test(
                                  openclawForm.openclawProviderKey,
                                )) && (
                                <p className="text-xs text-muted-foreground">
                                  {t("openclaw.providerKeyHint")}
                                </p>
                              )}
                          </div>
                        ) : undefined
                      }
                    />
                  </ProviderFormSection>
                </TabsContent>

                {providerDetailsContent ? (
                  <TabsContent value="connection" className="mt-0">
                    <ProviderFormSection
                      title={detailsSectionTitle}
                      description={detailsSectionDescription}
                    >
                      {providerDetailsContent}
                    </ProviderFormSection>
                  </TabsContent>
                ) : null}

                <TabsContent value="config" className="mt-0">
                  <div className="min-w-0">{configEditorContent}</div>
                </TabsContent>

                {advancedConfigContent ? (
                  <TabsContent value="advanced" className="mt-0">
                    <ProviderFormSection
                      title={t("provider.advancedCapabilities", {
                        defaultValue: "高级能力",
                      })}
                      description={t(
                        "provider.advancedCapabilitiesDescription",
                        {
                          defaultValue:
                            "按需开启测速、代理和计费等附加能力，避免干扰日常的基础接入配置。",
                        },
                      )}
                    >
                      {advancedConfigContent}
                    </ProviderFormSection>
                  </TabsContent>
                ) : null}
              </div>
            </section>

            {showButtons && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={onCancel}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit">{submitLabel}</Button>
              </div>
            )}
          </div>
        </Tabs>
      </form>
    </Form>
  );
}

const WORKBENCH_TAB_ICONS: Record<ProviderWorkbenchTabId, LucideIcon> = {
  preset: Sparkles,
  basic: Info,
  connection: Link2,
  config: FileCode2,
  advanced: SlidersHorizontal,
};

function ProviderWorkbenchRail({
  tabs,
}: {
  tabs: ProviderWorkbenchTabDefinition[];
}) {
  const { t } = useTranslation();

  return (
    <aside className="xl:sticky xl:top-1 xl:self-start">
      <section className="overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.95)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_18px_42px_-36px_hsl(var(--foreground)/0.28)]">
        <header className="border-b border-border/60 bg-background/55 px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {t("provider.workbenchStages", {
              defaultValue: "工作阶段",
            })}
          </h3>
        </header>

        <div className="p-2.5">
          <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent p-0 sm:grid-cols-3 xl:grid-cols-1">
            {tabs.map((tab, index) => {
              const Icon = WORKBENCH_TAB_ICONS[tab.id];
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  aria-label={tab.title}
                  className="h-auto min-w-0 justify-start rounded-[18px] border border-border/60 bg-background/58 px-3 py-2.5 text-left whitespace-normal data-[state=active]:border-primary/24 data-[state=active]:bg-[linear-gradient(180deg,hsl(var(--primary)/0.14)_0%,hsl(var(--panel-surface)/0.92)_100%)] data-[state=active]:text-foreground data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-background/78"
                >
                  <div className="flex w-full items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/82 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {`${index + 1}`}
                        </span>
                        <span className="truncate text-sm font-semibold text-foreground">
                          {tab.title}
                        </span>
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                        {tab.description}
                      </span>
                    </span>
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </section>
    </aside>
  );
}

function ProviderFormSection({
  title,
  description,
  accent = false,
  children,
}: {
  title: string;
  description: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={
        accent
          ? "overflow-hidden rounded-[24px] border border-primary/20 bg-[linear-gradient(180deg,hsl(var(--primary)/0.12)_0%,hsl(var(--surface-2)/0.92)_100%)] shadow-[0_18px_44px_-36px_hsl(var(--primary)/0.35)]"
          : "overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.95)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_18px_44px_-36px_hsl(var(--foreground)/0.28)]"
      }
    >
      <header className="border-b border-border/60 bg-background/50 px-4 py-3.5">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </header>
      <div className="p-4 xl:p-5">{children}</div>
    </section>
  );
}

export type ProviderFormValues = ProviderFormData & {
  presetId?: string;
  presetCategory?: ProviderCategory;
  isPartner?: boolean;
  meta?: ProviderMeta;
  providerKey?: string; // OpenCode/OpenClaw: user-defined provider key
  suggestedDefaults?: OpenClawSuggestedDefaults; // OpenClaw: suggested default model configuration
};
