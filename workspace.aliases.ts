import path from "node:path";

export function createWorkspaceAliases(rootDir: string) {
  const resolveFromRoot = (target: string) => path.resolve(rootDir, target);

  return [
    {
      find: /^@\/types$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-types/src/index.ts",
      ),
    },
    {
      find: /^@\/types\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-types/src/types/$1",
      ),
    },
    {
      find: /^@\/i18n$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-i18n/src/i18n/index.ts",
      ),
    },
    {
      find: /^@\/i18n\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-i18n/src/i18n/$1",
      ),
    },
    {
      find: /^@\/components\/ui\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/components/ui/$1",
      ),
    },
    {
      find: /^@\/components\/common\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/components/common/$1",
      ),
    },
    {
      find:
        /^@\/components\/(theme-provider|JsonEditor|MarkdownEditor|ConfirmDialog|BrandIcons|ColorPicker|IconPicker)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/components/$1",
      ),
    },
    {
      find: /^@\/components\/providers\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-provider/src/components/providers/$1",
      ),
    },
    {
      find: /^@\/components\/ProviderIcon$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/components/ProviderIcon",
      ),
    },
    {
      find: /^@\/components\/openclaw\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-provider/src/components/openclaw/$1",
      ),
    },
    {
      find: /^@\/components\/universal$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-provider/src/components/universal/index.ts",
      ),
    },
    {
      find: /^@\/components\/universal\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-provider/src/components/universal/$1",
      ),
    },
    {
      find: /^@\/components\/settings\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-settings/src/components/settings/$1",
      ),
    },
    {
      find: /^@\/components\/env\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-settings/src/components/env/$1",
      ),
    },
    {
      find: /^@\/components\/(agents|deeplink|mcp|prompts|skills)\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-integration/src/components/$1/$2",
      ),
    },
    {
      find: /^@\/components\/DeepLinkImportDialog$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-integration/src/components/DeepLinkImportDialog",
      ),
    },
    {
      find: /^@\/components\/proxy$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-proxy/src/components/proxy/index.ts",
      ),
    },
    {
      find: /^@\/components\/proxy\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-proxy/src/components/proxy/$1",
      ),
    },
    {
      find: /^@\/components\/sessions\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-workspace/src/components/sessions/$1",
      ),
    },
    {
      find: /^@\/components\/workspace\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-workspace/src/components/workspace/$1",
      ),
    },
    {
      find: /^@\/components\/usage\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-usage/src/components/usage/$1",
      ),
    },
    {
      find: /^@\/components\/(UsageFooter|UsageScriptModal)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-usage/src/components/$1",
      ),
    },
    {
      find: /^@\/hooks\/(useAutoCompact|useLastValidValue)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/hooks/$1",
      ),
    },
    {
      find: /^@\/hooks\/(useDragSort|useOpenClaw|useProviderActions|useStreamCheck)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-provider/src/hooks/$1",
      ),
    },
    {
      find:
        /^@\/hooks\/(useBackupManager|useDirectorySettings|useImportExport|useSettings|useSettingsForm|useSettingsMetadata)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-settings/src/hooks/$1",
      ),
    },
    {
      find: /^@\/hooks\/(useMcp|usePromptActions|useSkills)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-integration/src/hooks/$1",
      ),
    },
    {
      find: /^@\/hooks\/(useGlobalProxy|useProxyConfig|useProxyStatus)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-proxy/src/hooks/$1",
      ),
    },
    {
      find: /^@\/hooks\/useSessionSearch$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-workspace/src/hooks/useSessionSearch",
      ),
    },
    {
      find:
        /^@\/config\/(claudeProviderPresets|codexProviderPresets|codexTemplates|geminiProviderPresets|iconInference|openclawProviderPresets|opencodeProviderPresets|universalProviderPresets)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-provider/src/config/$1",
      ),
    },
    {
      find: /^@\/config\/appConfig$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/config/appConfig",
      ),
    },
    {
      find: /^@\/config\/mcpPresets$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-integration/src/config/mcpPresets",
      ),
    },
    {
      find:
        /^@\/utils\/(codexConfigUtils|domUtils|errorUtils|formatters|textNormalization|uuid)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/utils/$1",
      ),
    },
    {
      find: /^@\/utils\/tomlUtils$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/utils/tomlUtils",
      ),
    },
    {
      find:
        /^@\/utils\/(postChangeSync|providerConfigUtils|providerMetaUtils)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-provider/src/utils/$1",
      ),
    },
    {
      find: /^@\/lib\/utils$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/lib/utils.ts",
      ),
    },
    {
      find: /^@\/lib\/utils\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/lib/utils/$1",
      ),
    },
    {
      find: /^@\/lib\/(api|query|errors|schemas)\/?(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-core/src/lib/$1/$2",
      ),
    },
    {
      find: /^@\/lib\/platform$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-core/src/lib/platform.ts",
      ),
    },
    {
      find: /^@\/lib\/updater$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-core/src/lib/updater.ts",
      ),
    },
    {
      find: /^@\/contexts\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-core/src/contexts/$1",
      ),
    },
    {
      find: /^@\/icons\/(.*)$/,
      replacement: resolveFromRoot(
        "packages/sdkwork-codebox-commons/src/icons/$1",
      ),
    },
    {
      find: /^@\/(.*)$/,
      replacement: resolveFromRoot("src/$1"),
    },
  ];
}
