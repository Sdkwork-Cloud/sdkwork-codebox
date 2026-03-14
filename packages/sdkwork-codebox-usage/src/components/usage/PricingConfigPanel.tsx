import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModelPricing, useDeleteModelPricing } from "@/lib/query/usage";
import { PricingEditModal } from "./PricingEditModal";
import type { ModelPricing } from "@/types/usage";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { proxyApi } from "@/lib/api/proxy";
import { UsageEmptyState, UsagePill } from "./UsageWorkbench";

const PRICING_APPS = ["claude", "codex", "gemini"] as const;
type PricingApp = (typeof PRICING_APPS)[number];
type PricingModelSource = "request" | "response";

interface AppConfig {
  multiplier: string;
  source: PricingModelSource;
}

type AppConfigState = Record<PricingApp, AppConfig>;

export function PricingConfigPanel() {
  const { t } = useTranslation();
  const { data: pricing, isLoading, error } = useModelPricing();
  const deleteMutation = useDeleteModelPricing();
  const [editingModel, setEditingModel] = useState<ModelPricing | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 三个应用的配置状态
  const [appConfigs, setAppConfigs] = useState<AppConfigState>({
    claude: { multiplier: "1", source: "response" },
    codex: { multiplier: "1", source: "response" },
    gemini: { multiplier: "1", source: "response" },
  });
  const [originalConfigs, setOriginalConfigs] = useState<AppConfigState | null>(
    null,
  );
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 检查是否有改动
  const isDirty =
    originalConfigs !== null &&
    PRICING_APPS.some(
      (app) =>
        appConfigs[app].multiplier !== originalConfigs[app].multiplier ||
        appConfigs[app].source !== originalConfigs[app].source,
    );

  // 加载所有应用的配置
  useEffect(() => {
    let isMounted = true;

    const loadAllConfigs = async () => {
      setIsConfigLoading(true);
      try {
        const results = await Promise.all(
          PRICING_APPS.map(async (app) => {
            const [multiplier, source] = await Promise.all([
              proxyApi.getDefaultCostMultiplier(app),
              proxyApi.getPricingModelSource(app),
            ]);
            return {
              app,
              multiplier,
              source: (source === "request"
                ? "request"
                : "response") as PricingModelSource,
            };
          }),
        );

        if (!isMounted) return;

        const newState: AppConfigState = {
          claude: { multiplier: "1", source: "response" },
          codex: { multiplier: "1", source: "response" },
          gemini: { multiplier: "1", source: "response" },
        };
        for (const result of results) {
          newState[result.app] = {
            multiplier: result.multiplier,
            source: result.source,
          };
        }
        setAppConfigs(newState);
        setOriginalConfigs(newState);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "Unknown error";
        toast.error(
          t("settings.globalProxy.pricingLoadFailed", { error: message }),
        );
      } finally {
        if (isMounted) setIsConfigLoading(false);
      }
    };

    loadAllConfigs();
    return () => {
      isMounted = false;
    };
  }, [t]);

  // 保存所有配置
  const handleSaveAll = async () => {
    // 验证所有倍率
    for (const app of PRICING_APPS) {
      const trimmed = appConfigs[app].multiplier.trim();
      if (!trimmed) {
        toast.error(
          `${t(`apps.${app}`)}: ${t("settings.globalProxy.defaultCostMultiplierRequired")}`,
        );
        return;
      }
      if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
        toast.error(
          `${t(`apps.${app}`)}: ${t("settings.globalProxy.defaultCostMultiplierInvalid")}`,
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      await Promise.all(
        PRICING_APPS.flatMap((app) => [
          proxyApi.setDefaultCostMultiplier(
            app,
            appConfigs[app].multiplier.trim(),
          ),
          proxyApi.setPricingModelSource(app, appConfigs[app].source),
        ]),
      );
      toast.success(t("settings.globalProxy.pricingSaved"));
      setOriginalConfigs({ ...appConfigs });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Unknown error";
      toast.error(
        t("settings.globalProxy.pricingSaveFailed", { error: message }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (modelId: string) => {
    deleteMutation.mutate(modelId, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingModel({
      modelId: "",
      displayName: "",
      inputCostPerMillion: "0",
      outputCostPerMillion: "0",
      cacheReadCostPerMillion: "0",
      cacheCreationCostPerMillion: "0",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-[22px] border border-border/60 bg-background/45 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t("usage.loadPricingError")}: {String(error)}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <UsagePill
          label={t("usage.pricingRuleCount", {
            defaultValue: "定价条目",
          })}
          value={pricing?.length ?? 0}
        />
        <UsagePill
          label={t("usage.pricingDefaultsState", {
            defaultValue: "默认规则",
          })}
          value={
            isDirty
              ? t("common.unsaved", { defaultValue: "未保存" })
              : t("common.saved", { defaultValue: "已同步" })
          }
          tone={isDirty ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.82)_100%)]">
          <header className="border-b border-border/60 bg-background/45 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {t("settings.globalProxy.pricingDefaultsTitle")}
                </h4>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {t("settings.globalProxy.pricingDefaultsDescription")}
                </p>
              </div>
              <Button
                onClick={handleSaveAll}
                disabled={isConfigLoading || isSaving || !isDirty}
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </Button>
            </div>
          </header>

          <div className="space-y-3 p-4">
            {isConfigLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              PRICING_APPS.map((app) => (
                <div
                  key={app}
                  className="space-y-3 rounded-[18px] border border-border/50 bg-background/55 p-4"
                >
                  <div className="text-sm font-semibold text-foreground">
                    {t(`apps.${app}`)}
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {t(
                          "settings.globalProxy.defaultCostMultiplierLabel",
                        )}
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={appConfigs[app].multiplier}
                        onChange={(e) =>
                          setAppConfigs((prev) => ({
                            ...prev,
                            [app]: { ...prev[app], multiplier: e.target.value },
                          }))
                        }
                        disabled={isSaving}
                        placeholder="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {t("settings.globalProxy.pricingModelSourceLabel")}
                      </div>
                      <Select
                        value={appConfigs[app].source}
                        onValueChange={(value) =>
                          setAppConfigs((prev) => ({
                            ...prev,
                            [app]: {
                              ...prev[app],
                              source: value as PricingModelSource,
                            },
                          }))
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="response">
                            {t(
                              "settings.globalProxy.pricingModelSourceResponse",
                            )}
                          </SelectItem>
                          <SelectItem value="request">
                            {t(
                              "settings.globalProxy.pricingModelSourceRequest",
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.82)_100%)]">
          <header className="border-b border-border/60 bg-background/45 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {t("usage.modelPricingDesc")} {t("usage.perMillion")}
                </h4>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {t("usage.modelPricingHint", {
                    defaultValue:
                      "维护模型级成本基线，日志和统计面板会据此回溯总成本与平均成本。",
                  })}
                </p>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddNew();
                }}
                size="sm"
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("common.add")}
              </Button>
            </div>
          </header>

          <div className="p-4">
            {!pricing || pricing.length === 0 ? (
              <UsageEmptyState
                title={t("usage.noPricingData", {
                  defaultValue: "暂无定价数据",
                })}
                description={t("usage.noPricingDataHint", {
                  defaultValue:
                    "从这里新增模型定价后，用量日志与统计报表会自动补齐成本展示。",
                })}
                className="min-h-[260px]"
              />
            ) : (
              <div className="overflow-hidden rounded-[18px] border border-border/50 bg-background/55">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("usage.model")}</TableHead>
                      <TableHead>{t("usage.displayName")}</TableHead>
                      <TableHead className="text-right">
                        {t("usage.inputCost")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("usage.outputCost")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("usage.cacheReadCost")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("usage.cacheWriteCost")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricing.map((model) => (
                      <TableRow key={model.modelId}>
                        <TableCell className="font-mono text-sm">
                          {model.modelId}
                        </TableCell>
                        <TableCell>{model.displayName}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ${model.inputCostPerMillion}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ${model.outputCostPerMillion}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ${model.cacheReadCostPerMillion}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          ${model.cacheCreationCostPerMillion}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setIsAddingNew(false);
                                setEditingModel(model);
                              }}
                              title={t("common.edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(model.modelId)}
                              title={t("common.delete")}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      </div>

      {editingModel && (
        <PricingEditModal
          open={!!editingModel}
          model={editingModel}
          isNew={isAddingNew}
          onClose={() => {
            setEditingModel(null);
            setIsAddingNew(false);
          }}
        />
      )}

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("usage.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("usage.deleteConfirmDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t("common.deleting")
                : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
