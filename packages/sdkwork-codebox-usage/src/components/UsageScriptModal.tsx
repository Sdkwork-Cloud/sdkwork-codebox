import React, { useEffect, useMemo, useState } from "react";
import { Play, Wand2, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import type { Plugin } from "prettier";
import { Provider, UsageScript, UsageData } from "@/types";
import { usageApi, settingsApi, type AppId } from "@/lib/api";
import { useSettingsQuery } from "@/lib/query";
import { extractCodexBaseUrl } from "@/utils/codexConfigUtils";
import JsonEditor from "@/components/JsonEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FullScreenPanel } from "@/components/common/FullScreenPanel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  UsageEmptyState,
  UsagePanel,
  UsagePill,
} from "@/components/usage/UsageWorkbench";

interface UsageScriptModalProps {
  provider: Provider;
  appId: AppId;
  isOpen: boolean;
  onClose: () => void;
  onSave: (script: UsageScript) => void;
}

// 预设模板键名（用于国际化）
const TEMPLATE_KEYS = {
  CUSTOM: "custom",
  GENERAL: "general",
  NEW_API: "newapi",
} as const;

// 生成预设模板的函数（支持国际化）
const generatePresetTemplates = (
  t: (key: string) => string,
): Record<string, string> => ({
  [TEMPLATE_KEYS.CUSTOM]: `({
  request: {
    url: "",
    method: "GET",
    headers: {}
  },
  extractor: function(response) {
    return {
      remaining: 0,
      unit: "USD"
    };
  }
})`,

  [TEMPLATE_KEYS.GENERAL]: `({
  request: {
    url: "{{baseUrl}}/user/balance",
    method: "GET",
    headers: {
      "Authorization": "Bearer {{apiKey}}",
      "User-Agent": "codebox/1.0"
    }
  },
  extractor: function(response) {
    return {
      isValid: response.is_active || true,
      remaining: response.balance,
      unit: "USD"
    };
  }
})`,

  [TEMPLATE_KEYS.NEW_API]: `({
  request: {
    url: "{{baseUrl}}/api/user/self",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{accessToken}}",
      "New-Api-User": "{{userId}}"
    },
  },
  extractor: function (response) {
    if (response.success && response.data) {
      return {
        planName: response.data.group || "${t("usageScript.defaultPlan")}",
        remaining: response.data.quota / 500000,
        used: response.data.used_quota / 500000,
        total: (response.data.quota + response.data.used_quota) / 500000,
        unit: "USD",
      };
    }
    return {
      isValid: false,
      invalidMessage: response.message || "${t("usageScript.queryFailedMessage")}"
    };
  },
})`,
});

// 模板名称国际化键映射
const TEMPLATE_NAME_KEYS: Record<string, string> = {
  [TEMPLATE_KEYS.CUSTOM]: "usageScript.templateCustom",
  [TEMPLATE_KEYS.GENERAL]: "usageScript.templateGeneral",
  [TEMPLATE_KEYS.NEW_API]: "usageScript.templateNewAPI",
};

const resolveSelectedTemplate = (
  usageScript?: UsageScript,
): keyof typeof TEMPLATE_KEYS | string => {
  if (usageScript?.templateType) {
    return usageScript.templateType;
  }
  if (usageScript?.accessToken || usageScript?.userId) {
    return TEMPLATE_KEYS.NEW_API;
  }
  if (usageScript?.apiKey || usageScript?.baseUrl) {
    return TEMPLATE_KEYS.GENERAL;
  }
  return TEMPLATE_KEYS.GENERAL;
};

type PrettierRuntime = {
  prettier: typeof import("prettier/standalone");
  plugins: Plugin[];
};

let prettierRuntimePromise: Promise<PrettierRuntime> | null = null;

type PrettierStandaloneModule = typeof import("prettier/standalone") & {
  default?: typeof import("prettier/standalone");
};

type PrettierPluginModule = Plugin & {
  default?: Plugin;
};

