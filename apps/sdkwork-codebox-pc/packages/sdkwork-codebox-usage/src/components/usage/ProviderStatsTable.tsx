import { useTranslation } from "react-i18next";
import { Activity, ShieldCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProviderStats } from "@/lib/query/usage";
import { fmtUsd } from "./format";
import { UsageEmptyState, UsagePill } from "./UsageWorkbench";

interface ProviderStatsTableProps {
  refreshIntervalMs: number;
}

export function ProviderStatsTable({
  refreshIntervalMs,
}: ProviderStatsTableProps) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useProviderStats({
    refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
  });
  const topProvider = stats?.[0];

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded bg-gray-100" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <UsagePill
          icon={Activity}
          label={t("usage.providerCount", {
            defaultValue: "供应商数",
          })}
          value={stats?.length ?? 0}
        />
        {topProvider ? (
          <UsagePill
            icon={ShieldCheck}
            label={t("usage.topProvider", {
              defaultValue: "领先供应商",
            })}
            value={topProvider.providerName}
            tone="accent"
          />
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[22px] border border-border/60 bg-background/55">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("usage.provider", "Provider")}</TableHead>
              <TableHead className="text-right">
                {t("usage.requests", "请求数")}
              </TableHead>
              <TableHead className="text-right">
                {t("usage.tokens", "Tokens")}
              </TableHead>
              <TableHead className="text-right">
                {t("usage.cost", "成本")}
              </TableHead>
              <TableHead className="text-right">
                {t("usage.successRate", "成功率")}
              </TableHead>
              <TableHead className="text-right">
                {t("usage.avgLatency", "平均延迟")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-4">
                  <UsageEmptyState
                    title={t("usage.noData", { defaultValue: "暂无数据" })}
                    description={t("usage.providerStatsEmptyHint", {
                      defaultValue:
                        "当前时间窗口内还没有可用于聚合的供应商统计记录。",
                    })}
                    icon={Activity}
                    className="min-h-[180px]"
                  />
                </TableCell>
              </TableRow>
            ) : (
              stats?.map((stat, index) => (
                <TableRow key={stat.providerId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/70 text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span>{stat.providerName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.requestCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.totalTokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmtUsd(stat.totalCost, 4)}
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.successRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {stat.avgLatencyMs}ms
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
