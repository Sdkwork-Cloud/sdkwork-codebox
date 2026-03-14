import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import JsonEditor from "@/components/JsonEditor";
import { CodexAuthSection, CodexConfigSection } from "./CodexConfigSections";
import { ProviderConfigWorkbench } from "./ProviderConfigWorkbench";
import { useEditorDarkMode } from "./useEditorDarkMode";

interface CodexConfigEditorProps {
  authValue: string;
  configValue: string;
  onAuthChange: (value: string) => void;
  onConfigChange: (value: string) => void;
  onAuthBlur?: () => void;
  useCommonConfig: boolean;
  onCommonConfigToggle: (checked: boolean) => void;
  commonConfigSnippet: string;
  onCommonConfigSnippetChange: (value: string) => boolean;
  onCommonConfigErrorClear: () => void;
  commonConfigError: string;
  authError: string;
  configError: string;
  onExtract?: () => void;
  isExtracting?: boolean;
}

const CodexConfigEditor: React.FC<CodexConfigEditorProps> = ({
  authValue,
  configValue,
  onAuthChange,
  onConfigChange,
  onAuthBlur,
  useCommonConfig,
  onCommonConfigToggle,
  commonConfigSnippet,
  onCommonConfigSnippetChange,
  onCommonConfigErrorClear,
  commonConfigError,
  authError,
  configError,
  onExtract,
  isExtracting,
}) => {
  const { t } = useTranslation();
  const isDarkMode = useEditorDarkMode();
  const [activeFile, setActiveFile] = useState("auth");

  const handleCommonSnippetChange = useCallback(
    (value: string) => {
      if (commonConfigError) {
        onCommonConfigErrorClear();
      }
      onCommonConfigSnippetChange(value);
    },
    [commonConfigError, onCommonConfigErrorClear, onCommonConfigSnippetChange],
  );

  return (
    <ProviderConfigWorkbench
      value={activeFile}
      onValueChange={setActiveFile}
      railHeader={
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={useCommonConfig}
            onChange={(event) => onCommonConfigToggle(event.target.checked)}
            className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 border-border-default rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
          />
          <span>{t("codexConfig.writeCommonConfig")}</span>
        </label>
      }
      tabs={[
        {
          value: "auth",
          title: "auth.json",
          description: t("codexConfig.authJsonHint"),
          content: (
            <CodexAuthSection
              value={authValue}
              onChange={onAuthChange}
              onBlur={onAuthBlur}
              error={authError}
            />
          ),
        },
        {
          value: "config",
          title: "config.toml",
          description: t("codexConfig.configTomlHint"),
          content: (
            <CodexConfigSection
              value={configValue}
              onChange={onConfigChange}
              useCommonConfig={useCommonConfig}
              onCommonConfigToggle={onCommonConfigToggle}
              onEditCommonConfig={onCommonConfigErrorClear}
              commonConfigError={commonConfigError}
              configError={configError}
              showCommonConfigControls={false}
            />
          ),
        },
        {
          value: "common",
          title: "common.toml",
          description: t("codexConfig.commonTomlHint", {
            defaultValue:
              "集中维护可复用的通用 TOML 片段，并按需写入当前供应商。",
          }),
          actions: onExtract ? (
            <Button
              type="button"
              variant="outline"
              onClick={onExtract}
              disabled={isExtracting}
              className="gap-2"
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("claudeConfig.extractFromCurrent", {
                defaultValue: "从当前编辑内容提取",
              })}
            </Button>
          ) : undefined,
          content: (
            <div className="space-y-3">
              {commonConfigError ? (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {commonConfigError}
                </p>
              ) : null}

              <JsonEditor
                value={commonConfigSnippet}
                onChange={handleCommonSnippetChange}
                placeholder={`model = "gpt-5"

[projects."/path/to/project"]
approval_policy = "never"`}
                darkMode={isDarkMode}
                rows={16}
                showValidation={false}
                language="javascript"
              />
            </div>
          ),
        },
      ]}
    />
  );
};

export default CodexConfigEditor;
