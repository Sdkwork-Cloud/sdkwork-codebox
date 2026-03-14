import { useTranslation } from "react-i18next";
import type { SettingsFormState } from "@/hooks/useSettings";
import { AppWindow, MonitorUp, Power, EyeOff } from "lucide-react";
import { ToggleRow } from "@/components/ui/toggle-row";
import { AnimatePresence, motion } from "framer-motion";

interface WindowSettingsProps {
  settings: SettingsFormState;
  onChange: (updates: Partial<SettingsFormState>) => void;
}

export function WindowSettings({ settings, onChange }: WindowSettingsProps) {
  const { t } = useTranslation();
  const trayEnabled = !!settings.showInTray;
  const silentStartupAvailable = !!settings.launchOnStartup && trayEnabled;

  const handleTrayVisibilityChange = (value: boolean) => {
    if (value) {
      onChange({ showInTray: true });
      return;
    }

    onChange({
      showInTray: false,
      minimizeToTrayOnClose: false,
      silentStartup: false,
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <AppWindow className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">{t("settings.windowBehavior")}</h3>
      </div>

      <div className="space-y-3">
        <ToggleRow
          icon={<AppWindow className="h-4 w-4 text-primary" />}
          title={t("settings.showInTray")}
          description={t("settings.showInTrayDescription")}
          checked={trayEnabled}
          onCheckedChange={handleTrayVisibilityChange}
        />

        <ToggleRow
          icon={<Power className="h-4 w-4 text-primary" />}
          title={t("settings.launchOnStartup")}
          description={t("settings.launchOnStartupDescription")}
          checked={!!settings.launchOnStartup}
          onCheckedChange={(value) => onChange({ launchOnStartup: value })}
        />

        <AnimatePresence initial={false}>
          {settings.launchOnStartup && (
            <motion.div
              key="silent-startup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <ToggleRow
                icon={
                  <EyeOff className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                }
                title={t("settings.silentStartup")}
                description={
                  trayEnabled
                    ? t("settings.silentStartupDescription")
                    : t("settings.trayRequiredDescription")
                }
                checked={!!settings.silentStartup}
                onCheckedChange={(value) => onChange({ silentStartup: value })}
                disabled={!silentStartupAvailable}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <ToggleRow
          icon={
            <MonitorUp className="h-4 w-4 text-violet-500 dark:text-violet-400" />
          }
          title={t("settings.enableClaudePluginIntegration")}
          description={t("settings.enableClaudePluginIntegrationDescription")}
          checked={!!settings.enableClaudePluginIntegration}
          onCheckedChange={(value) =>
            onChange({ enableClaudePluginIntegration: value })
          }
        />

        <ToggleRow
          icon={
            <MonitorUp className="h-4 w-4 text-cyan-500 dark:text-cyan-400" />
          }
          title={t("settings.skipClaudeOnboarding")}
          description={t("settings.skipClaudeOnboardingDescription")}
          checked={!!settings.skipClaudeOnboarding}
          onCheckedChange={(value) => onChange({ skipClaudeOnboarding: value })}
        />

        <ToggleRow
          icon={<AppWindow className="h-4 w-4 text-primary" />}
          title={t("settings.minimizeToTray")}
          description={
            trayEnabled
              ? t("settings.minimizeToTrayDescription")
              : t("settings.trayRequiredDescription")
          }
          checked={settings.minimizeToTrayOnClose}
          onCheckedChange={(value) =>
            onChange({ minimizeToTrayOnClose: value })
          }
          disabled={!trayEnabled}
        />
      </div>
    </section>
  );
}
