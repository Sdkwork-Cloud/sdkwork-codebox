import { invoke } from "@tauri-apps/api/core";
import type { AppId } from "./types";

// ===== 流式健康检查类型 =====

export type HealthStatus = "operational" | "degraded" | "failed";

export interface StreamCheckConfig {
  timeoutSecs: number;
  maxRetries: number;
  degradedThresholdMs: number;
  claudeModel: string;
  codexModel: string;
  geminiModel: string;
  testPrompt: string;
}

export interface StreamCheckResult {
  status: HealthStatus;
  success: boolean;
  message: string;
  responseTimeMs?: number;
  httpStatus?: number;
  modelUsed: string;
  testedAt: number;
  retryCount: number;
}

export const DEFAULT_STREAM_CHECK_TIMEOUT_MS = 75_000;

export class StreamCheckTimeoutError extends Error {
  timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Stream check timed out after ${timeoutMs}ms`);
    this.name = "StreamCheckTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function isStreamCheckTimeoutError(
  error: unknown,
): error is StreamCheckTimeoutError {
  return error instanceof Error && error.name === "StreamCheckTimeoutError";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new StreamCheckTimeoutError(timeoutMs));
    }, timeoutMs);

    promise.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// ===== 流式健康检查 API =====

/**
 * 流式健康检查（单个供应商）
 */
export async function streamCheckProvider(
  appType: AppId,
  providerId: string,
  options?: { timeoutMs?: number },
): Promise<StreamCheckResult> {
  return withTimeout(
    invoke("stream_check_provider", { appType, providerId }),
    options?.timeoutMs ?? DEFAULT_STREAM_CHECK_TIMEOUT_MS,
  );
}

/**
 * 批量流式健康检查
 */
export async function streamCheckAllProviders(
  appType: AppId,
  proxyTargetsOnly: boolean = false,
): Promise<Array<[string, StreamCheckResult]>> {
  return invoke("stream_check_all_providers", { appType, proxyTargetsOnly });
}

/**
 * 获取流式检查配置
 */
export async function getStreamCheckConfig(): Promise<StreamCheckConfig> {
  return invoke("get_stream_check_config");
}

/**
 * 保存流式检查配置
 */
export async function saveStreamCheckConfig(
  config: StreamCheckConfig,
): Promise<void> {
  return invoke("save_stream_check_config", { config });
}
