import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import JsonEditor from "@/components/JsonEditor";
import { ProviderConfigWorkbench } from "./ProviderConfigWorkbench";
import { useEditorDarkMode } from "./useEditorDarkMode";

interface CommonConfigEditorProps {
  value: string;
  onChange: (value: string) => void;
  useCommonConfig: boolean;
  onCommonConfigToggle: (checked: boolean) => void;
  commonConfigSnippet: string;
  onCommonConfigSnippetChange: (value: string) => void;
  commonConfigError: string;
  onEditClick?: () => void;
  isModalOpen?: boolean;
  onModalClose?: () => void;
  onExtract?: () => void;
  isExtracting?: boolean;
}

export function CommonConfigEditor({
  value,
  onChange,
  useCommonConfig,
  onCommonConfigToggle,
  commonConfigSnippet,
  onCommonConfigSnippetChange,
  commonConfigError,
  onEditClick: _onEditClick,
  isModalOpen: _isModalOpen,
  onModalClose: _onModalClose,
  onExtract,
  isExtracting,
}: CommonConfigEditorProps) {
  const { t } = useTranslation();
  const isDarkMode = useEditorDarkMode();
  const [activeFile, setActiveFile] = useState("settings");

  // Mirror value prop to local state so checkbox toggles and JsonEditor stay in sync.
  // The parent uses form.getValues which doesn't trigger reactive updates on every edit.
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleLocalChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);
      onChange(newValue);
    },
    [onChange],
  );

  const toggleStates = useMemo(() => {
    try {
      const config = JSON.parse(localValue);
      return {
        hideAttribution:
          config?.attribution?.commit === "" && config?.attribution?.pr === "",
        alwaysThinking: config?.alwaysThinkingEnabled === true,
        teammates:
          config?.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === "1" ||
          config?.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === 1,
      };
    } catch {
      return {
        hideAttribution: false,
        alwaysThinking: false,
        teammates: false,
      };
    }
  }, [localValue]);

  const handleToggle = useCallback(
    (toggleKey: string, checked: boolean) => {
      try {
        const config = JSON.parse(localValue || "{}");

        switch (toggleKey) {
          case "hideAttribution":
            if (checked) {
              config.attribution = { commit: "", pr: "" };
            } else {
              delete config.attribution;
            }
            break;
          case "alwaysThinking":
            if (checked) {
              config.alwaysThinkingEnabled = true;
            } else {
              delete config.alwaysThinkingEnabled;
            }
            break;
          case "teammates":
            if (!config.env) config.env = {};
            if (checked) {
              config.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1";
            } else {
              delete config.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
              if (Object.keys(config.env).length === 0) delete config.env;
            }
            break;
        }

        handleLocalChange(JSON.stringify(config, null, 2));
      } catch {
        // Do not mutate the content while JSON is invalid.
      }
    },
    [localValue, handleLocalChange],
  );

  return (
    <ProviderConfigWorkbench
      value={activeFile}
      onValueChange={setActiveFile}
      railHeader={
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            id="useCommonConfig"
            checked={useCommonConfig}
            onChange={(event) => onCommonConfigToggle(event.target.checked)}
            className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 border-border-default rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
          />
          <span>
            {t("claudeConfig.writeCommonConfig", {
              defaultValue: "写入通用配置",
            })}
          </span>
        </label>
      }
      tabs={[
        {
          value: "settings",
          title: "settings.json",
          description: t("provider.configFileSettingsDescription", {
            defaultValue: "维护当前供应商的主配置，并直接检查最终 JSON 结构。",
          }),
          content: (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toggleStates.hideAttribution}
                    onChange={(event) =>
                      handleToggle("hideAttribution", event.target.checked)
                    }
                    className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 border-border-default rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                  />
                  <span>{t("claudeConfig.hideAttribution")}</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toggleStates.alwaysThinking}
                    onChange={(event) =>
                      handleToggle("alwaysThinking", event.target.checked)
                    }
                    className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 border-border-default rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                  />
                  <span>{t("claudeConfig.alwaysThinking")}</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toggleStates.teammates}
                    onChange={(event) =>
                      handleToggle("teammates", event.target.checked)
                    }
                    className="w-4 h-4 text-blue-500 bg-white dark:bg-gray-800 border-border-default rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
                  />
                  <span>{t("claudeConfig.enableTeammates")}</span>
                </label>
              </div>

              <JsonEditor
                value={localValue}
                onChange={handleLocalChange}
                placeholder={`{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-api-endpoint.com",
    "ANTHROPIC_AUTH_TOKEN": "your-api-key-here"
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
        {
          value: "common",
          title: "common snippet",
          description: t("claudeConfig.commonConfigHint", {
            defaultValue:
              "复用的共享片段会在保存时合并到启用它的供应商配置中。",
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
                onChange={onCommonConfigSnippetChange}
                placeholder={`{
  "env": {
    "ANTHROPIC_BASE_URL": "https://your-api-endpoint.com"
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
}
