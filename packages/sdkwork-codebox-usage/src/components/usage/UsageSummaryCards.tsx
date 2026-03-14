import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Activity, Database, DollarSign, Layers, Loader2 } from "lucide-react";
import { useUsageSummary } from "@/lib/query/usage";
import { fmtUsd, parseFiniteNumber } from "./format";
import { UsagePill } from "./UsageWorkbench";

interface UsageSummaryCardsProps {
  days: number;
  refreshIntervalMs: number;
}

export function UsageSummaryCards({
  days,
  refreshIntervalMs,
}: UsageSummaryCardsProps) {
  const { t } = useTranslation();

  const { data: summary, isLoading } = useUsageSummary(days, {
    refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
  });

  const stats = useMemo(() => {
    const totalRequests = summary?.totalRequests ?? 0;
    const totalCost = parseFiniteNumber(summary?.totalCost);
    const inputTokens = summary?.totalInputTokens ?? 0;
    const outputTokens = summary?.totalOutputTokens ?? 0;
    const totalTokens = inputTokens + outputTokens;
    const cacheWriteTokens = summary?.totalCacheCreationTokens ?? 0;
    const cacheReadTokens = summary?.totalCacheReadTokens ?? 0;
    const totalCacheTokens = cacheWriteTokens + cacheReadTokens;

    return [
      {
        title: t("usage.totalRequests"),
        value: totalRequests.toLocaleString(),
        icon: Activity,
        iconClassName: "text-primary",
        iconShellClassName: "bg-primary/10",
        glowClassName:
          "bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_68%)]",
        breakdown: [
          {
            label: t("usage.currentRange", { defaultValue: "统计窗口" }),
            value:
              days === 1
                ? t("usage.today")
                : days === 7
                  ? t("usage.last7days")
                  : t("usage.last30days"),
          },
        ],
      },
      {
        title: t("usage.totalCost"),
        value: totalCost == null ? "--" : fmtUsd(totalCost, 4),
        icon: DollarSign,
        iconClassName: "text-emerald-600 dark:text-emerald-300",
        iconShellClassName: "bg-emerald-500/10",
        glowClassName:
          "bg-[radial-gradient(circle_at_top,hsl(155_72%_42%/0.18),transparent_68%)]",
        breakdown: [
          {
            label: t("usage.requests", { defaultValue: "请求数" }),
            value: totalRequests.toLocaleString(),
          },
        ],
      },
      {
        title: t("usage.totalTokens"),
        value: totalTokens.toLocaleString(),
        icon: Layers,
        iconClassName: "text-[hsl(var(--shell-glow-secondary))]",
        iconShellClassName: "bg-[hsl(var(--shell-glow-secondary)/0.12)]",
        glowClassName:
          "bg-[radial-gradient(circle_at_top,hsl(var(--shell-glow-secondary)/0.18),transparent_68%)]",
        breakdown: [
          {
            label: t("usage.input", { defaultValue: "输入" }),
            value: `${(inputTokens / 1000).toFixed(1)}k`,
          },
          {
            label: t("usage.output", { defaultValue: "输出" }),
            value: `${(outputTokens / 1000).toFixed(1)}k`,
          },
        ],
      },
      {
        title: t("usage.cacheTokens"),
        value: totalCacheTokens.toLocaleString(),
        icon: Database,
        iconClassName: "text-amber-600 dark:text-amber-300",
        iconShellClassName: "bg-amber-500/10",
        glowClassName:
          "bg-[radial-gradient(circle_at_top,hsl(35_95%_55%/0.18),transparent_68%)]",
        breakdown: [
          {
            label: t("usage.cacheWrite", { defaultValue: "缓存写入" }),
            value: `${(cacheWriteTokens / 1000).toFixed(1)}k`,
          },
          {
            label: t("usage.cacheRead", { defaultValue: "缓存读取" }),
            value: `${(cacheReadTokens / 1000).toFixed(1)}k`,
          },
        ],
      },
    ];
  }, [days, summary, t]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[188px] items-center justify-center rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.82)_100%)]"
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 xl:grid-cols-4"
    >
      {stats.map((stat) => (
        <motion.article
          key={stat.title}
          variants={item}
          className="group relative overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_24px_58px_-38px_hsl(var(--shadow-color)/0.92)]"
        >
          <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 ${stat.glowClassName}`} />
          <div className="relative flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <h3
                  className="text-[1.9rem] font-semibold tracking-tight text-foreground"
                  title={stat.value}
                >
                  {stat.value}
                </h3>
              </div>

              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-border/60 ${stat.iconShellClassName}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconClassName}`} />
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <UsagePill
                label={t("usage.refreshCadence", {
                  defaultValue: "刷新策略",
                })}
                value={
                  refreshIntervalMs > 0
                    ? `${refreshIntervalMs / 1000}s`
                    : t("usage.autoRefreshOff", {
                        defaultValue: "手动刷新",
                      })
                }
                tone={refreshIntervalMs > 0 ? "accent" : "neutral"}
              />
            </div>

            <dl className="mt-4 grid gap-2">
              {stat.breakdown.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center justify-between rounded-[16px] border border-border/50 bg-background/50 px-3 py-2.5"
                >
                  <dt className="text-xs font-medium text-muted-foreground">
                    {entry.label}
                  </dt>
                  <dd className="text-sm font-semibold text-foreground">
                    {entry.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}
