import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Layers3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { OperationDrawer } from "@/components/common/OperationDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProviderIcon } from "@/components/ProviderIcon";
import JsonEditor from "@/components/JsonEditor";
import { cn } from "@/lib/utils";
import type { UniversalProvider, UniversalProviderModels } from "@/types";
import {
  createUniversalProviderFromPreset,
  findPresetByType,
  universalProviderPresets,
  type UniversalProviderPreset,
} from "@/config/universalProviderPresets";
import {
  getUniversalProviderWorkbenchTabs,
  type UniversalProviderWorkbenchTabId,
} from "./universalProviderWorkbench";

interface UniversalProviderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: UniversalProvider) => void;
  onSaveAndSync?: (provider: UniversalProvider) => void;
  editingProvider?: UniversalProvider | null;
  initialPreset?: UniversalProviderPreset | null;
}

type UniversalAppId = "claude" | "codex" | "gemini";

const APP_META: Record<
  UniversalAppId,
  {
    label: string;
    title: string;
    icon: string;
    description: string;
  }
> = {
  claude: {
    label: "Claude",
    title: "Claude Code",
    icon: "claude",
    description:
      "输出 Anthropic 风格配置，适合 Claude Code 直接接入统一网关。",
  },
  codex: {
    label: "Codex",
    title: "OpenAI Codex",
    icon: "openai",
    description:
      "生成 Codex 所需的 auth 与 TOML 配置，自动补齐 OpenAI 兼容地址。",
  },
  gemini: {
    label: "Gemini",
    title: "Gemini CLI",
    icon: "gemini",
    description: "输出 Gemini CLI 的环境变量配置。",
  },
};

function WorkbenchSection({
  title,
  description,
  children,
  accent = false,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_22px_54px_-36px_hsl(var(--shadow-color)/0.92)]",
        accent &&
          "border-primary/20 bg-[linear-gradient(180deg,hsl(var(--primary)/0.12)_0%,hsl(var(--panel-surface)/0.94)_100%)]",
        className,
      )}
    >
      <header className="border-b border-border/60 bg-background/42 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function SummaryPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "accent" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        tone === "accent"
          ? "border-primary/20 bg-primary/10 text-primary"
          : tone === "success"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "border-border/60 bg-background/70 text-foreground",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

