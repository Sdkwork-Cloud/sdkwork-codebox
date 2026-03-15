export interface DebugDiagnosticsOptions {
  enabled: boolean;
}

function formatReason(reason: unknown): unknown {
  if (reason instanceof Error) {
    return {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
    };
  }

  return reason;
}

export function installDebugDiagnostics({
  enabled,
}: DebugDiagnosticsOptions): void {
  if (!enabled) {
    return;
  }

  window.addEventListener("error", (event) => {
    console.error("[DebugDiagnostics] uncaught error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: formatReason(event.error),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[DebugDiagnostics] unhandled rejection", {
      reason: formatReason(event.reason),
    });
  });
}
