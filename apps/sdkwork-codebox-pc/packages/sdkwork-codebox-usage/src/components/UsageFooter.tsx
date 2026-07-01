import React from "react";
import { AlertCircle, Clock3, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type AppId } from "@/lib/api";
import { useUsageQuery } from "@/lib/query/queries";
import { Provider, UsageData } from "@/types";
import { UsagePill } from "@/components/usage/UsageWorkbench";

interface UsageFooterProps {
  provider: Provider;
  providerId: string;
  appId: AppId;
  usageEnabled: boolean;
  isCurrent: boolean;
  isInConfig?: boolean;
  inline?: boolean;
}

function formatUsageAmount(value?: number) {
  if (value === undefined) {
    return null;
  }
  if (value === -1) {
    return "∞";
  }
  return value.toFixed(2);
}

function getUsageTone(data: UsageData): "neutral" | "warning" | "danger" | "success" {
  if (data.isValid === false) {
    return "danger";
  }

  if (data.remaining === undefined) {
    return "neutral";
  }

  const threshold = (data.total || data.remaining) * 0.1;
  if (data.remaining < threshold) {
    return "warning";
  }

  return "success";
}

function RefreshButton({
  loading,
  onRefresh,
  title,
}: {
  loading: boolean;
  onRefresh: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      data-tauri-no-drag
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onRefresh();
      }}
      disabled={loading}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/72 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
      title={title}
    >
      <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
    </button>
  );
}

