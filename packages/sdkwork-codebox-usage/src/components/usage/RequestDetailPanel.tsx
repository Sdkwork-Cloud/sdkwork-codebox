import { AlertCircle, Clock3, Coins, Layers3, TimerReset } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OperationDrawer } from "@/components/common/OperationDrawer";
import { useRequestDetail } from "@/lib/query/usage";
import {
  fmtInt,
  fmtUsd,
  getLocaleFromLanguage,
  parseFiniteNumber,
} from "./format";
import { UsageEmptyState, UsagePill } from "./UsageWorkbench";

interface RequestDetailPanelProps {
  requestId: string;
  onClose: () => void;
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.82)_100%)]">
      <header className="border-b border-border/60 bg-background/45 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5 rounded-[18px] border border-border/50 bg-background/52 px-3 py-3">
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className={mono ? "font-mono text-sm text-foreground" : "text-sm text-foreground"}>
        {value}
      </dd>
    </div>
  );
}

export function RequestDetailPanel({
  requestId,
  onClose,
}: RequestDetailPanelProps) {
  const { t, i18n } = useTranslation();
  const { data: request, isLoading } = useRequestDetail(requestId);
  const locale = getLocaleFromLanguage(
    i18n.resolvedLanguage || i18n.language || "en",
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const statusCode = request?.statusCode ?? 0;
  const statusTone =
    statusCode >= 200 && statusCode < 300 ? "success" : "danger";

  const totalTokens = request
    ? request.inputTokens +
      request.outputTokens +
      request.cacheReadTokens +
      request.cacheCreationTokens
    : 0;
  const totalCost = parseFiniteNumber(request?.totalCostUsd);
  const costMultiplier = parseFiniteNumber(request?.costMultiplier);

  return (
    <OperationDrawer
      open
      onOpenChange={handleOpenChange}
      title={t("usage.requestDetail", { defaultValue: "请求详情" })}
      description={t("usage.requestDetailDescription", {
        defaultValue:
          "沿着元数据、Token、成本和延迟四条线索复盘单次请求，便于定位计费异常和性能问题。",
      })}
      eyebrow={t("usage.requestDetailEyebrow", {
        defaultValue: "Request Inspection",
      })}
      badge={
        request ? (
          <div className="flex flex-wrap items-center gap-2">
            <UsagePill
              label={t("usage.provider", { defaultValue: "供应商" })}
              value={request.providerName || t("usage.unknownProvider")}
            />
            <UsagePill
              label={t("usage.appType", { defaultValue: "应用" })}
              value={request.appType}
            />
            <UsagePill
              label={t("usage.status", { defaultValue: "状态" })}
              value={request.statusCode}
              tone={statusTone}
            />
          </div>
        ) : null
      }
      testId="usage-request-detail-drawer"
    >
      {isLoading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-[240px] animate-pulse rounded-[22px] bg-background/60" />
          <div className="h-[240px] animate-pulse rounded-[22px] bg-background/60" />
        </div>
      ) : !request ? (
        <UsageEmptyState
          title={t("usage.requestNotFound", { defaultValue: "请求未找到" })}
          description={t("usage.requestNotFoundHint", {
            defaultValue:
              "该请求可能已被清理，或者当前过滤窗口与缓存状态已发生变化。",
          })}
          icon={AlertCircle}
          className="min-h-[320px]"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="space-y-4">
            <DetailSection
              title={t("usage.basicInfo", { defaultValue: "基本信息" })}
            >
              <dl className="grid gap-3 md:grid-cols-2">
                <DetailItem
                  label={t("usage.requestId", { defaultValue: "请求 ID" })}
                  value={request.requestId}
                  mono
                />
                <DetailItem
                  label={t("usage.time", { defaultValue: "时间" })}
                  value={new Date(request.createdAt * 1000).toLocaleString(
                    locale,
                  )}
                />
                <DetailItem
                  label={t("usage.provider", { defaultValue: "供应商" })}
                  value={
                    <div className="space-y-1">
                      <div>{request.providerName || t("usage.unknownProvider")}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {request.providerId}
                      </div>
                    </div>
                  }
                />
                <DetailItem
                  label={t("usage.model", { defaultValue: "模型" })}
                  value={request.model}
                  mono
                />
              </dl>
            </DetailSection>

            <DetailSection
              title={t("usage.tokenUsage", { defaultValue: "Token 使用量" })}
            >
              <dl className="grid gap-3 md:grid-cols-2">
                <DetailItem
                  label={t("usage.inputTokens", { defaultValue: "输入 Tokens" })}
                  value={fmtInt(request.inputTokens, locale)}
                  mono
                />
                <DetailItem
                  label={t("usage.outputTokens", {
                    defaultValue: "输出 Tokens",
                  })}
                  value={fmtInt(request.outputTokens, locale)}
                  mono
                />
                <DetailItem
                  label={t("usage.cacheReadTokens", {
                    defaultValue: "缓存读取",
                  })}
                  value={fmtInt(request.cacheReadTokens, locale)}
                  mono
                />
                <DetailItem
                  label={t("usage.cacheCreationTokens", {
                    defaultValue: "缓存写入",
                  })}
                  value={fmtInt(request.cacheCreationTokens, locale)}
                  mono
                />
              </dl>
            </DetailSection>

            <DetailSection
              title={t("usage.performance", { defaultValue: "性能信息" })}
            >
              <dl className="grid gap-3 md:grid-cols-2">
                <DetailItem
                  label={t("usage.latency", { defaultValue: "延迟" })}
                  value={`${request.latencyMs}ms`}
                  mono
                />
                <DetailItem
                  label={t("usage.firstTokenLatency", {
                    defaultValue: "首 Token 延迟",
                  })}
                  value={
                    request.firstTokenMs != null
                      ? `${request.firstTokenMs}ms`
                      : t("common.notAvailable", { defaultValue: "--" })
                  }
                  mono
                />
              </dl>
            </DetailSection>
          </div>

          <div className="space-y-4">
            <DetailSection
              title={t("usage.requestSnapshot", { defaultValue: "请求快照" })}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-border/50 bg-background/58 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    <Layers3 className="h-3.5 w-3.5" />
                    {t("usage.totalTokens", { defaultValue: "总 Tokens" })}
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-foreground">
                    {fmtInt(totalTokens, locale)}
                  </div>
                </div>
                <div className="rounded-[18px] border border-border/50 bg-background/58 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    <Coins className="h-3.5 w-3.5" />
                    {t("usage.totalCost", { defaultValue: "总成本" })}
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-foreground">
                    {totalCost == null ? "--" : fmtUsd(totalCost, 6)}
                  </div>
                </div>
                <div className="rounded-[18px] border border-border/50 bg-background/58 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    <TimerReset className="h-3.5 w-3.5" />
                    {t("usage.status", { defaultValue: "状态" })}
                  </div>
                  <div className="mt-3">
                    <UsagePill
                      label={t("usage.httpStatus", {
                        defaultValue: "HTTP",
                      })}
                      value={request.statusCode}
                      tone={statusTone}
                    />
                  </div>
                </div>
                <div className="rounded-[18px] border border-border/50 bg-background/58 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {t("usage.streamingMode", { defaultValue: "模式" })}
                  </div>
                  <div className="mt-3">
                    <UsagePill
                      label={
                        request.isStreaming
                          ? t("usage.stream", { defaultValue: "流式" })
                          : t("usage.nonStream", { defaultValue: "非流式" })
                      }
                      tone={request.isStreaming ? "accent" : "neutral"}
                    />
                  </div>
                </div>
              </div>
            </DetailSection>

            <DetailSection
              title={t("usage.costBreakdown", { defaultValue: "成本明细" })}
            >
              <dl className="grid gap-3">
                <DetailItem
                  label={t("usage.inputCost", { defaultValue: "输入成本" })}
                  value={fmtUsd(request.inputCostUsd, 6)}
                  mono
                />
                <DetailItem
                  label={t("usage.outputCost", { defaultValue: "输出成本" })}
                  value={fmtUsd(request.outputCostUsd, 6)}
                  mono
                />
                <DetailItem
                  label={t("usage.cacheReadCost", {
                    defaultValue: "缓存读取成本",
                  })}
                  value={fmtUsd(request.cacheReadCostUsd, 6)}
                  mono
                />
                <DetailItem
                  label={t("usage.cacheCreationCost", {
                    defaultValue: "缓存写入成本",
                  })}
                  value={fmtUsd(request.cacheCreationCostUsd, 6)}
                  mono
                />
                {costMultiplier != null && costMultiplier !== 1 ? (
                  <DetailItem
                    label={t("usage.costMultiplier", {
                      defaultValue: "成本倍率",
                    })}
                    value={`×${request.costMultiplier}`}
                    mono
                  />
                ) : null}
              </dl>
            </DetailSection>

            {request.errorMessage ? (
              <DetailSection
                title={t("usage.errorMessage", { defaultValue: "错误信息" })}
              >
                <div className="rounded-[18px] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                  {request.errorMessage}
                </div>
              </DetailSection>
            ) : null}
          </div>
        </div>
      )}
    </OperationDrawer>
  );
}
