import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { type AppId } from "@/lib/api";
import {
  DEFAULT_STREAM_CHECK_TIMEOUT_MS,
  isStreamCheckTimeoutError,
  streamCheckProvider,
  type StreamCheckResult,
} from "@/lib/api/model-test";
import { useResetCircuitBreaker } from "@/lib/query/failover";

export function useStreamCheck(appId: AppId) {
  const { t } = useTranslation();
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());
  const resetCircuitBreaker = useResetCircuitBreaker();

  const checkProvider = useCallback(
    async (
      providerId: string,
      providerName: string,
    ): Promise<StreamCheckResult | null> => {
      setCheckingIds((prev) => new Set(prev).add(providerId));

      try {
        const result = await streamCheckProvider(appId, providerId, {
          timeoutMs: DEFAULT_STREAM_CHECK_TIMEOUT_MS,
        });

        if (result.status === "operational") {
          toast.success(
            t("streamCheck.operational", {
              providerName,
              responseTimeMs: result.responseTimeMs,
              defaultValue: `${providerName} 运行正常 (${result.responseTimeMs}ms)`,
            }),
            { closeButton: true },
          );
          resetCircuitBreaker.mutate({ providerId, appType: appId });
        } else if (result.status === "degraded") {
          toast.warning(
            t("streamCheck.degraded", {
              providerName,
              responseTimeMs: result.responseTimeMs,
              defaultValue: `${providerName} 响应较慢 (${result.responseTimeMs}ms)`,
            }),
          );
          resetCircuitBreaker.mutate({ providerId, appType: appId });
        } else {
          toast.error(
            t("streamCheck.failed", {
              providerName,
              message: result.message,
              defaultValue: `${providerName} 检查失败: ${result.message}`,
            }),
          );
        }

        return result;
      } catch (error) {
        const message = isStreamCheckTimeoutError(error)
          ? t("streamCheck.timeout", {
              providerName,
              defaultValue: `${providerName} 测试超时，请检查网络、代理或模型配置后重试。`,
            })
          : t("streamCheck.error", {
              providerName,
              error: String(error),
              defaultValue: `${providerName} 检查出错: ${String(error)}`,
            });

        toast.error(message, { closeButton: true });
        return null;
      } finally {
        setCheckingIds((prev) => {
          const next = new Set(prev);
          next.delete(providerId);
          return next;
        });
      }
    },
    [appId, resetCircuitBreaker, t],
  );

  const isChecking = useCallback(
    (providerId: string) => checkingIds.has(providerId),
    [checkingIds],
  );

  return { checkProvider, isChecking };
}