function UsagePlanCard({ data }: { data: UsageData }) {
  const { t } = useTranslation();
  const totalValue = formatUsageAmount(data.total);
  const usedValue = formatUsageAmount(data.used);
  const remainingValue = formatUsageAmount(data.remaining);
  const statusTone = getUsageTone(data);

  return (
    <article className="overflow-hidden rounded-[18px] border border-border/55 bg-[linear-gradient(180deg,hsl(var(--background)/0.86)_0%,hsl(var(--panel-surface)/0.82)_100%)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 bg-background/42 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">
            {data.planName || t("usage.defaultPlan", { defaultValue: "默认套餐" })}
          </div>
          {data.extra ? (
            <div className="mt-1 truncate text-xs text-muted-foreground" title={data.extra}>
              {data.extra}
            </div>
          ) : null}
        </div>

        <UsagePill
          label={
            data.isValid === false
              ? data.invalidMessage || t("usage.invalid", { defaultValue: "不可用" })
              : t("usage.valid", { defaultValue: "正常" })
          }
          tone={statusTone}
        />
      </div>

      <dl className="grid gap-3 p-4 sm:grid-cols-3">
        {totalValue != null ? (
          <div className="rounded-[16px] border border-border/50 bg-background/48 px-3 py-3">
            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("usage.total", { defaultValue: "总额度" })}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-foreground">
              {totalValue}
              {data.unit ? (
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                  {data.unit}
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}

        {usedValue != null ? (
          <div className="rounded-[16px] border border-border/50 bg-background/48 px-3 py-3">
            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("usage.used", { defaultValue: "已用" })}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-foreground">
              {usedValue}
              {data.unit ? (
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                  {data.unit}
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}

        {remainingValue != null ? (
          <div className="rounded-[16px] border border-border/50 bg-background/48 px-3 py-3">
            <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("usage.remaining", { defaultValue: "剩余" })}
            </dt>
            <dd
              className={`mt-2 text-sm font-semibold ${
                statusTone === "danger"
                  ? "text-destructive"
                  : statusTone === "warning"
                    ? "text-amber-600 dark:text-amber-300"
                    : "text-emerald-600 dark:text-emerald-300"
              }`}
            >
              {remainingValue}
              {data.unit ? (
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                  {data.unit}
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}

const UsageFooter: React.FC<UsageFooterProps> = ({
  provider,
  providerId,
  appId,
  usageEnabled,
  isCurrent,
  isInConfig = false,
  inline = false,
}) => {
  const { t } = useTranslation();

  const shouldAutoQuery = appId === "opencode" ? isInConfig : isCurrent;
  const autoQueryInterval = shouldAutoQuery
    ? provider.meta?.usage_script?.autoQueryInterval || 0
    : 0;

  const {
    data: usage,
    isFetching: loading,
    lastQueriedAt,
    refetch,
  } = useUsageQuery(providerId, appId, {
    enabled: usageEnabled,
    autoQueryInterval,
  });

  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    if (!lastQueriedAt) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, [lastQueriedAt]);

  if (!usageEnabled || !usage) {
    return null;
  }

  if (!usage.success) {
    const content = (
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-destructive/25 bg-destructive/10 text-destructive">
          <AlertCircle size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-destructive">
            {usage.error || t("usage.queryFailed", { defaultValue: "查询失败" })}
          </div>
        </div>
        <RefreshButton
          loading={loading}
          onRefresh={() => void refetch()}
          title={t("usage.refreshUsage", { defaultValue: "刷新用量" })}
        />
      </div>
    );

    if (inline) {
      return (
        <div className="flex min-w-0 items-center gap-2 rounded-[18px] border border-destructive/20 bg-destructive/10 px-3 py-2">
          {content}
        </div>
      );
    }

    return (
      <div className="mt-3 rounded-[20px] border border-destructive/20 bg-destructive/10 px-4 py-3">
        {content}
      </div>
    );
  }

  const usageDataList = usage.data || [];
  if (usageDataList.length === 0) {
    return null;
  }

  const firstUsage = usageDataList[0];
  const refreshTitle = t("usage.refreshUsage", { defaultValue: "刷新用量" });
  const relativeTime = lastQueriedAt
    ? formatRelativeTime(lastQueriedAt, now, t)
    : t("usage.never", { defaultValue: "从未更新" });
  const cadenceLabel =
    autoQueryInterval > 0
      ? `${autoQueryInterval} min`
      : t("usage.autoRefreshOff", {
          defaultValue: "手动刷新",
        });

  if (inline) {
    return (
      <div className="flex min-w-0 flex-col items-end gap-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <UsagePill
            icon={Clock3}
            label={t("usage.lastUpdated", {
              defaultValue: "上次更新",
            })}
            value={relativeTime}
            className="max-w-full"
          />
          <RefreshButton
            loading={loading}
            onRefresh={() => void refetch()}
            title={refreshTitle}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {firstUsage.planName ? (
            <UsagePill
              label={t("usage.plan", { defaultValue: "套餐" })}
              value={firstUsage.planName}
            />
          ) : null}
          {firstUsage.used !== undefined ? (
            <UsagePill
              label={t("usage.used", { defaultValue: "已用" })}
              value={formatUsageAmount(firstUsage.used)}
            />
          ) : null}
          {firstUsage.remaining !== undefined ? (
            <UsagePill
              label={t("usage.remaining", { defaultValue: "剩余" })}
              value={formatUsageAmount(firstUsage.remaining)}
              tone={getUsageTone(firstUsage)}
            />
          ) : null}
          {firstUsage.unit ? (
            <span className="text-[11px] font-medium text-muted-foreground">
              {firstUsage.unit}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section className="mt-3 overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.82)_100%)] shadow-[0_20px_48px_-36px_hsl(var(--shadow-color)/0.92)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-background/42 px-4 py-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t("usage.planUsage", { defaultValue: "套餐用量" })}
          </div>
          <h4 className="mt-2 text-sm font-semibold text-foreground">
            {t("usage.planUsageDescription", {
              defaultValue: "实时查看套餐余额、总额度和最近一次同步状态。",
            })}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <UsagePill
            icon={Clock3}
            label={t("usage.lastUpdated", {
              defaultValue: "上次更新",
            })}
            value={relativeTime}
          />
          <UsagePill
            label={t("usage.refreshCadence", {
              defaultValue: "刷新策略",
            })}
            value={cadenceLabel}
            tone={autoQueryInterval > 0 ? "accent" : "neutral"}
          />
          <RefreshButton
            loading={loading}
            onRefresh={() => void refetch()}
            title={refreshTitle}
          />
        </div>
      </header>

      <div className="grid gap-3 p-4">
        {usageDataList.map((usageData, index) => (
          <UsagePlanCard key={`${usageData.planName ?? "plan"}-${index}`} data={usageData} />
        ))}
      </div>
    </section>
  );
};

function formatRelativeTime(
  timestamp: number,
  now: number,
  t: (key: string, options?: { count?: number; defaultValue?: string }) => string,
): string {
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) {
    return t("usage.justNow", { defaultValue: "刚刚" });
  }
  if (diff < 3600) {
    return t("usage.minutesAgo", { count: Math.floor(diff / 60) });
  }
  if (diff < 86400) {
    return t("usage.hoursAgo", { count: Math.floor(diff / 3600) });
  }
  return t("usage.daysAgo", { count: Math.floor(diff / 86400) });
}

export default UsageFooter;
