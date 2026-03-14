import type { TFunction } from "i18next";

export type UniversalProviderWorkbenchTabId =
  | "preset"
  | "basic"
  | "apps"
  | "models"
  | "preview";

export interface UniversalProviderWorkbenchTabDefinition {
  id: UniversalProviderWorkbenchTabId;
  title: string;
  description: string;
  tone: "recommended" | "core" | "optional";
}

export function getUniversalProviderWorkbenchTabs({
  isEditMode,
  hasEnabledApps,
  t,
}: {
  isEditMode: boolean;
  hasEnabledApps: boolean;
  t: TFunction | ((key: string, options?: { defaultValue?: string }) => string);
}): UniversalProviderWorkbenchTabDefinition[] {
  return [
    ...(!isEditMode
      ? [
          {
            id: "preset" as const,
            title: t("universalProvider.selectPreset", {
              defaultValue: "选择预设",
            }),
            description: t("universalProvider.selectPresetHint", {
              defaultValue: "先选网关模板，再继续补充统一配置。",
            }),
            tone: "recommended" as const,
          },
        ]
      : []),
    {
      id: "basic",
      title: t("universalProvider.basicInfo", {
        defaultValue: "基础信息",
      }),
      description: t("universalProvider.basicInfoHint", {
        defaultValue: "配置统一供应商的身份、接入地址和说明信息。",
      }),
      tone: "core",
    },
    {
      id: "apps",
      title: t("universalProvider.enabledApps", {
        defaultValue: "应用映射",
      }),
      description: t("universalProvider.enabledAppsHint", {
        defaultValue: "决定 Claude、Codex 和 Gemini 哪些应用接入该网关。",
      }),
      tone: "core",
    },
    {
      id: "models",
      title: t("universalProvider.modelConfig", {
        defaultValue: "模型配置",
      }),
      description: t("universalProvider.modelConfigHint", {
        defaultValue: "为每个启用应用维护默认模型和协议差异字段。",
      }),
      tone: "core",
    },
    {
      id: "preview",
      title: t("universalProvider.configPreview", {
        defaultValue: "配置预览",
      }),
      description: hasEnabledApps
        ? t("universalProvider.configPreviewHint", {
            defaultValue: "按应用切换查看将要写入各配置文件的最终结构。",
          })
        : t("universalProvider.configPreviewEmptyHint", {
            defaultValue: "至少启用一个应用后，才能查看对应配置预览。",
          }),
      tone: hasEnabledApps ? "optional" : "core",
    },
  ];
}