const resolvePrettierRuntime = (
  module: PrettierStandaloneModule,
): typeof import("prettier/standalone") => module.default ?? module;

const resolvePrettierPlugin = (module: PrettierPluginModule): Plugin =>
  module.default ?? module;

const loadPrettierRuntime = async (): Promise<PrettierRuntime> => {
  const runtimePromise =
    prettierRuntimePromise ??
    (prettierRuntimePromise = Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
    ]).then(([prettier, parserBabel, pluginEstree]) => ({
      prettier: resolvePrettierRuntime(prettier as PrettierStandaloneModule),
      plugins: [
        resolvePrettierPlugin(parserBabel as PrettierPluginModule),
        resolvePrettierPlugin(pluginEstree as PrettierPluginModule),
      ],
    })));

  return runtimePromise;
};

const UsageScriptModal: React.FC<UsageScriptModalProps> = ({
  provider,
  appId,
  isOpen,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: settingsData } = useSettingsQuery();
  const [showUsageConfirm, setShowUsageConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void loadPrettierRuntime();
    }
  }, [isOpen]);

  // 生成带国际化的预设模板
  const PRESET_TEMPLATES = useMemo(() => generatePresetTemplates(t), [t]);

  // 从 provider 的 settingsConfig 中提取 API Key 和 Base URL
  const getProviderCredentials = (): {
    apiKey: string | undefined;
    baseUrl: string | undefined;
  } => {
    try {
      const config = provider.settingsConfig;
      if (!config) return { apiKey: undefined, baseUrl: undefined };

      // 处理不同应用的配置格式
      if (appId === "claude") {
        // Claude: { env: { ANTHROPIC_AUTH_TOKEN | ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL } }
        const env = (config as any).env || {};
        return {
          apiKey: env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY,
          baseUrl: env.ANTHROPIC_BASE_URL,
        };
      } else if (appId === "codex") {
        // Codex: { auth: { OPENAI_API_KEY }, config: TOML string with base_url }
        const auth = (config as any).auth || {};
        const configToml = (config as any).config || "";
        return {
          apiKey: auth.OPENAI_API_KEY,
          baseUrl: extractCodexBaseUrl(configToml),
        };
      } else if (appId === "gemini") {
        // Gemini: { env: { GEMINI_API_KEY, GOOGLE_GEMINI_BASE_URL } }
        const env = (config as any).env || {};
        return {
          apiKey: env.GEMINI_API_KEY,
          baseUrl: env.GOOGLE_GEMINI_BASE_URL,
        };
      }
      return { apiKey: undefined, baseUrl: undefined };
    } catch (error) {
      console.error("Failed to extract provider credentials:", error);
      return { apiKey: undefined, baseUrl: undefined };
    }
  };

  const providerCredentials = useMemo(
    () => getProviderCredentials(),
    [appId, provider.settingsConfig],
  );

  const getDefaultScript = (): UsageScript => ({
    enabled: false,
    language: "javascript",
    code: PRESET_TEMPLATES[TEMPLATE_KEYS.GENERAL],
    timeout: 10,
  });

  const [script, setScript] = useState<UsageScript>(() => {
    return provider.meta?.usage_script ?? getDefaultScript();
  });

  const [testing, setTesting] = useState(false);

  // 🔧 失焦时的验证（严格）- 仅确保有效整数
  const validateTimeout = (value: string): number => {
    const num = Number(value);
    if (isNaN(num) || value.trim() === "") {
      return 10;
    }
    if (!Number.isInteger(num)) {
      toast.warning(
        t("usageScript.timeoutMustBeInteger") || "超时时间必须为整数",
      );
    }
    if (num < 0) {
      toast.error(
        t("usageScript.timeoutCannotBeNegative") || "超时时间不能为负数",
      );
      return 10;
    }
    return Math.floor(num);
  };

  // 🔧 失焦时的验证（严格）- 自动查询间隔
  const validateAndClampInterval = (value: string): number => {
    const num = Number(value);
    if (isNaN(num) || value.trim() === "") {
      return 0;
    }
    if (!Number.isInteger(num)) {
      toast.warning(
        t("usageScript.intervalMustBeInteger") || "自动查询间隔必须为整数",
      );
    }
    if (num < 0) {
      toast.error(
        t("usageScript.intervalCannotBeNegative") || "自动查询间隔不能为负数",
      );
      return 0;
    }
    const clamped = Math.max(0, Math.min(1440, Math.floor(num)));
    if (clamped !== num && num > 0) {
      toast.info(
        t("usageScript.intervalAdjusted", { value: clamped }) ||
          `自动查询间隔已调整为 ${clamped} 分钟`,
      );
    }
    return clamped;
  };

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    () => resolveSelectedTemplate(provider.meta?.usage_script),
  );

  const [showApiKey, setShowApiKey] = useState(false);
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "editor" | "guide"
  >("editor");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setScript(provider.meta?.usage_script ?? getDefaultScript());
    setSelectedTemplate(resolveSelectedTemplate(provider.meta?.usage_script));
    setShowApiKey(false);
    setShowAccessToken(false);
    setActiveWorkspaceTab("editor");
    setShowUsageConfirm(false);
  }, [isOpen, provider.id, provider.meta?.usage_script]);

  const handleEnableToggle = (checked: boolean) => {
    if (checked && !settingsData?.usageConfirmed) {
      setShowUsageConfirm(true);
    } else {
      setScript({ ...script, enabled: checked });
    }
  };

  const handleUsageConfirm = async () => {
    setShowUsageConfirm(false);
    try {
      if (settingsData) {
        await settingsApi.save({ ...settingsData, usageConfirmed: true });
        await queryClient.invalidateQueries({ queryKey: ["settings"] });
      }
    } catch (error) {
      console.error("Failed to save usage confirmed:", error);
    }
    setScript({ ...script, enabled: true });
  };

  const handleSave = () => {
    if (script.enabled && !script.code.trim()) {
      toast.error(t("usageScript.scriptEmpty"));
      return;
    }
    if (script.enabled && !script.code.includes("return")) {
      toast.error(t("usageScript.mustHaveReturn"), { duration: 5000 });
      return;
    }
    // 保存时记录当前选择的模板类型
    const scriptWithTemplate = {
      ...script,
      templateType: selectedTemplate as
        | "custom"
        | "general"
        | "newapi"
        | undefined,
    };
    onSave(scriptWithTemplate);
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await usageApi.testScript(
        provider.id,
        appId,
        script.code,
        script.timeout,
        script.apiKey,
        script.baseUrl,
        script.accessToken,
        script.userId,
        selectedTemplate as "custom" | "general" | "newapi" | undefined,
      );
      if (result.success && result.data && result.data.length > 0) {
        const summary = result.data
          .map((plan: UsageData) => {
            const planInfo = plan.planName ? `[${plan.planName}]` : "";
            return `${planInfo} ${t("usage.remaining")} ${plan.remaining} ${plan.unit}`;
          })
          .join(", ");
        toast.success(`${t("usageScript.testSuccess")}${summary}`, {
          duration: 3000,
          closeButton: true,
        });

        // 🔧 测试成功后，更新主界面列表的用量查询缓存
        queryClient.setQueryData(["usage", provider.id, appId], result);
      } else {
        toast.error(
          `${t("usageScript.testFailed")}: ${result.error || t("endpointTest.noResult")}`,
          {
            duration: 5000,
          },
        );
      }
    } catch (error: any) {
      toast.error(
        `${t("usageScript.testFailed")}: ${error?.message || t("common.unknown")}`,
        {
          duration: 5000,
        },
      );
    } finally {
      setTesting(false);
    }
  };

  const handleFormat = async () => {
    try {
      const { prettier, plugins } = await loadPrettierRuntime();
      const formatted = await prettier.format(script.code, {
        parser: "babel",
        plugins,
        semi: true,
        singleQuote: false,
        tabWidth: 2,
        printWidth: 80,
      });
      setScript({ ...script, code: formatted.trim() });
      toast.success(t("usageScript.formatSuccess"), {
        duration: 1000,
        closeButton: true,
      });
    } catch (error: any) {
      toast.error(
        `${t("usageScript.formatFailed")}: ${error?.message || t("jsonEditor.invalidJson")}`,
        {
          duration: 3000,
        },
      );
    }
  };

  const handleUsePreset = (presetName: string) => {
    const preset = PRESET_TEMPLATES[presetName];
    if (preset) {
      if (presetName === TEMPLATE_KEYS.CUSTOM) {
        // 🔧 自定义模式：用户应该在脚本中直接写完整 URL 和凭证，而不是依赖变量替换
        // 这样可以避免同源检查导致的问题
        // 如果用户想使用变量，需要手动在配置中设置 baseUrl/apiKey
        setScript({
          ...script,
          code: preset,
          // 清除凭证，用户可选择手动输入或保持空
          apiKey: undefined,
          baseUrl: undefined,
          accessToken: undefined,
          userId: undefined,
        });
      } else if (presetName === TEMPLATE_KEYS.GENERAL) {
        setScript({
          ...script,
          code: preset,
          accessToken: undefined,
          userId: undefined,
        });
      } else if (presetName === TEMPLATE_KEYS.NEW_API) {
        setScript({
          ...script,
          code: preset,
          apiKey: undefined,
        });
      }
      setSelectedTemplate(presetName);
    }
  };

  const shouldShowCredentialsConfig =
    selectedTemplate === TEMPLATE_KEYS.GENERAL ||
    selectedTemplate === TEMPLATE_KEYS.NEW_API;

  const selectedTemplateLabel = selectedTemplate
    ? t(TEMPLATE_NAME_KEYS[selectedTemplate] ?? selectedTemplate, {
        defaultValue: selectedTemplate,
      })
    : t("common.notSet", { defaultValue: "未设置" });
  const autoQueryLabel =
    script.autoQueryInterval ?? script.autoIntervalMinutes
      ? `${script.autoQueryInterval ?? script.autoIntervalMinutes} min`
      : t("usage.autoRefreshOff", {
          defaultValue: "手动刷新",
        });

  const footer = (
    <>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleTest}
          disabled={!script.enabled || testing}
        >
          <Play size={14} className="mr-1" />
          {testing ? t("usageScript.testing") : t("usageScript.testScript")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFormat}
          disabled={!script.enabled}
          title={t("usageScript.format")}
        >
          <Wand2 size={14} className="mr-1" />
          {t("usageScript.format")}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-border/20 hover:bg-accent hover:text-accent-foreground"
        >
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save size={16} className="mr-2" />
          {t("usageScript.saveConfig")}
        </Button>
      </div>
    </>
  );

  return (
    <FullScreenPanel
      isOpen={isOpen}
      title={`${t("usageScript.title")} - ${provider.name}`}
      onClose={onClose}
      footer={footer}
    >
      <UsagePanel
        eyebrow={t("usageScript.eyebrow", {
          defaultValue: "Usage Query Workbench",
        })}
        title={t("usageScript.enableUsageQuery")}
        description={t("usageScript.workbenchDescription", {
          defaultValue:
            "在同一工作台中配置模板、凭证、执行参数和提取器脚本，减少长表单滚动和上下文切换。",
        })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <UsagePill
              label={t("usageScript.provider", {
                defaultValue: "供应商",
              })}
              value={provider.name}
            />
            <UsagePill
              label={t("usageScript.status", {
                defaultValue: "状态",
              })}
              value={
                script.enabled
                  ? t("common.enabled", { defaultValue: "已启用" })
                  : t("common.disabled", { defaultValue: "未启用" })
              }
              tone={script.enabled ? "success" : "neutral"}
            />
            <UsagePill
              label={t("usageScript.presetTemplate", {
                defaultValue: "模板",
              })}
              value={selectedTemplateLabel}
              tone="accent"
            />
            <UsagePill
              label={t("usageScript.timeoutSeconds", {
                defaultValue: "超时",
              })}
              value={`${script.timeout ?? 10}s`}
            />
            <UsagePill
              label={t("usageScript.autoIntervalMinutes", {
                defaultValue: "自动查询",
              })}
              value={autoQueryLabel}
            />
            <div className="flex items-center gap-3 rounded-full border border-border/60 bg-background/72 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t("usageScript.enableUsageQuery")}
              </span>
              <Switch
                checked={script.enabled}
                onCheckedChange={handleEnableToggle}
                aria-label={t("usageScript.enableUsageQuery")}
              />
            </div>
          </div>
        }
      >
        {script.enabled ? (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
              <section className="space-y-4 rounded-[22px] border border-border/60 bg-background/55 p-5">
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    {t("usageScript.presetTemplate")}
                  </Label>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {t("usageScript.templateHint", {
                      defaultValue:
                        "先选最接近的查询模板，再补充凭证和脚本细节，会更稳妥。",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(PRESET_TEMPLATES).map((name) => {
                    const isSelected = selectedTemplate === name;
                    return (
                      <Button
                        key={name}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "rounded-full border",
                          isSelected
                            ? "shadow-sm"
                            : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                        onClick={() => handleUsePreset(name)}
                      >
                        {t(TEMPLATE_NAME_KEYS[name])}
                      </Button>
                    );
                  })}
                </div>
              </section>

              {selectedTemplate === TEMPLATE_KEYS.CUSTOM ? (
                <section className="space-y-3 rounded-[22px] border border-border/60 bg-background/55 p-5">
                  <div className="text-sm font-semibold text-foreground">
                    {t("usageScript.supportedVariables")}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="rounded-[16px] border border-border/50 bg-background/65 px-3 py-3">
                      <div className="font-mono text-emerald-500">
                        {"{{baseUrl}}"}
                      </div>
                      <div className="mt-2 break-all font-mono text-foreground/80">
                        {providerCredentials.baseUrl ||
                          (t("common.notSet") || "未设置")}
                      </div>
                    </div>
                    <div className="rounded-[16px] border border-border/50 bg-background/65 px-3 py-3">
                      <div className="font-mono text-emerald-500">
                        {"{{apiKey}}"}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="font-mono text-foreground/80">
                          {providerCredentials.apiKey
                            ? showApiKey
                              ? providerCredentials.apiKey
                              : "••••••••"
                            : t("common.notSet") || "未设置"}
                        </code>
                        {providerCredentials.apiKey ? (
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={
                              showApiKey
                                ? t("apiKeyInput.hide")
                                : t("apiKeyInput.show")
                            }
                          >
                            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {shouldShowCredentialsConfig ? (
                <section className="space-y-4 rounded-[22px] border border-border/60 bg-background/55 p-5">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {t("usageScript.credentialsConfig")}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {t("usageScript.credentialsHint")}
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {selectedTemplate === TEMPLATE_KEYS.GENERAL ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="usage-api-key">
                            API Key{" "}
                            <span className="text-xs text-muted-foreground font-normal">
                              ({t("usageScript.optional")})
                            </span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="usage-api-key"
                              type={showApiKey ? "text" : "password"}
                              value={script.apiKey || ""}
                              onChange={(e) =>
                                setScript({ ...script, apiKey: e.target.value })
                              }
                              placeholder={t("usageScript.apiKeyPlaceholder")}
                              autoComplete="off"
                            />
                            {script.apiKey ? (
                              <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={
                                  showApiKey
                                    ? t("apiKeyInput.hide")
                                    : t("apiKeyInput.show")
                                }
                              >
                                {showApiKey ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="usage-base-url">
                            {t("usageScript.baseUrl")}{" "}
                            <span className="text-xs text-muted-foreground font-normal">
                              ({t("usageScript.optional")})
                            </span>
                          </Label>
                          <Input
                            id="usage-base-url"
                            type="text"
                            value={script.baseUrl || ""}
                            onChange={(e) =>
                              setScript({ ...script, baseUrl: e.target.value })
                            }
                            placeholder={t("usageScript.baseUrlPlaceholder")}
                            autoComplete="off"
                          />
                        </div>
                      </>
                    ) : null}

                    {selectedTemplate === TEMPLATE_KEYS.NEW_API ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="usage-newapi-base-url">
                            {t("usageScript.baseUrl")}
                          </Label>
                          <Input
                            id="usage-newapi-base-url"
                            type="text"
                            value={script.baseUrl || ""}
                            onChange={(e) =>
                              setScript({ ...script, baseUrl: e.target.value })
                            }
                            placeholder="https://api.newapi.com"
                            autoComplete="off"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="usage-access-token">
                            {t("usageScript.accessToken")}
                          </Label>
                          <div className="relative">
                            <Input
                              id="usage-access-token"
                              type={showAccessToken ? "text" : "password"}
                              value={script.accessToken || ""}
                              onChange={(e) =>
                                setScript({
                                  ...script,
                                  accessToken: e.target.value,
                                })
                              }
                              placeholder={t(
                                "usageScript.accessTokenPlaceholder",
                              )}
                              autoComplete="off"
                            />
                            {script.accessToken ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAccessToken(!showAccessToken)
                                }
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={
                                  showAccessToken
                                    ? t("apiKeyInput.hide")
                                    : t("apiKeyInput.show")
                                }
                              >
                                {showAccessToken ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="usage-user-id">
                            {t("usageScript.userId")}
                          </Label>
                          <Input
                            id="usage-user-id"
                            type="text"
                            value={script.userId || ""}
                            onChange={(e) =>
                              setScript({ ...script, userId: e.target.value })
                            }
                            placeholder={t("usageScript.userIdPlaceholder")}
                            autoComplete="off"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              ) : null}

              <section className="grid gap-4 rounded-[22px] border border-border/60 bg-background/55 p-5">
                <div className="space-y-2">
                  <Label htmlFor="usage-timeout">
                    {t("usageScript.timeoutSeconds")}
                  </Label>
                  <Input
                    id="usage-timeout"
                    type="number"
                    min={0}
                    value={script.timeout ?? 10}
                    onChange={(e) =>
                      setScript({
                        ...script,
                        timeout: validateTimeout(e.target.value),
                      })
                    }
                    onBlur={(e) =>
                      setScript({
                        ...script,
                        timeout: validateTimeout(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage-interval">
                    {t("usageScript.autoIntervalMinutes")}
                  </Label>
                  <Input
                    id="usage-interval"
                    type="number"
                    min={0}
                    max={1440}
                    value={
                      script.autoQueryInterval ?? script.autoIntervalMinutes ?? 0
                    }
                    onChange={(e) =>
                      setScript({
                        ...script,
                        autoQueryInterval: validateAndClampInterval(
                          e.target.value,
                        ),
                      })
                    }
                    onBlur={(e) =>
                      setScript({
                        ...script,
                        autoQueryInterval: validateAndClampInterval(
                          e.target.value,
                        ),
                      })
                    }
                  />
                </div>
              </section>
            </div>

            <div className="min-w-0 xl:min-h-[720px]">
              <Tabs
                value={activeWorkspaceTab}
                onValueChange={(value) =>
                  setActiveWorkspaceTab(value as "editor" | "guide")
                }
                className="flex min-h-full flex-col gap-4"
              >
                <TabsList className="grid w-full grid-cols-2 rounded-[18px] border border-border/60 bg-background/55 p-1.5">
                  <TabsTrigger value="editor" className="rounded-[14px]">
                    {t("usageScript.extractorCode")}
                  </TabsTrigger>
                  <TabsTrigger value="guide" className="rounded-[14px]">
                    {t("usageScript.scriptHelp")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-0 flex-1">
                  <UsagePanel
                    className="h-full"
                    title={t("usageScript.extractorCode")}
                    description={t("usageScript.extractorHint")}
                    actions={
                      <div className="flex flex-wrap items-center gap-2">
                        <UsagePill
                          label={t("usageScript.language", {
                            defaultValue: "语言",
                          })}
                          value={script.language}
                        />
                        <UsagePill
                          label={t("usageScript.status", {
                            defaultValue: "状态",
                          })}
                          value={
                            testing
                              ? t("usageScript.testing", {
                                  defaultValue: "测试中",
                                })
                              : t("common.ready", {
                                  defaultValue: "就绪",
                                })
                          }
                          tone={testing ? "warning" : "success"}
                        />
                      </div>
                    }
                    bodyClassName="flex h-full min-h-0 flex-col p-4"
                  >
                    <div className="flex-1 min-h-[520px] xl:min-h-[620px]">
                      <JsonEditor
                        id="usage-code"
                        value={script.code || ""}
                        onChange={(value) => setScript({ ...script, code: value })}
                        height="100%"
                        language="javascript"
                        showMinimap={false}
                      />
                    </div>
                  </UsagePanel>
                </TabsContent>

                <TabsContent value="guide" className="mt-0 flex-1">
                  <UsagePanel
                    className="h-full"
                    title={t("usageScript.scriptHelp")}
                    description={t("usageScript.scriptHelpHint", {
                      defaultValue:
                        "这里保留返回格式、字段约定和变量提示，便于一边写脚本一边核对输出结构。",
                    })}
                  >
                    <div className="space-y-5 text-xs leading-6 text-foreground/90">
                      <div>
                        <strong>{t("usageScript.configFormat")}</strong>
                        <pre className="mt-2 overflow-x-auto rounded-[18px] border border-border/60 bg-background/70 p-3 text-[11px]">
                          {`({
  request: {
    url: "{{baseUrl}}/api/usage",
    method: "POST",
    headers: {
      "Authorization": "Bearer {{apiKey}}",
      "User-Agent": "codebox/1.0"
    }
  },
  extractor: function(response) {
    return {
      isValid: !response.error,
      remaining: response.balance,
      unit: "USD"
    };
  }
})`}
                        </pre>
                      </div>

                      <div>
                        <strong>{t("usageScript.extractorFormat")}</strong>
                        <ul className="mt-2 space-y-1 pl-4">
                          <li>{t("usageScript.fieldIsValid")}</li>
                          <li>{t("usageScript.fieldInvalidMessage")}</li>
                          <li>{t("usageScript.fieldRemaining")}</li>
                          <li>{t("usageScript.fieldUnit")}</li>
                          <li>{t("usageScript.fieldPlanName")}</li>
                          <li>{t("usageScript.fieldTotal")}</li>
                          <li>{t("usageScript.fieldUsed")}</li>
                          <li>{t("usageScript.fieldExtra")}</li>
                        </ul>
                      </div>

                      <div className="text-muted-foreground">
                        <strong>{t("usageScript.tips")}</strong>
                        <ul className="mt-2 space-y-1 pl-4">
                          <li>
                            {t("usageScript.tip1", {
                              apiKey: "{{apiKey}}",
                              baseUrl: "{{baseUrl}}",
                            })}
                          </li>
                          <li>{t("usageScript.tip2")}</li>
                          <li>{t("usageScript.tip3")}</li>
                        </ul>
                      </div>
                    </div>
                  </UsagePanel>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <UsageEmptyState
            title={t("usageScript.disabledTitle", {
              defaultValue: "先启用用量查询，再配置脚本工作台",
            })}
            description={t("usageScript.disabledDescription", {
              defaultValue:
                "启用后你就可以在同一界面里选择模板、补充凭证、编写提取器并即时测试返回结果。",
            })}
            className="min-h-[320px]"
          />
        )}
      </UsagePanel>

      <ConfirmDialog
        isOpen={showUsageConfirm}
        variant="info"
        title={t("confirm.usage.title")}
        message={t("confirm.usage.message")}
        confirmText={t("confirm.usage.confirm")}
        onConfirm={() => void handleUsageConfirm()}
        onCancel={() => setShowUsageConfirm(false)}
      />
    </FullScreenPanel>
  );
};

export default UsageScriptModal;
