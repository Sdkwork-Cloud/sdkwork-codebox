import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Loader2, TrendingUp } from "lucide-react";
import { useUsageTrends } from "@/lib/query/usage";
import {
  fmtInt,
  fmtUsd,
  getLocaleFromLanguage,
  parseFiniteNumber,
} from "./format";
import { UsageEmptyState, UsagePanel, UsagePill } from "./UsageWorkbench";

interface UsageTrendChartProps {
  days: number;
  refreshIntervalMs: number;
}

const CHART_COLORS = {
  input: "hsl(var(--primary))",
  output: "hsl(var(--shell-glow-secondary))",
  cacheCreation: "hsl(35 95% 56%)",
  cacheRead: "hsl(162 71% 40%)",
  cost: "hsl(347 89% 60%)",
};

function TrendLegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/55 px-3 py-1.5 text-xs font-medium text-foreground">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

export function UsageTrendChart({
  days,
  refreshIntervalMs,
}: UsageTrendChartProps) {
  const { t, i18n } = useTranslation();
  const { data: trends, isLoading } = useUsageTrends(days, {
    refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
  });

  const language = i18n.resolvedLanguage || i18n.language || "en";
  const dateLocale = getLocaleFromLanguage(language);
  const isToday = days === 1;

  const displayData = useMemo(
    () =>
      trends?.map((stat) => {
        const pointDate = new Date(stat.date);
        const cost = parseFiniteNumber(stat.totalCost);

        return {
          rawDate: stat.date,
          label: isToday
            ? pointDate.toLocaleString(dateLocale, {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : pointDate.toLocaleDateString(dateLocale, {
                month: "2-digit",
                day: "2-digit",
              }),
          inputTokens: stat.totalInputTokens,
          outputTokens: stat.totalOutputTokens,
          cacheCreationTokens: stat.totalCacheCreationTokens,
          cacheReadTokens: stat.totalCacheReadTokens,
          cost: cost ?? null,
        };
      }) ?? [],
    [dateLocale, isToday, trends],
  );

  const rangeLabel = isToday
    ? t("usage.rangeToday", { defaultValue: "今天 (按小时)" })
    : days === 7
      ? t("usage.rangeLast7Days", { defaultValue: "过去 7 天" })
      : t("usage.rangeLast30Days", { defaultValue: "过去 30 天" });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) {
      return null;
    }

    return (
      <div className="rounded-[18px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.92)_100%)] p-3 shadow-[0_20px_46px_-34px_hsl(var(--shadow-color)/0.95)]">
        <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any) => (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-semibold text-foreground">
                {entry.dataKey === "cost"
                  ? fmtUsd(entry.value, 6)
                  : fmtInt(entry.value, dateLocale)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-[26px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)]">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <UsagePanel
      eyebrow={t("usage.analysisEyebrow", {
        defaultValue: "Analysis View",
      })}
      title={t("usage.trends", { defaultValue: "使用趋势" })}
      description={t("usage.trendPanelDescription", {
        defaultValue:
          "把请求、Token 和成本放到同一条时间轴上看，更容易发现异常峰值、趋势拐点和缓存命中变化。",
      })}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <UsagePill
            icon={Activity}
            label={t("usage.currentRange", {
              defaultValue: "统计窗口",
            })}
            value={rangeLabel}
          />
          <UsagePill
            icon={TrendingUp}
            label={t("usage.dataPoints", {
              defaultValue: "数据点",
            })}
            value={displayData.length}
            tone="accent"
          />
        </div>
      }
      bodyClassName="p-4 xl:p-5"
    >
      {displayData.length === 0 ? (
        <UsageEmptyState
          title={t("usage.noTrendData", { defaultValue: "暂无趋势数据" })}
          description={t("usage.noTrendDataHint", {
            defaultValue:
              "当前时间窗口还没有足够的请求记录，暂时无法绘制趋势曲线。",
          })}
          icon={TrendingUp}
          className="min-h-[320px]"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <TrendLegendItem
              color={CHART_COLORS.input}
              label={t("usage.inputTokens", { defaultValue: "输入 Tokens" })}
            />
            <TrendLegendItem
              color={CHART_COLORS.output}
              label={t("usage.outputTokens", { defaultValue: "输出 Tokens" })}
            />
            <TrendLegendItem
              color={CHART_COLORS.cacheCreation}
              label={t("usage.cacheCreationTokens", {
                defaultValue: "缓存写入",
              })}
            />
            <TrendLegendItem
              color={CHART_COLORS.cacheRead}
              label={t("usage.cacheReadTokens", {
                defaultValue: "缓存读取",
              })}
            />
            <TrendLegendItem
              color={CHART_COLORS.cost}
              label={t("usage.cost", { defaultValue: "成本" })}
            />
          </div>

          <div className="h-[360px] w-full rounded-[22px] border border-border/60 bg-background/42 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={displayData}
                margin={{ top: 16, right: 8, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="usageChartInput" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.input}
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.input}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="usageChartOutput"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.output}
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.output}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="usageChartCacheCreation"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.cacheCreation}
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.cacheCreation}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="usageChartCacheRead"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS.cacheRead}
                      stopOpacity={0.24}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS.cacheRead}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  yAxisId="tokens"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="cost"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="tokens"
                  type="monotone"
                  dataKey="inputTokens"
                  name={t("usage.inputTokens", { defaultValue: "输入 Tokens" })}
                  stroke={CHART_COLORS.input}
                  fillOpacity={1}
                  fill="url(#usageChartInput)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="tokens"
                  type="monotone"
                  dataKey="outputTokens"
                  name={t("usage.outputTokens", { defaultValue: "输出 Tokens" })}
                  stroke={CHART_COLORS.output}
                  fillOpacity={1}
                  fill="url(#usageChartOutput)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="tokens"
                  type="monotone"
                  dataKey="cacheCreationTokens"
                  name={t("usage.cacheCreationTokens", {
                    defaultValue: "缓存写入",
                  })}
                  stroke={CHART_COLORS.cacheCreation}
                  fillOpacity={1}
                  fill="url(#usageChartCacheCreation)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="tokens"
                  type="monotone"
                  dataKey="cacheReadTokens"
                  name={t("usage.cacheReadTokens", {
                    defaultValue: "缓存读取",
                  })}
                  stroke={CHART_COLORS.cacheRead}
                  fillOpacity={1}
                  fill="url(#usageChartCacheRead)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="cost"
                  type="monotone"
                  dataKey="cost"
                  name={t("usage.cost", { defaultValue: "成本" })}
                  stroke={CHART_COLORS.cost}
                  fill="none"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </UsagePanel>
  );
}
