import type { Settings } from "@/types";

type WindowBehaviorInput = Pick<
  Partial<Settings>,
  "showInTray" | "minimizeToTrayOnClose" | "silentStartup"
>;

export interface NormalizedWindowBehavior {
  showInTray: boolean;
  minimizeToTrayOnClose: boolean;
  silentStartup: boolean;
}

export function normalizeWindowBehavior(
  settings: WindowBehaviorInput,
): NormalizedWindowBehavior {
  const showInTray = settings.showInTray ?? true;

  return {
    showInTray,
    minimizeToTrayOnClose: showInTray
      ? (settings.minimizeToTrayOnClose ?? true)
      : false,
    silentStartup: showInTray ? (settings.silentStartup ?? false) : false,
  };
}
