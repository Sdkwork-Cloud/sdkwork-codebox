import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageSummaryCards } from "./UsageSummaryCards";
import { UsageTrendChart } from "./UsageTrendChart";
import { RequestLogTable } from "./RequestLogTable";
import { ProviderStatsTable } from "./ProviderStatsTable";
import { ModelStatsTable } from "./ModelStatsTable";
import type { TimeRange } from "@/types/usage";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Activity,
  AlarmClock,
  Coins,
  ListFilter,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { usageKeys } from "@/lib/query/usage";
import { PricingConfigPanel } from "@/components/usage/PricingConfigPanel";
import { UsagePanel, UsagePill } from "./UsageWorkbench";

type UsageWorkbenchView = "logs" | "providers" | "models" | "pricing";

export function UsageDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<TimeRange>("1d");
  const [refreshIntervalMs, setRefreshIntervalMs] = useState(30000);
  const [activeView, setActiveView] = useState<UsageWorkbenchView>("logs");

  const refreshIntervalOptionsMs = [0, 5000, 10000, 30000, 60000] as const;
  const changeRefreshInterval = () => {
    const currentIndex = refreshIntervalOptionsMs.indexOf(
      refreshIntervalMs as (typeof refreshIntervalOptionsMs)[number],
    );
    const safeIndex = currentIndex >= 0 ? currentIndex : 3; // default 30s
    const nextIndex = (safeIndex + 1) % refreshIntervalOptionsMs.length;
    const next = refreshIntervalOptionsMs[nextIndex];
    setRefreshIntervalMs(next);
    queryClient.invalidateQueries({ queryKey: usageKeys.all });
  };

  const refreshAllUsageData = () => {
    queryClient.invalidateQueries({ queryKey: usageKeys.all });
  };

  const days = timeRange === "1d" ? 1 : timeRange === "7d" ? 7 : 30;
  const refreshLabel =
    refreshIntervalMs > 0
      ? t("usage.autoRefreshValue", {
          defaultValue: `每 ${refreshIntervalMs / 1000} 秒`,
        })
      : t("usage.autoRefreshOff", {
          defaultValue: "手动刷新",
        });

  const analysisViews: Array<{
    value: UsageWorkbenchView;
    title: string;
    description: string;
    icon: typeof ListFilter;
    content: ReactNode;
  }> = [
    {
      value: "logs",
      title: t("usage.requestLogs"),
      description: t("usage.requestLogsHint", {
        defaultValue: "按时间线审查请求、成本、模型和响应状态。",
      }),
      icon: ListFilter,
      content: <RequestLogTable refreshIntervalMs={refreshIntervalMs} />,
    },
    {
      value: "providers",
      title: t("usage.providerStats"),
      description: t("usage.providerStatsHint", {
        defaultValue: "从供应商维度观察请求量、成功率和平均时延。",
      }),
      icon: Activity,
      content: <ProviderStatsTable refreshIntervalMs={refreshIntervalMs} />,
    },
    {
      value: "models",
      title: t("usage.modelStats"),
      description: t("usage.modelStatsHint", {
        defaultValue: "聚焦模型层的消耗表现，便于做选型和成本比较。",
      }),
      icon: BarChart3,
      content: <ModelStatsTable refreshIntervalMs={refreshIntervalMs} />,
    },
    {
      value: "pricing",
      title: t("settings.advanced.pricing.title"),
      description: t("settings.advanced.pricing.description"),
      icon: Coins,
      content: <PricingConfigPanel />,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-6"
    >
      <section className="relative overflow-hidden rounded-[30px] border border-border/65 bg-[linear-gradient(135deg,hsl(var(--surface-2)/0.98)_0%,hsl(var(--surface-3)/0.95)_52%,hsl(var(--panel-surface)/0.92)_100%)] shadow-[0_28px_70px_-40px_hsl(var(--shadow-color)/0.92)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.18),transparent_46%),radial-gradient(circle_at_bottom_left,hsl(var(--primary)/0.1),transparent_34%)]" />
        <div className="relative flex flex-col gap-6 px-6 py-6 xl:px-7 xl:py-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                {t("usage.workbenchEyebrow", {
                  defaultValue: "Runtime Analytics",
                })}
              </div>
              <div>
                <h2 className="text-[1.85rem] font-semibold tracking-tight text-foreground">
                  {t("usage.title")}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {t("usage.subtitle")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <UsagePill
                  icon={AlarmClock}
                  label={t("usage.currentRange", {
                    defaultValue: "统计窗口",
                  })}
                  value={
                    timeRange === "1d"
                      ? t("usage.today")
                      : timeRange === "7d"
                        ? t("usage.last7days")
                        : t("usage.last30days")
                  }
                />
                <UsagePill
                  icon={RefreshCw}
                  label={t("usage.refreshCadence", {
                    defaultValue: "刷新策略",
                  })}
                  value={refreshLabel}
                  tone={refreshIntervalMs > 0 ? "accent" : "neutral"}
                />
                <UsagePill
                  icon={ShieldCheck}
                  label={t("usage.analysisViews", {
                    defaultValue: "分析视图",
                  })}
                  value={analysisViews.length}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:min-w-[340px] xl:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={changeRefreshInterval}
                  className="gap-2 border-border/60 bg-background/72"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t("usage.autoRefresh", {
                    defaultValue: "自动刷新",
                  })}
                  <span className="rounded-full border border-border/60 bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {refreshLabel}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={refreshAllUsageData}
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  {t("common.refresh", { defaultValue: "刷新" })}
                </Button>
              </div>

              <Tabs
                value={timeRange}
                onValueChange={(v) => setTimeRange(v as TimeRange)}
                className="w-full xl:max-w-[360px]"
              >
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-[18px] border border-border/60 bg-background/68 p-1.5 shadow-[inset_0_1px_0_hsl(var(--background)/0.6)]">
                  <TabsTrigger
                    value="1d"
                    className="rounded-[14px] px-3 py-2 text-sm data-[state=active]:bg-[linear-gradient(180deg,hsl(var(--primary)/0.16)_0%,hsl(var(--panel-surface)/0.95)_100%)] data-[state=active]:text-foreground"
                  >
                    {t("usage.today")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="7d"
                    className="rounded-[14px] px-3 py-2 text-sm data-[state=active]:bg-[linear-gradient(180deg,hsl(var(--primary)/0.16)_0%,hsl(var(--panel-surface)/0.95)_100%)] data-[state=active]:text-foreground"
                  >
                    {t("usage.last7days")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="30d"
                    className="rounded-[14px] px-3 py-2 text-sm data-[state=active]:bg-[linear-gradient(180deg,hsl(var(--primary)/0.16)_0%,hsl(var(--panel-surface)/0.95)_100%)] data-[state=active]:text-foreground"
                  >
                    {t("usage.last30days")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      <UsageSummaryCards days={days} refreshIntervalMs={refreshIntervalMs} />

      <UsageTrendChart days={days} refreshIntervalMs={refreshIntervalMs} />

      <Tabs
        data-testid="usage-dashboard-analysis-tabs"
        value={activeView}
        onValueChange={(value) => setActiveView(value as UsageWorkbenchView)}
        className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]"
      >
        <aside className="xl:sticky xl:top-2 xl:self-start">
          <section className="overflow-hidden rounded-[26px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_24px_58px_-38px_hsl(var(--shadow-color)/0.92)]">
            <header className="border-b border-border/60 bg-background/45 px-4 py-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t("usage.analysisWorkbench", {
                  defaultValue: "分析工作台",
                })}
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t("usage.analysisWorkbenchHint", {
                  defaultValue:
                    "按日志、供应商、模型和定价四个维度切换分析视图。",
                })}
              </p>
            </header>
            <div className="p-2.5">
              <TabsList className="flex w-full flex-col items-stretch gap-2 bg-transparent p-0">
                {analysisViews.map((view) => {
                  const Icon = view.icon;
                  return (
                    <TabsTrigger
                      key={view.value}
                      value={view.value}
                      className="h-auto min-w-0 justify-start rounded-[18px] border border-border/60 bg-background/62 px-3 py-3 text-left whitespace-normal data-[state=active]:border-primary/24 data-[state=active]:bg-[linear-gradient(180deg,hsl(var(--primary)/0.14)_0%,hsl(var(--panel-surface)/0.94)_100%)] data-[state=active]:text-foreground data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-background/82"
                    >
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/82 text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {view.title}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                            {view.description}
                          </span>
                        </span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </section>
        </aside>

        <div className="min-w-0">
          {analysisViews.map((view) => (
            <TabsContent key={view.value} value={view.value} className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                <UsagePanel
                  eyebrow={t("usage.analysisEyebrow", {
                    defaultValue: "Analysis View",
                  })}
                  title={view.title}
                  description={view.description}
                  actions={
                    <div className="flex flex-wrap items-center gap-2">
                      <UsagePill
                        icon={RefreshCw}
                        label={t("usage.refreshCadence", {
                          defaultValue: "刷新策略",
                        })}
                        value={refreshLabel}
                        tone={refreshIntervalMs > 0 ? "accent" : "neutral"}
                      />
                    </div>
                  }
                  bodyClassName="p-4 xl:p-5"
                >
                  {view.content}
                </UsagePanel>
              </motion.div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </motion.div>
  );
}
