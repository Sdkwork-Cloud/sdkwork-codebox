import { settingsApi } from "@/lib/api/settings";

/**
 * Keep live provider configs aligned after settings/import changes.
 * Returns a structured result so callers can decide their own UX.
 */
export async function syncCurrentProvidersLiveSafe(): Promise<{
  ok: boolean;
  error?: Error;
}> {
  try {
    await settingsApi.syncCurrentProvidersLive();
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err ?? ""));
    return { ok: false, error };
  }
}
