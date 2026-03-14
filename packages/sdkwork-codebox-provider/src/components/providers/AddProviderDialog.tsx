import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperationDrawer } from "@/components/common/OperationDrawer";
import type { Provider, CustomEndpoint } from "@/types";
import type { AppId } from "@/lib/api";
import {
  ProviderForm,
  type ProviderFormValues,
} from "@/components/providers/forms/ProviderForm";
import { UniversalProviderPanel } from "@/components/universal";
import { providerPresets } from "@/config/claudeProviderPresets";
import { codexProviderPresets } from "@/config/codexProviderPresets";
import { geminiProviderPresets } from "@/config/geminiProviderPresets";
import type { OpenClawSuggestedDefaults } from "@/config/openclawProviderPresets";
import type { UniversalProviderPreset } from "@/config/universalProviderPresets";
import { extractCodexBaseUrl } from "@/utils/providerConfigUtils";

interface AddProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: AppId;
  onSubmit: (
    provider: Omit<Provider, "id"> & {
      providerKey?: string;
      suggestedDefaults?: OpenClawSuggestedDefaults;
    },
  ) => Promise<void> | void;
}

export function AddProviderDialog({
  open,
  onOpenChange,
  appId,
  onSubmit,
}: AddProviderDialogProps) {
  const { t } = useTranslation();
  // OpenCode and OpenClaw don't support universal providers
  const showUniversalTab = appId !== "opencode" && appId !== "openclaw";
  const [activeTab, setActiveTab] = useState<"app-specific" | "universal">(
    "app-specific",
  );
  const [selectedUniversalPreset, setSelectedUniversalPreset] =
    useState<UniversalProviderPreset | null>(null);

  const handleSubmit = useCallback(
    async (values: ProviderFormValues) => {
      const parsedConfig = JSON.parse(values.settingsConfig) as Record<
        string,
        unknown
      >;

      // 构造基础提交数据
      const providerData: Omit<Provider, "id"> & {
        providerKey?: string;
        suggestedDefaults?: OpenClawSuggestedDefaults;
      } = {
        name: values.name.trim(),
        notes: values.notes?.trim() || undefined,
        websiteUrl: values.websiteUrl?.trim() || undefined,
        settingsConfig: parsedConfig,
        icon: values.icon?.trim() || undefined,
        iconColor: values.iconColor?.trim() || undefined,
        ...(values.presetCategory ? { category: values.presetCategory } : {}),
        ...(values.meta ? { meta: values.meta } : {}),
      };

      // OpenCode/OpenClaw: pass providerKey for ID generation
      if (
        (appId === "opencode" || appId === "openclaw") &&
        values.providerKey
      ) {
        providerData.providerKey = values.providerKey;
      }

      const hasCustomEndpoints =
        providerData.meta?.custom_endpoints &&
        Object.keys(providerData.meta.custom_endpoints).length > 0;

      if (!hasCustomEndpoints && values.presetCategory !== "omo") {
        const urlSet = new Set<string>();

        const addUrl = (rawUrl?: string) => {
          const url = (rawUrl || "").trim().replace(/\/+$/, "");
          if (url && url.startsWith("http")) {
            urlSet.add(url);
          }
        };

        if (values.presetId) {
          if (appId === "claude") {
            const presets = providerPresets;
            const presetIndex = parseInt(
              values.presetId.replace("claude-", ""),
            );
            if (
              !isNaN(presetIndex) &&
              presetIndex >= 0 &&
              presetIndex < presets.length
            ) {
              const preset = presets[presetIndex];
              if (preset?.endpointCandidates) {
                preset.endpointCandidates.forEach(addUrl);
              }
            }
          } else if (appId === "codex") {
            const presets = codexProviderPresets;
            const presetIndex = parseInt(values.presetId.replace("codex-", ""));
            if (
              !isNaN(presetIndex) &&
              presetIndex >= 0 &&
              presetIndex < presets.length
            ) {
              const preset = presets[presetIndex];
              if (Array.isArray(preset.endpointCandidates)) {
                preset.endpointCandidates.forEach(addUrl);
              }
            }
          } else if (appId === "gemini") {
            const presets = geminiProviderPresets;
            const presetIndex = parseInt(
              values.presetId.replace("gemini-", ""),
            );
            if (
              !isNaN(presetIndex) &&
              presetIndex >= 0 &&
              presetIndex < presets.length
            ) {
              const preset = presets[presetIndex];
              if (Array.isArray(preset.endpointCandidates)) {
                preset.endpointCandidates.forEach(addUrl);
              }
            }
          }
        }

        if (appId === "claude") {
          const env = parsedConfig.env as Record<string, any> | undefined;
          if (env?.ANTHROPIC_BASE_URL) {
            addUrl(env.ANTHROPIC_BASE_URL);
          }
        } else if (appId === "codex") {
          const config = parsedConfig.config as string | undefined;
          if (config) {
            const extractedBaseUrl = extractCodexBaseUrl(config);
            if (extractedBaseUrl) {
              addUrl(extractedBaseUrl);
            }
          }
        } else if (appId === "gemini") {
          const env = parsedConfig.env as Record<string, any> | undefined;
          if (env?.GOOGLE_GEMINI_BASE_URL) {
            addUrl(env.GOOGLE_GEMINI_BASE_URL);
          }
        } else if (appId === "opencode") {
          const options = parsedConfig.options as
            | Record<string, any>
            | undefined;
          if (options?.baseURL) {
            addUrl(options.baseURL);
          }
        } else if (appId === "openclaw") {
          // OpenClaw uses baseUrl directly
          if (parsedConfig.baseUrl) {
            addUrl(parsedConfig.baseUrl as string);
          }
        }

        const urls = Array.from(urlSet);
        if (urls.length > 0) {
          const now = Date.now();
          const customEndpoints: Record<string, CustomEndpoint> = {};
          urls.forEach((url) => {
            customEndpoints[url] = {
              url,
              addedAt: now,
              lastUsed: undefined,
            };
          });

          providerData.meta = {
            ...(providerData.meta ?? {}),
            custom_endpoints: customEndpoints,
          };
        }
      }

      // OpenClaw: pass suggestedDefaults for model registration
      if (appId === "openclaw" && values.suggestedDefaults) {
        providerData.suggestedDefaults = values.suggestedDefaults;
      }

      await onSubmit(providerData);
      onOpenChange(false);
    },
    [appId, onSubmit, onOpenChange],
  );

  const footer =
    !showUniversalTab || activeTab === "app-specific" ? (
      <>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="border-border/20 hover:bg-accent hover:text-accent-foreground"
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          form="provider-form"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("common.add")}
        </Button>
      </>
    ) : (
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="border-border/20 hover:bg-accent hover:text-accent-foreground"
      >
        {t("common.close", { defaultValue: "关闭" })}
      </Button>
    );

  return (
    <OperationDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={t("provider.addNewProvider")}
      description={t("provider.addProviderDrawerDescription", {
        defaultValue:
          "以分阶段工作台方式完成供应商录入，保留当前列表上下文，同时减少长表单来回滚动成本。",
      })}
      eyebrow={t("provider.providerWorkbench", {
        defaultValue: "Provider Workbench",
      })}
      badge={
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
            {t(`apps.${appId}`)}
          </span>
          <span className="inline-flex items-center rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {showUniversalTab && activeTab === "universal"
              ? t("provider.tabUniversal")
              : t("common.add")}
          </span>
        </div>
      }
      footer={footer}
      testId="provider-add-operation-drawer"
    >
      {showUniversalTab ? (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "app-specific" | "universal")}
          className="space-y-5"
        >
          <TabsList className="grid w-full grid-cols-2 rounded-[24px] border border-border/60 bg-background/55 p-1.5 shadow-[inset_0_1px_0_hsl(var(--background)/0.6)]">
            <TabsTrigger value="app-specific">
              {t(`apps.${appId}`)} {t("provider.tabProvider")}
            </TabsTrigger>
            <TabsTrigger value="universal">
              {t("provider.tabUniversal")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="app-specific" className="mt-0">
            <ProviderForm
              appId={appId}
              submitLabel={t("common.add")}
              onSubmit={handleSubmit}
              onCancel={() => onOpenChange(false)}
              onUniversalPresetSelect={(preset) => {
                setSelectedUniversalPreset(preset);
                setActiveTab("universal");
              }}
              onManageUniversalProviders={() => setActiveTab("universal")}
              showButtons={false}
            />
          </TabsContent>

          <TabsContent value="universal" className="mt-0">
            <UniversalProviderPanel
              initialPreset={selectedUniversalPreset}
              onInitialPresetHandled={() => setSelectedUniversalPreset(null)}
            />
          </TabsContent>
        </Tabs>
      ) : (
        // OpenCode/OpenClaw: directly show form without tabs
        <ProviderForm
          appId={appId}
          submitLabel={t("common.add")}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          showButtons={false}
        />
      )}
    </OperationDrawer>
  );
}
