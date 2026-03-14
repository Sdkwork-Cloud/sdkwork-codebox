import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Radar, Save, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getStreamCheckConfig,
  saveStreamCheckConfig,
  type StreamCheckConfig,
} from "@/lib/api/model-test";
import { UsagePill } from "./UsageWorkbench";

export function ModelTestConfigPanel() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    timeoutSecs: "45",
    maxRetries: "2",
    degradedThresholdMs: "6000",
    claudeModel: "claude-haiku-4-5-20251001",
    codexModel: "gpt-5.4@low",
    geminiModel: "gemini-3-pro-preview",
    testPrompt: "Who are you?",
  });

  useEffect(() => {
    void loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getStreamCheckConfig();
      setConfig({
        timeoutSecs: String(data.timeoutSecs),
        maxRetries: String(data.maxRetries),
        degradedThresholdMs: String(data.degradedThresholdMs),
        claudeModel: data.claudeModel,
        codexModel: data.codexModel,
        geminiModel: data.geminiModel,
        testPrompt: data.testPrompt || "Who are you?",
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    const parseNum = (val: string, defaultVal: number) => {
      const n = Number.parseInt(val, 10);
      return Number.isNaN(n) ? defaultVal : n;
    };

    try {
      setIsSaving(true);
      const parsed: StreamCheckConfig = {
        timeoutSecs: parseNum(config.timeoutSecs, 45),
        maxRetries: parseNum(config.maxRetries, 2),
        degradedThresholdMs: parseNum(config.degradedThresholdMs, 6000),
        claudeModel: config.claudeModel,
        codexModel: config.codexModel,
        geminiModel: config.geminiModel,
        testPrompt: config.testPrompt || "Who are you?",
      };
      await saveStreamCheckConfig(parsed);
      toast.success(t("streamCheck.configSaved"), {
        closeButton: true,
      });
    } catch (e) {
      toast.error(t("streamCheck.configSaveFailed") + ": " + String(e));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[22px] border border-border/60 bg-background/45 p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t("streamCheck.eyebrow", {
              defaultValue: "Runtime Diagnostics",
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <UsagePill
              icon={Radar}
              label={t("streamCheck.timeout", {
                defaultValue: "超时",
              })}
              value={`${config.timeoutSecs}s`}
            />
            <UsagePill
              icon={ShieldCheck}
              label={t("streamCheck.maxRetries", {
                defaultValue: "重试",
              })}
              value={config.maxRetries}
            />
            <UsagePill
              icon={Sparkles}
              label={t("streamCheck.degradedThreshold", {
                defaultValue: "降级阈值",
              })}
              value={`${config.degradedThresholdMs}ms`}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("common.save")}
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_320px]">
        <section className="overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.82)_100%)]">
          <header className="border-b border-border/60 bg-background/45 px-5 py-4">
            <h4 className="text-sm font-semibold text-foreground">
              {t("streamCheck.testModels")}
            </h4>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("streamCheck.testModelsHint", {
                defaultValue:
                  "为三条主要运行链路指定探测模型，方便统一执行健康检查与降级判断。",
              })}
            </p>
          </header>

          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="claudeModel">
                  {t("streamCheck.claudeModel")}
                </Label>
                <Input
                  id="claudeModel"
                  value={config.claudeModel}
                  onChange={(e) =>
                    setConfig({ ...config, claudeModel: e.target.value })
                  }
                  placeholder="claude-3-5-haiku-latest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codexModel">{t("streamCheck.codexModel")}</Label>
                <Input
                  id="codexModel"
                  value={config.codexModel}
                  onChange={(e) =>
                    setConfig({ ...config, codexModel: e.target.value })
                  }
                  placeholder="gpt-4o-mini"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="geminiModel">
                  {t("streamCheck.geminiModel")}
                </Label>
                <Input
                  id="geminiModel"
                  value={config.geminiModel}
                  onChange={(e) =>
                    setConfig({ ...config, geminiModel: e.target.value })
                  }
                  placeholder="gemini-1.5-flash"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testPrompt">{t("streamCheck.testPrompt")}</Label>
              <Textarea
                id="testPrompt"
                value={config.testPrompt}
                onChange={(e) =>
                  setConfig({ ...config, testPrompt: e.target.value })
                }
                placeholder="Who are you?"
                rows={4}
                className="min-h-[110px]"
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.82)_100%)]">
          <header className="border-b border-border/60 bg-background/45 px-5 py-4">
            <h4 className="text-sm font-semibold text-foreground">
              {t("streamCheck.checkParams")}
            </h4>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("streamCheck.checkParamsHint", {
                defaultValue:
                  "用统一的超时、重试和降级阈值，稳定判定探测链路是否健康。",
              })}
            </p>
          </header>

          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="timeoutSecs">{t("streamCheck.timeout")}</Label>
              <Input
                id="timeoutSecs"
                type="number"
                min={10}
                max={120}
                value={config.timeoutSecs}
                onChange={(e) =>
                  setConfig({ ...config, timeoutSecs: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRetries">{t("streamCheck.maxRetries")}</Label>
              <Input
                id="maxRetries"
                type="number"
                min={0}
                max={5}
                value={config.maxRetries}
                onChange={(e) =>
                  setConfig({ ...config, maxRetries: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="degradedThresholdMs">
                {t("streamCheck.degradedThreshold")}
              </Label>
              <Input
                id="degradedThresholdMs"
                type="number"
                min={1000}
                max={30000}
                step={1000}
                value={config.degradedThresholdMs}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    degradedThresholdMs: e.target.value,
                  })
                }
              />
            </div>

            <div className="rounded-[18px] border border-border/50 bg-background/55 px-4 py-3 text-xs leading-6 text-muted-foreground">
              {t("streamCheck.panelHint", {
                defaultValue:
                  "这些参数只影响运行检测，不会修改供应商本身的接入配置和主工作流。",
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
