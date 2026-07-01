import type { TFunction } from "i18next";
import type { AppId } from "@/lib/api";

export type ProviderWorkbenchTabId =
  | "preset"
  | "basic"
  | "connection"
  | "config"
  | "advanced";

export interface ProviderWorkbenchTabDefinition {
  id: ProviderWorkbenchTabId;
  title: string;
  description: string;
  tone: "recommended" | "core" | "optional";
}

interface GetProviderWorkbenchTabsOptions {
  appId: AppId;
  isEditMode: boolean;
  hasAdvancedConfig: boolean;
  t: TFunction | ((key: string, options?: { defaultValue?: string }) => string);
}

export function getProviderWorkbenchTabs({
  appId,
  isEditMode,
  hasAdvancedConfig,
  t,
}: GetProviderWorkbenchTabsOptions): ProviderWorkbenchTabDefinition[] {
  const connectionTitle =
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

  const connectionDescription =
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

  return [
    ...(!isEditMode
      ? [
          {
            id: "preset" as const,
            title: t("providerPreset.label", { defaultValue: "选择预设" }),
            description: t("provider.workbench.presetHint", {
              defaultValue: "先选模板，再继续录入核心字段。",
            }),
            tone: "recommended" as const,
          },
        ]
      : []),
    {
      id: "basic",
      title: t("provider.basicInfo", { defaultValue: "基础信息" }),
      description: t("provider.workbench.basicHint", {
        defaultValue: "确认供应商身份、名称、图标和展示信息。",
      }),
      tone: "core",
    },
    {
      id: "connection",
      title: connectionTitle,
      description: connectionDescription,
      tone: "core",
    },
    {
      id: "config",
      title: t("provider.configPreview", {
        defaultValue: "配置文件",
      }),
      description: t("provider.workbench.configHint", {
        defaultValue: "按文件切换编辑与校验最终保存到配置文件的内容。",
      }),
      tone: "core",
    },
    ...(hasAdvancedConfig
      ? [
          {
            id: "advanced" as const,
            title: t("provider.advancedCapabilities", {
              defaultValue: "高级能力",
            }),
            description: t("provider.workbench.advancedHint", {
              defaultValue: "按需启用测速、代理和计费等附加能力。",
            }),
            tone: "optional" as const,
          },
        ]
      : []),
  ];
}

export function getProviderWorkbenchTabForField(
  fieldName: string,
): ProviderWorkbenchTabId {
  switch (fieldName) {
    case "name":
    case "websiteUrl":
    case "notes":
    case "icon":
    case "iconColor":
    case "providerKey":
      return "basic";
    case "settingsConfig":
      return "config";
    case "advanced":
      return "advanced";
    case "connection":
    default:
      return "connection";
  }
}
