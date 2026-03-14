import { useTranslation } from "react-i18next";
import { BarChart3, Sparkles } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModelStats } from "@/lib/query/usage";
import { fmtUsd } from "./format";
import { UsageEmptyState, UsagePill } from "./UsageWorkbench";

interface ModelStatsTableProps {
  refreshIntervalMs: number;
}

export function ModelStatsTable({ refreshIntervalMs }: ModelStatsTableProps) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useModelStats({
    refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
  });
  const topModel = stats?.[0];

  if (isLoading) {
    return <div className="h-[400px] animate-pulse rounded bg-gray-100" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <UsagePill
          icon={BarChart3}
          label={t("usage.modelCount", {
            defaultValue: "模型数",
          })}
          value={stats?.length ?? 0}
        />
        {topModel ? (
          <UsagePill
            icon={Sparkles}
            label={t("usage.topModel", {
              defaultValue: "领先模型",
            })}
            value={topModel.model}
            tone="accent"
          />
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[22px] border border-border/60 bg-background/55">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("usage.model", "模型")}</TableHead>
              <TableHead className="text-right">
                {t("usage.requests", "请求数")}
              </TableHead>
              <TableHead className="text-right">
                {t("usage.tokens", "Tokens")}
              </TableHead>
              <TableHead className="text-right">
                {t("usage.totalCost", "总成本")}
              </TableHead>
              <TableHead className="text-right">
                {t("usage.avgCost", "平均成本")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-4">
                  <UsageEmptyState
                    title={t("usage.noData", { defaultValue: "暂无数据" })}
                    description={t("usage.modelStatsEmptyHint", {
                      defaultValue:
                        "当前时间窗口内还没有可用于比较的模型消耗记录。",
                    })}
                    icon={BarChart3}
                    className="min-h-[180px]"
                  />
                </TableCell>
              </TableRow>
            ) : (
              stats?.map((stat, index) => (
                <TableRow key={stat.model}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/70 text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="truncate">{stat.model}</span>
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
                    {fmtUsd(stat.avgCostPerRequest, 6)}
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