function EmptyWorkbench({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[22px] border border-dashed border-border/60 bg-background/35 px-6 py-10 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/72 text-muted-foreground">
        <Layers3 className="h-5 w-5" />
      </div>
      <h4 className="mt-4 text-base font-semibold text-foreground">{title}</h4>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function UniversalProviderFormModal({
  isOpen,
  onClose,
  onSave,
  onSaveAndSync,
  editingProvider,
  initialPreset,
}: UniversalProviderFormModalProps) {
  const { t } = useTranslation();
  const isEditMode = Boolean(editingProvider);

  const [selectedPreset, setSelectedPreset] =
    useState<UniversalProviderPreset | null>(null);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [claudeEnabled, setClaudeEnabled] = useState(true);
  const [codexEnabled, setCodexEnabled] = useState(true);
  const [geminiEnabled, setGeminiEnabled] = useState(true);

  const [models, setModels] = useState<UniversalProviderModels>({});

  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [pendingProvider, setPendingProvider] =
    useState<UniversalProvider | null>(null);

  const enabledAppIds = useMemo(
    () =>
      ([
        claudeEnabled ? "claude" : null,
        codexEnabled ? "codex" : null,
        geminiEnabled ? "gemini" : null,
      ].filter(Boolean) as UniversalAppId[]),
    [claudeEnabled, codexEnabled, geminiEnabled],
  );

  const workbenchTabs = useMemo(
    () =>
      getUniversalProviderWorkbenchTabs({
        isEditMode,
        hasEnabledApps: enabledAppIds.length > 0,
        t,
      }),
    [enabledAppIds.length, isEditMode, t],
  );

  const configuredModelCount = useMemo(
    () =>
      Object.values(models).filter(
        (value) => value && Object.keys(value).length > 0,
      ).length,
    [models],
  );

  const [activeWorkbenchTab, setActiveWorkbenchTab] =
    useState<UniversalProviderWorkbenchTabId>(isEditMode ? "basic" : "preset");
  const [activeModelApp, setActiveModelApp] = useState<UniversalAppId>("claude");
  const [activePreviewApp, setActivePreviewApp] =
    useState<UniversalAppId>("claude");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingProvider) {
      const matchedPreset = findPresetByType(editingProvider.providerType) ?? null;
      setSelectedPreset(matchedPreset);
      setName(editingProvider.name);
      setBaseUrl(editingProvider.baseUrl);
      setApiKey(editingProvider.apiKey);
      setWebsiteUrl(editingProvider.websiteUrl || "");
      setNotes(editingProvider.notes || "");
      setClaudeEnabled(editingProvider.apps.claude);
      setCodexEnabled(editingProvider.apps.codex);
      setGeminiEnabled(editingProvider.apps.gemini);
      setModels(editingProvider.models || {});
    } else {
      const defaultPreset = initialPreset || universalProviderPresets[0];
      setSelectedPreset(defaultPreset);
      setName(defaultPreset.name);
      setBaseUrl("");
      setApiKey("");
      setWebsiteUrl(defaultPreset.websiteUrl || "");
      setNotes("");
      setClaudeEnabled(defaultPreset.defaultApps.claude);
      setCodexEnabled(defaultPreset.defaultApps.codex);
      setGeminiEnabled(defaultPreset.defaultApps.gemini);
      setModels(JSON.parse(JSON.stringify(defaultPreset.defaultModels)));
    }

    setShowApiKey(false);
    setSyncConfirmOpen(false);
    setPendingProvider(null);
    setActiveWorkbenchTab((currentTab) =>
      workbenchTabs.some((tab) => tab.id === currentTab)
        ? currentTab
        : workbenchTabs[0]?.id ?? "basic",
    );
  }, [editingProvider, initialPreset, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveWorkbenchTab((currentTab) =>
      workbenchTabs.some((tab) => tab.id === currentTab)
        ? currentTab
        : workbenchTabs[0]?.id ?? "basic",
    );
  }, [isOpen, workbenchTabs]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveModelApp((current) =>
      enabledAppIds.includes(current) ? current : enabledAppIds[0] ?? "claude",
    );
    setActivePreviewApp((current) =>
      enabledAppIds.includes(current) ? current : enabledAppIds[0] ?? "claude",
    );
  }, [enabledAppIds, isOpen]);

  const updateModel = useCallback(
    (app: UniversalAppId, field: string, value: string) => {
      setModels((prev) => ({
        ...prev,
        [app]: {
          ...(prev[app] || {}),
          [field]: value,
        },
      }));
    },
    [],
  );

  const handlePresetSelect = useCallback(
    (preset: UniversalProviderPreset) => {
      setSelectedPreset(preset);
      if (!isEditMode) {
        setName(preset.name);
        setWebsiteUrl(preset.websiteUrl || "");
        setClaudeEnabled(preset.defaultApps.claude);
        setCodexEnabled(preset.defaultApps.codex);
        setGeminiEnabled(preset.defaultApps.gemini);
        setModels(JSON.parse(JSON.stringify(preset.defaultModels)));
      }
    },
    [isEditMode],
  );

  const previewConfigs = useMemo(() => {
    const claude =
      claudeEnabled && baseUrl
        ? {
            env: {
              ANTHROPIC_BASE_URL: baseUrl,
              ANTHROPIC_AUTH_TOKEN: apiKey,
              ANTHROPIC_MODEL:
                models.claude?.model || "claude-sonnet-4-20250514",
              ANTHROPIC_DEFAULT_HAIKU_MODEL:
                models.claude?.haikuModel || "claude-haiku-4-20250514",
              ANTHROPIC_DEFAULT_SONNET_MODEL:
                models.claude?.sonnetModel || "claude-sonnet-4-20250514",
              ANTHROPIC_DEFAULT_OPUS_MODEL:
                models.claude?.opusModel || "claude-sonnet-4-20250514",
            },
          }
        : null;

    const codexBaseUrl = baseUrl
      ? baseUrl.endsWith("/v1")
        ? baseUrl
        : `${baseUrl.replace(/\/+$/, "")}/v1`
      : "";

    const codex =
      codexEnabled && codexBaseUrl
        ? {
            auth: {
              OPENAI_API_KEY: apiKey,
            },
            config: `model_provider = "newapi"
model = "${models.codex?.model || "gpt-5.4"}"
model_reasoning_effort = "${models.codex?.reasoningEffort || "high"}"
disable_response_storage = true

[model_providers.newapi]
name = "NewAPI"
base_url = "${codexBaseUrl}"
wire_api = "responses"
requires_openai_auth = true`,
          }
        : null;

    const gemini =
      geminiEnabled && baseUrl
        ? {
            env: {
              GOOGLE_GEMINI_BASE_URL: baseUrl,
              GEMINI_API_KEY: apiKey,
              GEMINI_MODEL: models.gemini?.model || "gemini-2.5-pro",
            },
          }
        : null;

    return {
      claude,
      codex,
      gemini,
    };
  }, [apiKey, baseUrl, claudeEnabled, codexEnabled, geminiEnabled, models]);

  const buildProvider = useCallback((): UniversalProvider | null => {
    if (!name.trim() || !baseUrl.trim() || !apiKey.trim()) {
      return null;
    }

    const provider: UniversalProvider = editingProvider
      ? {
          ...editingProvider,
          name: name.trim(),
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          apps: {
            claude: claudeEnabled,
            codex: codexEnabled,
            gemini: geminiEnabled,
          },
          models,
        }
      : createUniversalProviderFromPreset(
          selectedPreset || universalProviderPresets[0],
          crypto.randomUUID(),
          baseUrl.trim(),
          apiKey.trim(),
          name.trim(),
        );

    if (!editingProvider) {
      provider.apps = {
        claude: claudeEnabled,
        codex: codexEnabled,
        gemini: geminiEnabled,
      };
      provider.models = models;
      provider.websiteUrl = websiteUrl.trim() || undefined;
      provider.notes = notes.trim() || undefined;
    }

    return provider;
  }, [
    apiKey,
    baseUrl,
    claudeEnabled,
    codexEnabled,
    editingProvider,
    geminiEnabled,
    models,
    name,
    notes,
    selectedPreset,
    websiteUrl,
  ]);

  const handleSubmit = useCallback(() => {
    const provider = buildProvider();
    if (!provider) {
      return;
    }

    onSave(provider);
    onClose();
  }, [buildProvider, onClose, onSave]);

  const handleSaveAndSyncClick = useCallback(() => {
    const provider = buildProvider();
    if (!provider || !onSaveAndSync) {
      return;
    }

    setPendingProvider(provider);
    setSyncConfirmOpen(true);
  }, [buildProvider, onSaveAndSync]);

  const confirmSaveAndSync = useCallback(() => {
    if (!pendingProvider || !onSaveAndSync) {
      return;
    }

    onSaveAndSync(pendingProvider);
    setPendingProvider(null);
    setSyncConfirmOpen(false);
    onClose();
  }, [onClose, onSaveAndSync, pendingProvider]);

  const isSubmitDisabled = !name.trim() || !baseUrl.trim() || !apiKey.trim();
  const activeWorkbenchDefinition = workbenchTabs.find(
    (tab) => tab.id === activeWorkbenchTab,
  );

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        {t("common.cancel", { defaultValue: "取消" })}
      </Button>
      {isEditMode ? (
        <>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {t("common.save", { defaultValue: "保存" })}
          </Button>
          {onSaveAndSync ? (
            <Button onClick={handleSaveAndSyncClick} disabled={isSubmitDisabled}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              {t("universalProvider.saveAndSync", {
                defaultValue: "保存并同步",
              })}
            </Button>
          ) : null}
        </>
      ) : (
        <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
          {t("universalProvider.add", { defaultValue: "添加统一供应商" })}
        </Button>
      )}
    </>
  );

  const railCards = [
    {
      label: t("universalProvider.providerType", {
        defaultValue: "类型",
      }),
      value: selectedPreset?.name || editingProvider?.providerType || "--",
    },
    {
      label: t("universalProvider.enabledApps", {
        defaultValue: "启用应用",
      }),
      value: enabledAppIds.length,
    },
    {
      label: t("universalProvider.modelConfig", {
        defaultValue: "模型配置",
      }),
      value: configuredModelCount > 0 ? configuredModelCount : "--",
    },
  ];

  return (
    <>
      <OperationDrawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        title={
          isEditMode
            ? t("universalProvider.edit", { defaultValue: "编辑统一供应商" })
            : t("universalProvider.add", { defaultValue: "添加统一供应商" })
        }
        description={t("universalProvider.workbenchDescription", {
          defaultValue:
            "在同一工作台中完成统一网关的基础信息、应用映射、模型配置和配置预览，减少长表单滚动与来回切换。",
        })}
        eyebrow={t("universalProvider.workbenchEyebrow", {
          defaultValue: "Universal Provider Workbench",
        })}
        badge={
          <div className="flex flex-wrap items-center gap-2">
            <SummaryPill
              label={t("universalProvider.mode", { defaultValue: "模式" })}
              value={
                isEditMode
                  ? t("common.edit", { defaultValue: "编辑" })
                  : t("common.add", { defaultValue: "新增" })
              }
              tone="accent"
            />
            <SummaryPill
              label={t("universalProvider.activeStep", {
                defaultValue: "当前步骤",
              })}
              value={activeWorkbenchDefinition?.title ?? "--"}
            />
          </div>
        }
        footer={footer}
        testId="universal-provider-operation-drawer"
      >
        <Tabs
          value={activeWorkbenchTab}
          onValueChange={(value) =>
            setActiveWorkbenchTab(value as UniversalProviderWorkbenchTabId)
          }
          className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]"
        >
          <aside className="xl:sticky xl:top-0 xl:self-start">
            <section className="overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_22px_54px_-36px_hsl(var(--shadow-color)/0.92)]">
              <div className="border-b border-border/60 bg-background/42 px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-border/60 bg-background/70">
                    <ProviderIcon
                      icon={selectedPreset?.icon || editingProvider?.icon}
                      name={selectedPreset?.name || name || "Universal"}
                      size={20}
                    />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {name || selectedPreset?.name || "--"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {selectedPreset?.description ||
                        t("universalProvider.sidebarHint", {
                          defaultValue:
                            "统一维护 Claude、Codex 和 Gemini 的共享网关配置。",
                        })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {railCards.map((card) => (
                    <SummaryPill
                      key={card.label}
                      label={card.label}
                      value={card.value}
                    />
                  ))}
                </div>
              </div>

              <div className="p-2.5">
                <TabsList className="flex w-full flex-col items-stretch gap-2 bg-transparent p-0">
                  {workbenchTabs.map((tab, index) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      aria-label={tab.title}
                      className="h-auto min-w-0 justify-start rounded-[18px] border border-border/60 bg-background/62 px-3 py-3 text-left whitespace-normal data-[state=active]:border-primary/24 data-[state=active]:bg-[linear-gradient(180deg,hsl(var(--primary)/0.14)_0%,hsl(var(--panel-surface)/0.94)_100%)] data-[state=active]:text-foreground data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-background/82"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/80 text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {tab.title}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {tab.description}
                          </span>
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </section>
          </aside>

          <div className="min-w-0">
            {!isEditMode ? (
              <TabsContent value="preset" className="mt-0">
                <WorkbenchSection
                  title={t("universalProvider.selectPreset", {
                    defaultValue: "选择预设",
                  })}
                  description={t("universalProvider.selectPresetPanelHint", {
                    defaultValue:
                      "先选择最接近的统一网关模板，再继续补充连接信息与模型细节。",
                  })}
                  accent
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    {universalProviderPresets.map((preset) => {
                      const isSelected =
                        selectedPreset?.providerType === preset.providerType;
                      return (
                        <button
                          key={preset.providerType}
                          type="button"
                          onClick={() => handlePresetSelect(preset)}
                          className={cn(
                            "group rounded-[22px] border p-4 text-left transition-all",
                            isSelected
                              ? "border-primary/24 bg-[linear-gradient(180deg,hsl(var(--primary)/0.12)_0%,hsl(var(--panel-surface)/0.94)_100%)] shadow-[0_20px_48px_-36px_hsl(var(--shadow-color)/0.92)]"
                              : "border-border/60 bg-background/55 hover:border-border hover:bg-background/72",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-border/60 bg-background/70">
                                <ProviderIcon
                                  icon={preset.icon}
                                  name={preset.name}
                                  size={18}
                                />
                              </span>
                              <div>
                                <div className="text-sm font-semibold text-foreground">
                                  {preset.name}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {preset.providerType}
                                </div>
                              </div>
                            </div>
                            {isSelected ? (
                              <SummaryPill
                                label={t("common.selected", {
                                  defaultValue: "已选",
                                })}
                                value={t("common.ready", {
                                  defaultValue: "就绪",
                                })}
                                tone="accent"
                              />
                            ) : null}
                          </div>
                          <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            {preset.description}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <SummaryPill
                              label={t("universalProvider.defaultApps", {
                                defaultValue: "默认应用",
                              })}
                              value={
                                Object.values(preset.defaultApps).filter(Boolean)
                                  .length
                              }
                            />
                            <SummaryPill
                              label={t("universalProvider.modelConfig", {
                                defaultValue: "模型配置",
                              })}
                              value={Object.keys(preset.defaultModels).length}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </WorkbenchSection>
              </TabsContent>
            ) : null}

            <TabsContent value="basic" className="mt-0">
              <WorkbenchSection
                title={t("universalProvider.basicInfo", {
                  defaultValue: "基础信息",
                })}
                description={t("universalProvider.basicInfoPanelHint", {
                  defaultValue:
                    "确定统一供应商的网关地址、鉴权信息和展示字段，为后续同步和维护建立清晰上下文。",
                })}
              >
                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="universal-name">
                      {t("universalProvider.name", { defaultValue: "名称" })}
                    </Label>
                    <Input
                      id="universal-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t("universalProvider.namePlaceholder", {
                        defaultValue: "例如：我的 NewAPI",
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="universal-base-url">
                      {t("universalProvider.baseUrl", {
                        defaultValue: "API 地址",
                      })}
                    </Label>
                    <Input
                      id="universal-base-url"
                      value={baseUrl}
                      onChange={(event) => setBaseUrl(event.target.value)}
                      placeholder="https://api.example.com"
                    />
                  </div>

                  <div className="space-y-2 xl:col-span-2">
                    <Label htmlFor="universal-api-key">
                      {t("universalProvider.apiKey", {
                        defaultValue: "API Key",
                      })}
                    </Label>
                    <div className="relative">
                      <Input
                        id="universal-api-key"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        placeholder="sk-..."
                        className="pr-12"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-1 my-auto h-9 w-9 rounded-full"
                        onClick={() => setShowApiKey((current) => !current)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="universal-website-url">
                      {t("universalProvider.websiteUrl", {
                        defaultValue: "官网地址",
                      })}
                    </Label>
                    <Input
                      id="universal-website-url"
                      value={websiteUrl}
                      onChange={(event) => setWebsiteUrl(event.target.value)}
                      placeholder={t("universalProvider.websiteUrlPlaceholder", {
                        defaultValue: "https://example.com（可选，用于列表展示）",
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="universal-provider-type">
                      {t("universalProvider.providerType", {
                        defaultValue: "供应商类型",
                      })}
                    </Label>
                    <Input
                      id="universal-provider-type"
                      value={
                        selectedPreset?.providerType ||
                        editingProvider?.providerType ||
                        ""
                      }
                      disabled
                    />
                  </div>

                  <div className="space-y-2 xl:col-span-2">
                    <Label htmlFor="universal-notes">
                      {t("universalProvider.notes", { defaultValue: "备注" })}
                    </Label>
                    <Textarea
                      id="universal-notes"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder={t("universalProvider.notesPlaceholder", {
                        defaultValue: "记录接入说明、套餐差异或同步注意事项。",
                      })}
                      rows={4}
                    />
                  </div>
                </div>
              </WorkbenchSection>
            </TabsContent>

            <TabsContent value="apps" className="mt-0">
              <WorkbenchSection
                title={t("universalProvider.enabledApps", {
                  defaultValue: "应用映射",
                })}
                description={t("universalProvider.enabledAppsPanelHint", {
                  defaultValue:
                    "统一控制哪些应用使用当前网关。关闭的应用不会参与同步，也不会生成配置预览。",
                })}
              >
                <div className="grid gap-4 xl:grid-cols-3">
                  {(["claude", "codex", "gemini"] as UniversalAppId[]).map(
                    (appId) => {
                      const checked =
                        appId === "claude"
                          ? claudeEnabled
                          : appId === "codex"
                            ? codexEnabled
                            : geminiEnabled;
                      const setChecked =
                        appId === "claude"
                          ? setClaudeEnabled
                          : appId === "codex"
                            ? setCodexEnabled
                            : setGeminiEnabled;
                      const meta = APP_META[appId];

                      return (
                        <div
                          key={appId}
                          className={cn(
                            "rounded-[22px] border p-4 transition-colors",
                            checked
                              ? "border-primary/24 bg-[linear-gradient(180deg,hsl(var(--primary)/0.12)_0%,hsl(var(--panel-surface)/0.94)_100%)]"
                              : "border-border/60 bg-background/55",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-border/60 bg-background/70">
                                <ProviderIcon
                                  icon={meta.icon}
                                  name={meta.label}
                                  size={18}
                                />
                              </span>
                              <div>
                                <div className="text-sm font-semibold text-foreground">
                                  {meta.title}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {meta.description}
                                </div>
                              </div>
                            </div>
                            <Switch checked={checked} onCheckedChange={setChecked} />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </WorkbenchSection>
            </TabsContent>

            <TabsContent value="models" className="mt-0">
              <WorkbenchSection
                title={t("universalProvider.modelConfig", {
                  defaultValue: "模型配置",
                })}
                description={t("universalProvider.modelConfigPanelHint", {
                  defaultValue:
                    "按应用切换维护默认模型。不同协议有自己的模型字段和运行参数。",
                })}
              >
                {enabledAppIds.length === 0 ? (
                  <EmptyWorkbench
                    title={t("universalProvider.noAppsEnabled", {
                      defaultValue: "还没有启用任何应用",
                    })}
                    description={t("universalProvider.noAppsEnabledHint", {
                      defaultValue:
                        "先在应用映射中启用至少一个应用，再配置该应用的默认模型。",
                    })}
                  />
                ) : (
                  <Tabs
                    value={activeModelApp}
                    onValueChange={(value) =>
                      setActiveModelApp(value as UniversalAppId)
                    }
                    className="space-y-4"
                  >
                    <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-[18px] border border-border/60 bg-background/55 p-1.5">
                      {enabledAppIds.map((appId) => (
                        <TabsTrigger
                          key={appId}
                          value={appId}
                          className="rounded-[14px] px-4 py-2"
                        >
                          {APP_META[appId].title}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="claude" className="mt-0">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t("universalProvider.model", { defaultValue: "主模型" })}</Label>
                          <Input
                            value={models.claude?.model || ""}
                            onChange={(event) =>
                              updateModel("claude", "model", event.target.value)
                            }
                            placeholder="claude-sonnet-4-20250514"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Haiku</Label>
                          <Input
                            value={models.claude?.haikuModel || ""}
                            onChange={(event) =>
                              updateModel(
                                "claude",
                                "haikuModel",
                                event.target.value,
                              )
                            }
                            placeholder="claude-haiku-4-20250514"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Sonnet</Label>
                          <Input
                            value={models.claude?.sonnetModel || ""}
                            onChange={(event) =>
                              updateModel(
                                "claude",
                                "sonnetModel",
                                event.target.value,
                              )
                            }
                            placeholder="claude-sonnet-4-20250514"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Opus</Label>
                          <Input
                            value={models.claude?.opusModel || ""}
                            onChange={(event) =>
                              updateModel("claude", "opusModel", event.target.value)
                            }
                            placeholder="claude-opus-4-20250514"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="codex" className="mt-0">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>{t("universalProvider.model", { defaultValue: "模型" })}</Label>
                          <Input
                            value={models.codex?.model || ""}
                            onChange={(event) =>
                              updateModel("codex", "model", event.target.value)
                            }
                            placeholder="gpt-5.4"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reasoning Effort</Label>
                          <Input
                            value={models.codex?.reasoningEffort || ""}
                            onChange={(event) =>
                              updateModel(
                                "codex",
                                "reasoningEffort",
                                event.target.value,
                              )
                            }
                            placeholder="high"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="gemini" className="mt-0">
                      <div className="space-y-2">
                        <Label>{t("universalProvider.model", { defaultValue: "模型" })}</Label>
                        <Input
                          value={models.gemini?.model || ""}
                          onChange={(event) =>
                            updateModel("gemini", "model", event.target.value)
                          }
                          placeholder="gemini-2.5-pro"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </WorkbenchSection>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <WorkbenchSection
                title={t("universalProvider.configPreview", {
                  defaultValue: "配置预览",
                })}
                description={t("universalProvider.configPreviewPanelHint", {
                  defaultValue:
                    "这里展示保存后将同步到各应用的配置结构，便于在提交前校验关键字段。",
                })}
              >
                {enabledAppIds.length === 0 ? (
                  <EmptyWorkbench
                    title={t("universalProvider.noPreviewAvailable", {
                      defaultValue: "暂无配置预览",
                    })}
                    description={t("universalProvider.noPreviewAvailableHint", {
                      defaultValue:
                        "先启用目标应用，再返回这里查看对应配置文件。",
                    })}
                  />
                ) : (
                  <Tabs
                    value={activePreviewApp}
                    onValueChange={(value) =>
                      setActivePreviewApp(value as UniversalAppId)
                    }
                    className="space-y-4"
                  >
                    <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-[18px] border border-border/60 bg-background/55 p-1.5">
                      {enabledAppIds.map((appId) => (
                        <TabsTrigger
                          key={appId}
                          value={appId}
                          className="rounded-[14px] px-4 py-2"
                        >
                          {APP_META[appId].title}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {enabledAppIds.map((appId) => (
                      <TabsContent key={appId} value={appId} className="mt-0">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <SummaryPill
                              label={t("universalProvider.targetApp", {
                                defaultValue: "目标应用",
                              })}
                              value={APP_META[appId].title}
                              tone="accent"
                            />
                            <SummaryPill
                              label={t("universalProvider.syncPolicy", {
                                defaultValue: "同步策略",
                              })}
                              value={t("universalProvider.overwriteMappedConfig", {
                                defaultValue: "覆盖映射配置",
                              })}
                            />
                          </div>

                          <JsonEditor
                            value={JSON.stringify(previewConfigs[appId], null, 2)}
                            onChange={() => {}}
                            height={appId === "codex" ? 340 : 260}
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </WorkbenchSection>
            </TabsContent>
          </div>
        </Tabs>
      </OperationDrawer>

      <ConfirmDialog
        isOpen={syncConfirmOpen}
        title={t("universalProvider.syncConfirmTitle", {
          defaultValue: "同步统一供应商",
        })}
        message={t("universalProvider.syncConfirmDescription", {
          defaultValue: `同步 "${name}" 将会覆盖 Claude、Codex 和 Gemini 中关联的供应商配置。确定要继续吗？`,
          name,
        })}
        confirmText={t("universalProvider.saveAndSync", {
          defaultValue: "保存并同步",
        })}
        onConfirm={confirmSaveAndSync}
        onCancel={() => {
          setSyncConfirmOpen(false);
          setPendingProvider(null);
        }}
      />
    </>
  );
}
