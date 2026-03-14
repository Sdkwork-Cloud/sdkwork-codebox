import {
  Activity,
  BookText,
  Bot,
  Boxes,
  ChartColumnBig,
  Cpu,
  FolderOpen,
  History,
  KeyRound,
  LibraryBig,
  Network,
  Settings2,
  Shield,
  Sparkles,
  Waypoints,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { TFunction } from "i18next";
import type { AppId } from "@/lib/api";
import type { Provider, VisibleApps } from "@/types";
import { isLinux, isWindows } from "@/lib/platform";

export type Domain = "products" | "runtime" | "extensions" | "control-center";

export type ProductView =
  | "providers"
  | "sessions"
  | "workspace"
  | "openclawEnv"
  | "openclawTools"
  | "openclawAgents";

export type RuntimeView =
  | "runtimeProxy"
  | "runtimeTakeover"
  | "runtimeFailover"
  | "runtimeUsage"
  | "runtimeDiagnostics";

export type ExtensionView =
  | "prompts"
  | "skills"
  | "skillsDiscovery"
  | "mcp"
  | "agents"
  | "universal";

export type ControlCenterView =
  | "appearance"
  | "general"
  | "dataSync"
  | "directories"
  | "advanced"
  | "about";

export type View =
  | ProductView
  | RuntimeView
  | ExtensionView
  | ControlCenterView;

export interface ProviderConfirmAction {
  provider: Provider;
  action: "remove" | "delete";
}

export interface DomainNavigationItem {
  domain: Domain;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface NavigationTab {
  view: View;
  label: string;
  description: string;
  icon?: LucideIcon;
}

export interface NavigationContext {
  activeApp: AppId;
  activeDomain: Domain;
  view: View;
}

export type DomainViewState = Record<Domain, View>;
export type ProductViewState = Record<AppId, ProductView>;

export const DRAG_BAR_HEIGHT = isWindows() || isLinux() ? 0 : 28;
export const HEADER_HEIGHT = 96;
export const CONTENT_TOP_OFFSET = DRAG_BAR_HEIGHT + HEADER_HEIGHT;

const PRODUCT_STORAGE_KEY = "codebox-last-app";
const DOMAIN_STORAGE_KEY = "codebox-active-domain";
const VIEW_STATE_STORAGE_KEY = "codebox-domain-views";
const PRODUCT_VIEW_STATE_STORAGE_KEY = "codebox-product-views";
const LEGACY_VIEW_STORAGE_KEY = "codebox-last-view";

const VALID_APPS: AppId[] = [
  "claude",
  "codex",
  "gemini",
  "opencode",
  "openclaw",
];

const VALID_DOMAINS: Domain[] = [
  "products",
  "runtime",
  "extensions",
  "control-center",
];

const PRODUCT_VIEWS: ProductView[] = [
  "providers",
  "sessions",
  "workspace",
  "openclawEnv",
  "openclawTools",
  "openclawAgents",
];

const RUNTIME_VIEWS: RuntimeView[] = [
  "runtimeProxy",
  "runtimeTakeover",
  "runtimeFailover",
  "runtimeUsage",
  "runtimeDiagnostics",
];

const EXTENSION_VIEWS: ExtensionView[] = [
  "prompts",
  "skills",
  "skillsDiscovery",
  "mcp",
  "agents",
  "universal",
];

const CONTROL_CENTER_VIEWS: ControlCenterView[] = [
  "appearance",
  "general",
  "dataSync",
  "directories",
  "advanced",
  "about",
];

const VALID_VIEWS: View[] = [
  ...PRODUCT_VIEWS,
  ...RUNTIME_VIEWS,
  ...EXTENSION_VIEWS,
  ...CONTROL_CENTER_VIEWS,
];

const LEGACY_VIEW_MIGRATIONS: Partial<Record<string, View>> = {
  settings: "appearance",
  general: "appearance",
  proxy: "runtimeProxy",
  usage: "runtimeUsage",
  advanced: "directories",
  about: "about",
};

const DEFAULT_DOMAIN: Domain = "products";

const DEFAULT_VIEW_STATE: DomainViewState = {
  products: "providers",
  runtime: "runtimeProxy",
  extensions: "prompts",
  "control-center": "appearance",
};

const DEFAULT_PRODUCT_VIEW_STATE: ProductViewState = {
  claude: "providers",
  codex: "providers",
  gemini: "providers",
  opencode: "providers",
  openclaw: "providers",
};

export const getInitialApp = (): AppId => {
  const saved = localStorage.getItem(PRODUCT_STORAGE_KEY) as AppId | null;
  if (saved && VALID_APPS.includes(saved)) {
    return saved;
  }
  return "claude";
};

export const hasSessionSupport = (appId: AppId) =>
  appId === "claude" ||
  appId === "codex" ||
  appId === "opencode" ||
  appId === "openclaw" ||
  appId === "gemini";

export const getFirstVisibleApp = (visibleApps: VisibleApps): AppId => {
  if (visibleApps.claude) return "claude";
  if (visibleApps.codex) return "codex";
  if (visibleApps.gemini) return "gemini";
  if (visibleApps.opencode) return "opencode";
  if (visibleApps.openclaw) return "openclaw";
  return "claude";
};

export const getDomainForView = (view: View): Domain => {
  if (PRODUCT_VIEWS.includes(view as ProductView)) {
    return "products";
  }
  if (RUNTIME_VIEWS.includes(view as RuntimeView)) {
    return "runtime";
  }
  if (CONTROL_CENTER_VIEWS.includes(view as ControlCenterView)) {
    return "control-center";
  }
  return "extensions";
};

export const isSettingsDomain = (domain: Domain) =>
  domain === "runtime" || domain === "control-center";

export const isProductWorkspaceDomain = (domain: Domain) =>
  domain === "products" || domain === "extensions";

const parseStoredViewState = (): Partial<DomainViewState> => {
  try {
    const raw = localStorage.getItem(VIEW_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<Domain, string>>;
    const sanitized: Partial<DomainViewState> = {};

    for (const domain of VALID_DOMAINS) {
      const candidate =
        LEGACY_VIEW_MIGRATIONS[parsed[domain] ?? ""] ?? parsed[domain];
      if (candidate && VALID_VIEWS.includes(candidate as View)) {
        sanitized[domain] = candidate as View;
      }
    }

    return sanitized;
  } catch (error) {
    console.warn("[navigation] Failed to parse view state from storage", error);
    return {};
  }
};

const parseStoredProductViewState = (): Partial<Record<AppId, View>> => {
  try {
    const raw = localStorage.getItem(PRODUCT_VIEW_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<AppId, string>>;
    const sanitized: Partial<Record<AppId, View>> = {};

    for (const appId of VALID_APPS) {
      const candidate =
        LEGACY_VIEW_MIGRATIONS[parsed[appId] ?? ""] ?? parsed[appId];
      if (candidate && VALID_VIEWS.includes(candidate as View)) {
        sanitized[appId] = candidate as View;
      }
    }

    return sanitized;
  } catch (error) {
    console.warn(
      "[navigation] Failed to parse product view state from storage",
      error,
    );
    return {};
  }
};

const migrateLegacyView = (view: string | null): Partial<DomainViewState> => {
  const migratedView = LEGACY_VIEW_MIGRATIONS[view ?? ""] ?? view;

  if (!migratedView || !VALID_VIEWS.includes(migratedView as View)) {
    return {};
  }

  return {
    [getDomainForView(migratedView as View)]: migratedView as View,
  };
};

export const getAvailableViews = (
  domain: Domain,
  activeApp: AppId,
  hasSkillsSupport: boolean,
): View[] => {
  switch (domain) {
    case "products":
      return [
        "providers",
        ...(activeApp === "openclaw" ? (["workspace"] as View[]) : []),
        ...(activeApp === "openclaw"
          ? (["openclawEnv", "openclawTools", "openclawAgents"] as View[])
          : []),
        ...(hasSessionSupport(activeApp) ? (["sessions"] as View[]) : []),
      ];
    case "runtime":
      return [...RUNTIME_VIEWS];
    case "extensions":
      return [
        "prompts",
        ...(hasSkillsSupport ? (["skills", "skillsDiscovery"] as View[]) : []),
        "mcp",
        "agents",
        "universal",
      ];
    case "control-center":
      return [...CONTROL_CENTER_VIEWS];
  }
};

export const resolveViewForDomain = (
  domain: Domain,
  requestedView: View | undefined,
  activeApp: AppId,
  hasSkillsSupport: boolean,
): View => {
  const availableViews = getAvailableViews(domain, activeApp, hasSkillsSupport);
  if (requestedView && availableViews.includes(requestedView)) {
    return requestedView;
  }
  return availableViews[0] ?? DEFAULT_VIEW_STATE[domain];
};

export const normalizeProductViewState = (
  viewState: Partial<Record<AppId, View>>,
  hasSkillsSupport: boolean,
): ProductViewState => ({
  claude: resolveViewForDomain(
    "products",
    viewState.claude,
    "claude",
    hasSkillsSupport,
  ) as ProductView,
  codex: resolveViewForDomain(
    "products",
    viewState.codex,
    "codex",
    hasSkillsSupport,
  ) as ProductView,
  gemini: resolveViewForDomain(
    "products",
    viewState.gemini,
    "gemini",
    hasSkillsSupport,
  ) as ProductView,
  opencode: resolveViewForDomain(
    "products",
    viewState.opencode,
    "opencode",
    hasSkillsSupport,
  ) as ProductView,
  openclaw: resolveViewForDomain(
    "products",
    viewState.openclaw,
    "openclaw",
    hasSkillsSupport,
  ) as ProductView,
});

export const normalizeViewState = (
  activeApp: AppId,
  viewState: Partial<DomainViewState>,
  hasSkillsSupport: boolean,
): DomainViewState => ({
  products: resolveViewForDomain(
    "products",
    viewState.products,
    activeApp,
    hasSkillsSupport,
  ),
  runtime: resolveViewForDomain(
    "runtime",
    viewState.runtime,
    activeApp,
    hasSkillsSupport,
  ),
  extensions: resolveViewForDomain(
    "extensions",
    viewState.extensions,
    activeApp,
    hasSkillsSupport,
  ),
  "control-center": resolveViewForDomain(
    "control-center",
    viewState["control-center"],
    activeApp,
    hasSkillsSupport,
  ),
});

export const getInitialDomain = (
  activeApp: AppId,
  hasSkillsSupport: boolean,
): Domain => {
  const saved = localStorage.getItem(DOMAIN_STORAGE_KEY) as Domain | null;
  const legacyView = localStorage.getItem(LEGACY_VIEW_STORAGE_KEY);
  const legacyViewState = migrateLegacyView(legacyView);
  const viewState = normalizeViewState(
    activeApp,
    {
      ...DEFAULT_VIEW_STATE,
      ...parseStoredViewState(),
      ...legacyViewState,
    },
    hasSkillsSupport,
  );

  if (saved && VALID_DOMAINS.includes(saved)) {
    return saved;
  }

  const legacyDomain =
    (Object.keys(legacyViewState)[0] as Domain | undefined) ?? null;
  if (legacyDomain && viewState[legacyDomain]) {
    return legacyDomain;
  }

  return DEFAULT_DOMAIN;
};

export const getInitialViewState = (
  activeApp: AppId,
  hasSkillsSupport: boolean,
): DomainViewState =>
  normalizeViewState(
    activeApp,
    {
      ...DEFAULT_VIEW_STATE,
      ...parseStoredViewState(),
      ...migrateLegacyView(localStorage.getItem(LEGACY_VIEW_STORAGE_KEY)),
      products: getInitialProductViewState(hasSkillsSupport)[activeApp],
    },
    hasSkillsSupport,
  );

export const getInitialProductViewState = (
  hasSkillsSupport: boolean,
): ProductViewState => {
  const legacyProductView =
    migrateLegacyView(localStorage.getItem(LEGACY_VIEW_STORAGE_KEY)).products ??
    parseStoredViewState().products;

  const legacyProductState = legacyProductView
    ? VALID_APPS.reduce<Partial<Record<AppId, View>>>((accumulator, appId) => {
        accumulator[appId] = legacyProductView;
        return accumulator;
      }, {})
    : {};

  return normalizeProductViewState(
    {
      ...DEFAULT_PRODUCT_VIEW_STATE,
      ...legacyProductState,
      ...parseStoredProductViewState(),
    },
    hasSkillsSupport,
  );
};

export const persistNavigationState = (
  activeDomain: Domain,
  viewState: DomainViewState,
  productViewState?: ProductViewState,
) => {
  localStorage.setItem(DOMAIN_STORAGE_KEY, activeDomain);
  localStorage.setItem(VIEW_STATE_STORAGE_KEY, JSON.stringify(viewState));
  if (productViewState) {
    localStorage.setItem(
      PRODUCT_VIEW_STATE_STORAGE_KEY,
      JSON.stringify(productViewState),
    );
  }
};

export const getBackView = (view: View): View =>
  view === "skillsDiscovery" ? "skills" : "providers";

export const getPrimaryView = (view: View): View =>
  view === "skillsDiscovery" ? "skills" : view;

export const getDomainTitle = (domain: Domain, t: TFunction): string => {
  switch (domain) {
    case "products":
      return t("shell.domain.products", { defaultValue: "产品" });
    case "runtime":
      return t("shell.domain.runtime", { defaultValue: "Runtime" });
    case "extensions":
      return t("shell.domain.extensions", { defaultValue: "Extensions" });
    case "control-center":
      return t("shell.domain.controlCenter", { defaultValue: "控制中心" });
  }
};

export const getDomainDescription = (domain: Domain, t: TFunction): string => {
  switch (domain) {
    case "products":
      return t("shell.domain.productsDescription", {
        defaultValue: "管理供应商、会话与工作区上下文。",
      });
    case "runtime":
      return t("shell.domain.runtimeDescription", {
        defaultValue: "控制代理入口、接管、故障转移、用量与诊断链路。",
      });
    case "extensions":
      return t("shell.domain.extensionsDescription", {
        defaultValue: "统一整理 Prompts、Skills 与 MCP 能力。",
      });
    case "control-center":
      return t("shell.domain.controlCenterDescription", {
        defaultValue: "维护外观、目录、同步与桌面级系统设置。",
      });
  }
};

export const getViewTitle = (
  view: View,
  activeApp: AppId,
  t: TFunction,
): string => {
  switch (view) {
    case "providers":
      return t("common.providers", { defaultValue: "供应商" });
    case "sessions":
      return t("sessionManager.title", { defaultValue: "会话管理" });
    case "workspace":
      return t("workspace.title", { defaultValue: "Workspace" });
    case "openclawEnv":
      return t("openclaw.env.title", { defaultValue: "环境变量" });
    case "openclawTools":
      return t("openclaw.tools.title", { defaultValue: "工具权限" });
    case "openclawAgents":
      return t("openclaw.agents.title", { defaultValue: "Agents 配置" });
    case "runtimeProxy":
      return t("shell.runtime.proxy", { defaultValue: "Proxy" });
    case "runtimeTakeover":
      return t("shell.runtime.takeover", { defaultValue: "Takeover" });
    case "runtimeFailover":
      return t("shell.runtime.failover", { defaultValue: "Failover" });
    case "runtimeUsage":
      return t("shell.runtime.usage", { defaultValue: "Usage" });
    case "runtimeDiagnostics":
      return t("shell.runtime.diagnostics", { defaultValue: "Diagnostics" });
    case "prompts":
      return t("prompts.title", {
        appName: t(`apps.${activeApp}`),
        defaultValue: "Prompts",
      });
    case "skills":
      return t("skills.title", { defaultValue: "Skills" });
    case "skillsDiscovery":
      return t("skills.discover", { defaultValue: "发现 Skills" });
    case "mcp":
      return t("mcp.unifiedPanel.title", { defaultValue: "MCP" });
    case "agents":
      return t("agents.title", { defaultValue: "Agents" });
    case "universal":
      return t("universalProvider.title", { defaultValue: "统一供应商" });
    case "appearance":
      return t("settings.controlCenter.appearance", { defaultValue: "外观" });
    case "general":
      return t("settings.controlCenter.general", { defaultValue: "通用" });
    case "dataSync":
      return t("settings.controlCenter.dataSync", {
        defaultValue: "数据与同步",
      });
    case "directories":
      return t("settings.controlCenter.directories", { defaultValue: "目录" });
    case "advanced":
      return t("settings.controlCenter.advanced", { defaultValue: "高级" });
    case "about":
      return t("settings.controlCenter.about", { defaultValue: "关于" });
  }
};

export const getViewDescription = (
  view: View,
  activeApp: AppId,
  t: TFunction,
): string => {
  switch (view) {
    case "providers":
      return t("provider.addProviderHint", {
        defaultValue: "管理供应商、实时配置与切换策略。",
      });
    case "sessions":
      return t("sessionManager.searchPlaceholder", {
        defaultValue: "浏览历史会话并恢复工作流上下文。",
      });
    case "workspace":
      return t("workspace.manage", {
        defaultValue: "统一维护工作区文件、记忆与长期上下文。",
      });
    case "openclawEnv":
      return t("openclaw.env.description", {
        defaultValue: "维护 OpenClaw 环境变量和密钥配置。",
      });
    case "openclawTools":
      return t("openclaw.tools.description", {
        defaultValue: "审查允许与拒绝的工具权限策略。",
      });
    case "openclawAgents":
      return t("openclaw.agents.description", {
        defaultValue: "定义默认模型、权限与运行参数。",
      });
    case "runtimeProxy":
      return t("shell.runtime.proxyDescription", {
        defaultValue: "集中维护代理服务入口、监听地址与基础运行参数。",
      });
    case "runtimeTakeover":
      return t("shell.runtime.takeoverDescription", {
        defaultValue:
          "逐个产品控制流量接管开关，让代理按你的运行策略接管请求。",
      });
    case "runtimeFailover":
      return t("shell.runtime.failoverDescription", {
        defaultValue: "按队列和优先级维护自动故障转移与熔断恢复策略。",
      });
    case "runtimeUsage":
      return t("shell.runtime.usageDescription", {
        defaultValue: "查看 Provider、模型和日志维度的运行用量。",
      });
    case "runtimeDiagnostics":
      return t("shell.runtime.diagnosticsDescription", {
        defaultValue: "集中验证模型测试、日志级别和本地运行诊断。",
      });
    case "prompts":
      return t("prompts.description", {
        defaultValue: `为 ${t(`apps.${activeApp}`)} 整理高频提示词和模板。`,
      });
    case "skills":
      return t("skills.description", {
        defaultValue: "统一管理技能来源、导入与发现流程。",
      });
    case "skillsDiscovery":
      return t("skills.discoverDescription", {
        defaultValue: "浏览可安装技能并管理仓库来源。",
      });
    case "mcp":
      return t("mcp.unifiedPanel.title", {
        defaultValue: "维护 MCP 服务、连接与导入流程。",
      });
    case "agents":
      return t("agents.description", {
        defaultValue: "配置代理式工作流与自动化策略。",
      });
    case "universal":
      return t("universalProvider.description", {
        defaultValue: "从统一供应商中心维护跨产品配置。",
      });
    case "appearance":
      return t("shell.controlCenter.appearanceDescription", {
        defaultValue: "调整主题模式、色板、密度与动效偏好。",
      });
    case "general":
      return t("shell.controlCenter.generalDescription", {
        defaultValue: "管理语言、窗口行为、产品可见性与桌面集成。",
      });
    case "dataSync":
      return t("shell.controlCenter.dataSyncDescription", {
        defaultValue: "管理导入导出、备份策略与 WebDAV 同步。",
      });
    case "directories":
      return t("shell.controlCenter.directoriesDescription", {
        defaultValue: "维护应用配置目录和产品配置目录覆盖。",
      });
    case "advanced":
      return t("shell.controlCenter.advancedDescription", {
        defaultValue: "管理终端、技能同步等高级桌面偏好。",
      });
    case "about":
      return t("shell.controlCenter.aboutDescription", {
        defaultValue: "查看版本、环境与桌面运行信息。",
      });
  }
};

export const getDomainNavigationItems = (
  t: TFunction,
): DomainNavigationItem[] => [
  {
    domain: "products",
    label: getDomainTitle("products", t),
    description: t("shell.domain.productsHint", {
      defaultValue: "Providers / Sessions / Workspace",
    }),
    icon: Boxes,
  },
  {
    domain: "runtime",
    label: getDomainTitle("runtime", t),
    description: t("shell.domain.runtimeHint", {
      defaultValue: "Proxy / Takeover / Failover / Usage / Diagnostics",
    }),
    icon: ChartColumnBig,
  },
  {
    domain: "extensions",
    label: getDomainTitle("extensions", t),
    description: t("shell.domain.extensionsHint", {
      defaultValue: "Prompts / Skills / MCP / Agents / Universal",
    }),
    icon: LibraryBig,
  },
  {
    domain: "control-center",
    label: getDomainTitle("control-center", t),
    description: t("shell.domain.controlCenterHint", {
      defaultValue: "Appearance / General / Data / Directories / About",
    }),
    icon: Settings2,
  },
];

export const getNavigationTabs = (
  activeDomain: Domain,
  activeApp: AppId,
  hasSkillsSupport: boolean,
  currentView: View,
  t: TFunction,
): NavigationTab[] => {
  const productTabs: NavigationTab[] =
    activeApp === "openclaw"
      ? [
          {
            view: "providers",
            label: t("common.providers", { defaultValue: "供应商" }),
            description: t("shell.products.providersHint", {
              defaultValue: "切换、排序与维护当前产品的供应商。",
            }),
            icon: Sparkles,
          },
          {
            view: "workspace",
            label: t("workspace.title", { defaultValue: "Workspace" }),
            description: t("shell.products.workspaceHint", {
              defaultValue: "维护工作区文件与记忆资产。",
            }),
            icon: FolderOpen,
          },
          {
            view: "openclawEnv",
            label: t("openclaw.env.title", { defaultValue: "环境变量" }),
            description: t("shell.products.openclawEnvHint", {
              defaultValue: "环境变量与密钥。",
            }),
            icon: KeyRound,
          },
          {
            view: "openclawTools",
            label: t("openclaw.tools.title", { defaultValue: "工具权限" }),
            description: t("shell.products.openclawToolsHint", {
              defaultValue: "工具权限与执行范围。",
            }),
            icon: Shield,
          },
          {
            view: "openclawAgents",
            label: t("openclaw.agents.title", {
              defaultValue: "Agents 配置",
            }),
            description: t("shell.products.openclawAgentsHint", {
              defaultValue: "默认模型与运行参数。",
            }),
            icon: Cpu,
          },
          ...(hasSessionSupport(activeApp)
            ? [
                {
                  view: "sessions" as const,
                  label: t("sessionManager.title", {
                    defaultValue: "会话管理",
                  }),
                  description: t("shell.products.sessionsHint", {
                    defaultValue: "查看会话历史与恢复上下文。",
                  }),
                  icon: History,
                },
              ]
            : []),
        ]
      : [
          {
            view: "providers",
            label: t("common.providers", { defaultValue: "供应商" }),
            description: t("shell.products.providersHint", {
              defaultValue: "切换、排序与维护当前产品的供应商。",
            }),
            icon: Sparkles,
          },
          ...(hasSkillsSupport
            ? [
                {
                  view: "skills" as const,
                  label: t("skills.title", { defaultValue: "Skills" }),
                  description: t("shell.extensions.skillsHint", {
                    defaultValue: "安装、导入与发现技能。",
                  }),
                  icon: Wrench,
                },
              ]
            : []),
          {
            view: "prompts",
            label: t("prompts.title", {
              appName: t(`apps.${activeApp}`),
              defaultValue: "Prompts",
            }),
            description: t("shell.extensions.promptsHint", {
              defaultValue: "高频提示词与模板。",
            }),
            icon: BookText,
          },
          ...(hasSessionSupport(activeApp)
            ? [
                {
                  view: "sessions" as const,
                  label: t("sessionManager.title", {
                    defaultValue: "会话管理",
                  }),
                  description: t("shell.products.sessionsHint", {
                    defaultValue: "查看会话历史与恢复上下文。",
                  }),
                  icon: History,
                },
              ]
            : []),
          {
            view: "mcp",
            label: t("mcp.title", { defaultValue: "MCP" }),
            description: t("shell.extensions.mcpHint", {
              defaultValue: "MCP 服务与连接配置。",
            }),
            icon: Network,
          },
          {
            view: "agents",
            label: t("agents.title", { defaultValue: "Agents" }),
            description: t("shell.extensions.agentsHint", {
              defaultValue: "代理式工作流与自动化入口。",
            }),
            icon: Bot,
          },
          {
            view: "universal",
            label: t("universalProvider.title", {
              defaultValue: "统一供应商",
            }),
            description: t("shell.extensions.universalHint", {
              defaultValue: "跨产品共享的统一供应商中心。",
            }),
            icon: Boxes,
          },
        ];

  const auxiliaryExtensionTabs: NavigationTab[] = [
    {
      view: "prompts",
      label: t("prompts.title", {
        appName: t(`apps.${activeApp}`),
        defaultValue: "Prompts",
      }),
      description: t("shell.extensions.promptsHint", {
        defaultValue: "高频提示词与模板。",
      }),
      icon: BookText,
    },
    ...(hasSkillsSupport
      ? [
          {
            view: "skills" as const,
            label: t("skills.title", { defaultValue: "Skills" }),
            description: t("shell.extensions.skillsHint", {
              defaultValue: "安装、导入与发现技能。",
            }),
            icon: Wrench,
          },
        ]
      : []),
    {
      view: "mcp",
      label: t("mcp.title", { defaultValue: "MCP" }),
      description: t("shell.extensions.mcpHint", {
        defaultValue: "MCP 服务与连接配置。",
      }),
      icon: Network,
    },
    {
      view: "agents",
      label: t("agents.title", { defaultValue: "Agents" }),
      description: t("shell.extensions.agentsHint", {
        defaultValue: "代理式工作流与自动化入口。",
      }),
      icon: Bot,
    },
    {
      view: "universal",
      label: t("universalProvider.title", {
        defaultValue: "统一供应商",
      }),
      description: t("shell.extensions.universalHint", {
        defaultValue: "跨产品共享的统一供应商中心。",
      }),
      icon: Boxes,
    },
  ];

  const primaryView = getPrimaryView(currentView);

  if (activeDomain === "products") {
    return productTabs;
  }

  if (activeDomain === "extensions") {
    return productTabs.some((tab) => tab.view === primaryView)
      ? productTabs
      : auxiliaryExtensionTabs;
  }

  switch (activeDomain) {
    case "runtime":
      return [
        {
          view: "runtimeProxy",
          label: t("shell.runtime.proxy", { defaultValue: "Proxy" }),
          description: t("shell.runtime.proxyHint", {
            defaultValue: "代理入口与基础运行参数。",
          }),
          icon: Waypoints,
        },
        {
          view: "runtimeTakeover",
          label: t("shell.runtime.takeover", { defaultValue: "Takeover" }),
          description: t("shell.runtime.takeoverHint", {
            defaultValue: "逐产品控制代理接管。",
          }),
          icon: Activity,
        },
        {
          view: "runtimeFailover",
          label: t("shell.runtime.failover", { defaultValue: "Failover" }),
          description: t("shell.runtime.failoverHint", {
            defaultValue: "故障转移队列与自动切换策略。",
          }),
          icon: Network,
        },
        {
          view: "runtimeUsage",
          label: t("shell.runtime.usage", { defaultValue: "Usage" }),
          description: t("shell.runtime.usageHint", {
            defaultValue: "运行用量与日志指标。",
          }),
          icon: ChartColumnBig,
        },
        {
          view: "runtimeDiagnostics",
          label: t("shell.runtime.diagnostics", {
            defaultValue: "诊断",
          }),
          description: t("shell.runtime.diagnosticsHint", {
            defaultValue: "模型检测与日志配置。",
          }),
          icon: Settings2,
        },
      ];
    case "control-center":
      return [];
  }
};

export const getDomainAccentIcon = (domain: Domain): LucideIcon => {
  switch (domain) {
    case "products":
      return Sparkles;
    case "runtime":
      return Waypoints;
    case "extensions":
      return Wrench;
    case "control-center":
      return Settings2;
  }
};
