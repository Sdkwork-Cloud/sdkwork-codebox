import { z } from "zod";

const directorySchema = z
  .string()
  .trim()
  .min(1, "路径不能为空")
  .optional()
  .or(z.literal(""));

export const settingsSchema = z.object({
  // 设备级 UI 设置
  showInTray: z.boolean(),
  minimizeToTrayOnClose: z.boolean(),
  enableClaudePluginIntegration: z.boolean().optional(),
  skipClaudeOnboarding: z.boolean().optional(),
  launchOnStartup: z.boolean().optional(),
  silentStartup: z.boolean().optional(),
  enableLocalProxy: z.boolean().optional(),
  proxyConfirmed: z.boolean().optional(),
  usageConfirmed: z.boolean().optional(),
  streamCheckConfirmed: z.boolean().optional(),
  enableFailoverToggle: z.boolean().optional(),
  failoverConfirmed: z.boolean().optional(),
  autoSyncConfirmed: z.boolean().optional(),
  language: z.enum(["en", "zh", "ja"]).optional(),
  themeMode: z.enum(["light", "dark", "system"]).optional(),
  themePalette: z
    .enum(["lobster", "tech-blue", "green-tech", "zinc", "violet", "rose"])
    .optional(),
  uiDensity: z.enum(["comfortable", "compact"]).optional(),
  motionPreference: z.enum(["full", "reduced", "system"]).optional(),
  visibleApps: z
    .object({
      claude: z.boolean(),
      codex: z.boolean(),
      gemini: z.boolean(),
      opencode: z.boolean(),
      openclaw: z.boolean(),
    })
    .optional(),

  // 设备级目录覆盖
  claudeConfigDir: directorySchema.nullable().optional(),
  codexConfigDir: directorySchema.nullable().optional(),
  geminiConfigDir: directorySchema.nullable().optional(),
  opencodeConfigDir: directorySchema.nullable().optional(),
  openclawConfigDir: directorySchema.nullable().optional(),

  // 当前供应商 ID（设备级）
  currentProviderClaude: z.string().optional(),
  currentProviderCodex: z.string().optional(),
  currentProviderGemini: z.string().optional(),
  currentProviderOpencode: z.string().optional(),
  currentProviderOpenclaw: z.string().optional(),

  // Skill 同步设置
  skillSyncMethod: z.enum(["auto", "symlink", "copy"]).optional(),

  // 备份策略设置
  backupIntervalHours: z.number().int().nonnegative().optional(),
  backupRetainCount: z.number().int().nonnegative().optional(),

  // 终端设置
  preferredTerminal: z.string().optional(),

  // WebDAV v2 同步设置（通过专用命令保存，schema 仅用于读取）
  webdavSync: z
    .object({
      enabled: z.boolean().optional(),
      autoSync: z.boolean().optional(),
      baseUrl: z.string().trim().optional().or(z.literal("")),
      username: z.string().trim().optional().or(z.literal("")),
      password: z.string().optional(),
      remoteRoot: z.string().trim().optional().or(z.literal("")),
      profile: z.string().trim().optional().or(z.literal("")),
      status: z
        .object({
          lastSyncAt: z.number().nullable().optional(),
          lastError: z.string().nullable().optional(),
          lastErrorSource: z.string().nullable().optional(),
          lastRemoteEtag: z.string().nullable().optional(),
          lastLocalManifestHash: z.string().nullable().optional(),
          lastRemoteManifestHash: z.string().nullable().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;
