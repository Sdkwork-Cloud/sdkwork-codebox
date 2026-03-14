import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import JsonEditor from "@/components/JsonEditor";
import { GeminiEnvSection, GeminiConfigSection } from "./GeminiConfigSections";
import { ProviderConfigWorkbench } from "./ProviderConfigWorkbench";
import { useEditorDarkMode } from "./useEditorDarkMode";

interface GeminiConfigEditorProps {
  envValue: string;
  configValue: string;
  onEnvChange: (value: string) => void;
  onConfigChange: (value: string) => void;
  onEnvBlur?: () => void;
  useCommonConfig: boolean;
  onCommonConfigToggle: (checked: boolean) => void;
  commonConfigSnippet: string;
  onCommonConfigSnippetChange: (value: string) => boolean;
  onCommonConfigErrorClear: () => void;
  commonConfigError: string;
  envError: string;
  configError: string;
  onExtract?: () => void;
  isExtracting?: boolean;
}

const GeminiConfigEditor: React.FC<GeminiConfigEditorProps> = ({
  envValue,
  configValue,
  onEnvChange,
  onConfigChange,
  onEnvBlur,
  useCommonConfig,
  onCommonConfigToggle,
  commonConfigSnippet,
  onCommonConfigSnippetChange,
  onCommonConfigErrorClear,
  commonConfigError,
  envError,
  configError,
  onExtract,
  isExtracting,
}) => {
  const { t } = useTranslation();
  const isDarkMode = useEditorDarkMode();
  const [activeFile, setActiveFile] = useState("env");

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
          <span>
            {t("geminiConfig.writeCommonConfig", {
              defaultValue: "写入通用配置",
            })}
          </span>
        </label>
      }
      tabs={[
        {
          value: "env",
          title: ".env",
          description: t("geminiConfig.envFileHint", {
            defaultValue: "使用 .env 格式维护 Gemini 的接入环境变量。",
          }),
          content: (
            <GeminiEnvSection
              value={envValue}
              onChange={onEnvChange}
              onBlur={onEnvBlur}
              error={envError}
              useCommonConfig={useCommonConfig}
              onCommonConfigToggle={onCommonConfigToggle}
              onEditCommonConfig={onCommonConfigErrorClear}
              commonConfigError={commonConfigError}
              showCommonConfigControls={false}
            />
          ),
        },
        {
          value: "config",
          title: "config.json",
          description: t("geminiConfig.configJsonHint", {
            defaultValue: "维护额外的 JSON 配置，和环境变量分离编辑更直观。",
          }),
          content: (
            <GeminiConfigSection
              value={configValue}
              onChange={onConfigChange}
              configError={configError}
            />
          ),
        },
        {
          value: "common",
          title: "common snippet",
          description: t("geminiConfig.commonSnippetHint", {
            defaultValue:
              "复用共享 JSON 片段，避免在多个 Gemini 供应商之间重复配置。",
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
                placeholder={`{
  "timeout": 30000,
  "proxy": {
    "enabled": true
  }
}`}
                darkMode={isDarkMode}
                rows={16}
                showValidation={true}
                language="json"
              />
            </div>
          ),
        },
      ]}
    />
  );
};

export default GeminiConfigEditor;
