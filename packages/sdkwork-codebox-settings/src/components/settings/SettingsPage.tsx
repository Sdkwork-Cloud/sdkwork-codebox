import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AppWindow,
  Cloud,
  Loader2,
  type LucideIcon,
  Palette,
  Save,
  HardDriveDownload,
  Sparkles,
  X,
  Info,
  FolderSearch,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { settingsApi } from "@/lib/api";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { WindowSettings } from "@/components/settings/WindowSettings";
import { AppVisibilitySettings } from "@/components/settings/AppVisibilitySettings";
import { SkillSyncMethodSettings } from "@/components/settings/SkillSyncMethodSettings";
import { TerminalSettings } from "@/components/settings/TerminalSettings";
import { DirectorySettings } from "@/components/settings/DirectorySettings";
import { ImportExportSection } from "@/components/settings/ImportExportSection";
import { BackupListSection } from "@/components/settings/BackupListSection";
import { WebdavSyncSection } from "@/components/settings/WebdavSyncSection";
import { AboutSection } from "@/components/settings/AboutSection";
import { useSettings } from "@/hooks/useSettings";
import { useImportExport } from "@/hooks/useImportExport";
import { useTranslation } from "react-i18next";
import type { SettingsFormState } from "@/hooks/useSettings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: () => void | Promise<void>;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
  showCloseButton?: boolean;
}

export function SettingsPage({
  open,
  onOpenChange,
  onImportSuccess,
  defaultTab = "appearance",
  onTabChange,
  showCloseButton = true,
}: SettingsDialogProps) {
  const { t } = useTranslation();
  const {
    settings,
    isLoading,
    isSaving,
    isPortable,
    appConfigDir,
    resolvedDirs,
    updateSettings,
    updateDirectory,
    updateAppConfigDir,
    browseDirectory,
    browseAppConfigDir,
    resetDirectory,
    resetAppConfigDir,
    saveSettings,
    autoSaveSettings,
    requiresRestart,
    acknowledgeRestart,
  } = useSettings();

  const {
    selectedFile,
    status: importStatus,
    errorMessage,
    backupId,
    isImporting,
    selectImportFile,
    importConfig,
    exportConfig,
    clearSelection,
    resetStatus,
  } = useImportExport({ onImportSuccess });

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [showRestartPrompt, setShowRestartPrompt] = useState(false);
  const navButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
      resetStatus();
    }
  }, [open, resetStatus, defaultTab]);

  useEffect(() => {
    if (requiresRestart) {
      setShowRestartPrompt(true);
    }
  }, [requiresRestart]);

  const handleSelectTab = useCallback(
    (nextTab: string) => {
      setActiveTab(nextTab);
      onTabChange?.(nextTab);
    },
    [onTabChange],
  );

  const closeAfterSave = useCallback(() => {
    // 保存成功后关闭：不再重置语言，避免需要“保存两次”才生效
    acknowledgeRestart();
    clearSelection();
    resetStatus();
    onOpenChange(false);
  }, [acknowledgeRestart, clearSelection, onOpenChange, resetStatus]);

  const handleSave = useCallback(async () => {
    try {
      const result = await saveSettings(undefined, { silent: false });
      if (!result) return;
      if (result.requiresRestart) {
        setShowRestartPrompt(true);
        return;
      }
      closeAfterSave();
    } catch (error) {
      console.error("[SettingsPage] Failed to save settings", error);
    }
  }, [closeAfterSave, saveSettings]);

  const handleRestartLater = useCallback(() => {
    setShowRestartPrompt(false);
    closeAfterSave();
  }, [closeAfterSave]);

  const handleRestartNow = useCallback(async () => {
    setShowRestartPrompt(false);
    if (import.meta.env.DEV) {
      toast.success(t("settings.devModeRestartHint"), { closeButton: true });
      closeAfterSave();
      return;
    }

    try {
      await settingsApi.restart();
    } catch (error) {
      console.error("[SettingsPage] Failed to restart app", error);
      toast.error(t("settings.restartFailed"));
    } finally {
      closeAfterSave();
    }
  }, [closeAfterSave, t]);

  // 通用设置即时保存（无需手动点击）
  // 统一处理本地表单状态、持久化与必要的系统 API 同步。
  const handleAutoSave = useCallback(
    async (updates: Partial<SettingsFormState>) => {
      if (!settings) return;
      updateSettings(updates);
      try {
        await autoSaveSettings(updates);
      } catch (error) {
        console.error("[SettingsPage] Failed to autosave settings", error);
        toast.error(
          t("settings.saveFailedGeneric", {
            defaultValue: "保存失败，请重试",
          }),
        );
      }
    },
    [autoSaveSettings, settings, t, updateSettings],
  );

  const isBusy = useMemo(() => isLoading && !settings, [isLoading, settings]);
  const settingsSections = [
    {
      value: "appearance",
      title: t("settings.controlCenter.appearance", {
        defaultValue: "外观",
      }),
      description: t("settings.controlCenter.appearanceHint", {
        defaultValue: "主题模式、主色、界面密度与动效偏好。",
      }),
      icon: Palette,
    },
    {
      value: "general",
      title: t("settings.controlCenter.general", {
        defaultValue: "通用",
      }),
      description: t("settings.controlCenter.generalHint", {
        defaultValue: "语言、窗口行为、产品显示与桌面集成。",
      }),
      icon: Sparkles,
    },
    {
      value: "dataSync",
      title: t("settings.controlCenter.dataSync", {
        defaultValue: "数据与同步",
      }),
      description: t("settings.controlCenter.dataSyncHint", {
        defaultValue: "导入导出、备份策略与 WebDAV 同步。",
      }),
      icon: Cloud,
    },
    {
      value: "directories",
      title: t("settings.controlCenter.directories", {
        defaultValue: "目录",
      }),
      description: t("settings.controlCenter.directoriesHint", {
        defaultValue: "本地应用配置目录与产品目录覆盖。",
      }),
      icon: FolderSearch,
    },
    {
      value: "advanced",
      title: t("settings.controlCenter.advanced", {
        defaultValue: "高级",
      }),
      description: t("settings.controlCenter.advancedHint", {
        defaultValue: "终端与技能同步等面向高级用户的桌面偏好。",
      }),
      icon: AppWindow,
    },
    {
      value: "about",
      title: t("settings.controlCenter.about", {
        defaultValue: "关于",
      }),
      description: t("settings.controlCenter.aboutHint", {
        defaultValue: "版本、运行环境与设备信息。",
      }),
      icon: Info,
    },
  ] as const;

  const activeSection = settingsSections.find(
    (section) => section.value === activeTab,
  );
  const ActiveSectionIcon = activeSection?.icon ?? Sparkles;

  const handleTabKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const key = event.key;
      if (
        key !== "ArrowDown" &&
        key !== "ArrowUp" &&
        key !== "Home" &&
        key !== "End"
      ) {
        return;
      }

      event.preventDefault();

      const lastIndex = settingsSections.length - 1;
      const nextIndex =
        key === "Home"
          ? 0
          : key === "End"
            ? lastIndex
            : key === "ArrowDown"
              ? (index + 1) % settingsSections.length
              : (index - 1 + settingsSections.length) % settingsSections.length;
      const nextSection = settingsSections[nextIndex];
      if (!nextSection) {
        return;
      }

      handleSelectTab(nextSection.value);
      navButtonRefs.current[nextSection.value]?.focus();
    },
    [handleSelectTab, settingsSections],
  );

  const renderActiveContent = () => {
    if (!settings) {
      return null;
    }

    if (activeTab === "appearance") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="space-y-5"
        >
          <SettingsPanel
            title={t("settings.controlCenter.appearance", {
              defaultValue: "外观",
            })}
            description="控制台的主题、主色、密度和动态反馈都会在这里即时预览与保存。"
            icon={Palette}
          >
            <ThemeSettings settings={settings} onChange={handleAutoSave} />
          </SettingsPanel>
        </motion.div>
      );
    }

    if (activeTab === "general") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
        >
          <SettingsPanel
            title={t("settings.language")}
            description="语言与窗口行为会立即反馈到当前桌面工作流。"
            icon={Sparkles}
          >
            <div className="space-y-5">
              <LanguageSettings
                value={settings.language}
                onChange={(lang) => handleAutoSave({ language: lang })}
              />
              <WindowSettings settings={settings} onChange={handleAutoSave} />
            </div>
          </SettingsPanel>
          <SettingsPanel
            title={t("settings.controlCenter.general", {
              defaultValue: "通用",
            })}
            description="保留你在桌面上的可见产品范围，并配置应用级联动。"
            icon={Sparkles}
          >
            <div className="space-y-5">
              <AppVisibilitySettings
                settings={settings}
                onChange={handleAutoSave}
              />
            </div>
          </SettingsPanel>
        </motion.div>
      );
    }

    if (activeTab === "dataSync") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="space-y-4"
        >
          <Accordion type="multiple" defaultValue={[]}>
            <AdvancedItem
              value="data"
              icon={HardDriveDownload}
              iconClassName="text-primary"
              title={t("settings.advanced.data.title")}
              description={t("settings.advanced.data.description")}
            >
              <ImportExportSection
                status={importStatus}
                selectedFile={selectedFile}
                errorMessage={errorMessage}
                backupId={backupId}
                isImporting={isImporting}
                onSelectFile={selectImportFile}
                onImport={importConfig}
                onExport={exportConfig}
                onClear={clearSelection}
              />
            </AdvancedItem>

            <AdvancedItem
              value="backup"
              icon={HardDriveDownload}
              iconClassName="text-amber-500"
              title={t("settings.advanced.backup.title", {
                defaultValue: "Backup & Restore",
              })}
              description={t("settings.advanced.backup.description", {
                defaultValue:
                  "Manage automatic backups, view and restore database snapshots",
              })}
            >
              <BackupListSection
                backupIntervalHours={settings.backupIntervalHours}
                backupRetainCount={settings.backupRetainCount}
                onSettingsChange={(updates) => handleAutoSave(updates)}
              />
            </AdvancedItem>

            <AdvancedItem
              value="cloudSync"
              icon={Cloud}
              iconClassName="text-cyan-500 dark:text-cyan-400"
              title={t("settings.advanced.cloudSync.title")}
              description={t("settings.advanced.cloudSync.description")}
            >
              <WebdavSyncSection
                config={settings.webdavSync}
                settings={settings}
                onAutoSave={handleAutoSave}
              />
            </AdvancedItem>
          </Accordion>
        </motion.div>
      );
    }

    if (activeTab === "directories") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="space-y-5"
        >
          <SettingsPanel
            title={t("settings.controlCenter.directories", {
              defaultValue: "目录",
            })}
            description="目录改动会改变真实配置的读取与写入路径，因此保留手动保存确认。"
            icon={FolderSearch}
          >
            <DirectorySettings
              appConfigDir={appConfigDir}
              resolvedDirs={resolvedDirs}
              onAppConfigChange={updateAppConfigDir}
              onBrowseAppConfig={browseAppConfigDir}
              onResetAppConfig={resetAppConfigDir}
              claudeDir={settings.claudeConfigDir}
              codexDir={settings.codexConfigDir}
              geminiDir={settings.geminiConfigDir}
              opencodeDir={settings.opencodeConfigDir}
              openclawDir={settings.openclawConfigDir}
              onDirectoryChange={updateDirectory}
              onBrowseDirectory={browseDirectory}
              onResetDirectory={resetDirectory}
            />
          </SettingsPanel>
        </motion.div>
      );
    }

    if (activeTab === "advanced") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
        >
          <SettingsPanel
            title={t("settings.controlCenter.advanced", {
              defaultValue: "高级",
            })}
            description="为重度用户保留更细颗粒度的桌面工作流偏好。"
            icon={AppWindow}
          >
            <div className="space-y-5">
              <SkillSyncMethodSettings
                value={settings.skillSyncMethod ?? "auto"}
                onChange={(method) =>
                  handleAutoSave({ skillSyncMethod: method })
                }
              />
              <TerminalSettings
                value={settings.preferredTerminal}
                onChange={(terminal) =>
                  handleAutoSave({ preferredTerminal: terminal })
                }
              />
            </div>
          </SettingsPanel>

          <SettingsPanel
            title="高级说明"
            description="这些设置不会改变业务能力本身，只影响桌面端工具链和操作偏好。"
            icon={Sparkles}
          >
            <div className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div className="rounded-[22px] border border-border/60 bg-background/60 p-4">
                `Skill` 同步方式决定仓库内技能文件如何同步到各产品工作目录。
              </div>
              <div className="rounded-[22px] border border-border/60 bg-background/60 p-4">
                首选终端会影响从产品卡片直接打开命令行时的目标程序。
              </div>
            </div>
          </SettingsPanel>
        </motion.div>
      );
    }

    if (activeTab === "about") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="space-y-5"
        >
          <SettingsPanel
            title={t("common.about")}
            description="查看当前版本、便携模式状态和设备环境信息。"
            icon={Info}
          >
            <AboutSection isPortable={isPortable} />
          </SettingsPanel>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="space-y-4"
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-auto px-5 pb-5 pt-4 lg:px-6 lg:pb-6 lg:pt-5">
      {isBusy ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid min-h-0 min-w-[980px] flex-1 grid-cols-[320px_minmax(0,1fr)] gap-5">
          <aside className="relative flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.98)_0%,hsl(var(--surface-3)/0.92)_100%)] p-4 shadow-[0_24px_70px_-42px_hsl(var(--shadow-color)/0.9)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18),transparent_58%)]" />
            <div className="relative flex items-start justify-between gap-3 px-1">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  {t("settings.controlCenter.centerEyebrow", {
                    defaultValue: "Settings Center",
                  })}
                </div>
                <h1 className="mt-2 text-[1.4rem] font-semibold tracking-tight">
                  {t("settings.controlCenter.title", {
                    defaultValue: "控制中心",
                  })}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.controlCenter.centerDescription", {
                    defaultValue: "左侧选择设置分区，右侧编辑对应的配置内容。",
                  })}
                </p>
              </div>
              {showCloseButton ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-10 w-10 rounded-2xl border-border/70 bg-background/82"
                  title={t("common.back", {
                    defaultValue: "返回",
                  })}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="relative mt-5 rounded-[24px] border border-border/60 bg-background/50 p-2.5 shadow-[inset_0_1px_0_hsl(var(--background)/0.7)]">
              <nav
                role="tablist"
                aria-label={t("settings.title", {
                  defaultValue: "设置",
                })}
                aria-orientation="vertical"
                className="flex min-h-0 flex-col gap-2"
              >
                {settingsSections.map((section, index) => {
                  const isActive = section.value === activeTab;
                  return (
                    <button
                      key={section.value}
                      ref={(node) => {
                        navButtonRefs.current[section.value] = node;
                      }}
                      id={`settings-tab-${section.value}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`settings-panel-${section.value}`}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => handleSelectTab(section.value)}
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                      className={
                        isActive
                          ? "relative rounded-[22px] border border-primary/25 bg-primary/12 p-3.5 text-left shadow-[0_18px_44px_-32px_hsl(var(--primary)/0.5)]"
                          : "relative rounded-[22px] border border-transparent bg-transparent p-3.5 text-left transition-all duration-200 hover:border-border/70 hover:bg-background/88"
                      }
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={
                            isActive
                              ? "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-primary shadow-sm"
                              : "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-background/88 text-muted-foreground"
                          }
                        >
                          <section.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {section.title}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="relative mt-4 rounded-[24px] border border-border/60 bg-background/55 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ActiveSectionIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {activeSection?.title ?? t("settings.title")}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {activeSection?.description ??
                      t("settings.controlCenter.defaultDescription", {
                        defaultValue: "管理应用运行、视觉主题与本地环境配置。",
                      })}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  {activeTab === "directories"
                    ? t("common.save", { defaultValue: "保存后生效" })
                    : t("settings.controlCenter.autoSaveBadge", {
                        defaultValue: "自动保存",
                      })}
                </span>
              </div>
            </div>
          </aside>

          <section
            id={`settings-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`settings-tab-${activeTab}`}
            className="relative flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.96)_0%,hsl(var(--surface-3)/0.9)_100%)] shadow-[0_28px_80px_-48px_hsl(var(--shadow-color)/0.92)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_58%)]" />
            <div className="relative border-b border-border/65 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.95)_0%,hsl(var(--surface-3)/0.88)_100%)] px-6 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <ActiveSectionIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {activeSection?.title ?? t("settings.title")}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        {activeSection?.description ??
                          t("settings.controlCenter.defaultDescription", {
                            defaultValue:
                              "管理应用运行、视觉主题与本地环境配置。",
                          })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  {activeTab === "directories" ? (
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("settings.saving")}
                        </span>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {t("common.save")}
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                      {t("settings.controlCenter.autoSaveBadge", {
                        defaultValue: "自动保存",
                      })}
                    </div>
                  )}

                  {showCloseButton ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenChange(false)}
                      className="h-10 w-10 rounded-2xl text-muted-foreground hover:bg-background/90 hover:text-foreground"
                      title={t("common.close", {
                        defaultValue: "关闭",
                      })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="scroll-overlay relative flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 xl:px-7">
              {renderActiveContent()}
            </div>
          </section>
        </div>
      )}

      <Dialog
        open={showRestartPrompt}
        onOpenChange={(open) => !open && handleRestartLater()}
      >
        <DialogContent zIndex="alert" className="max-w-md glass border-border">
          <DialogHeader>
            <DialogTitle>{t("settings.restartRequired")}</DialogTitle>
          </DialogHeader>
          <div className="px-6">
            <p className="text-sm text-muted-foreground">
              {t("settings.restartRequiredMessage")}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleRestartLater}
              className="hover:bg-muted/50"
            >
              {t("settings.restartLater")}
            </Button>
            <Button
              onClick={handleRestartNow}
              className="bg-primary hover:bg-primary/90"
            >
              {t("settings.restartNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsPanel({
  title,
  description,
  icon: Icon,
  bodyClassName,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.78)_100%)] shadow-[0_18px_44px_-36px_hsl(var(--foreground)/0.28)]">
      <header className="border-b border-border/60 bg-background/55 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </header>
      <div className={bodyClassName ?? "p-5"}>{children}</div>
    </section>
  );
}

function AdvancedItem({
  value,
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
}: {
  value: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.94)_0%,hsl(var(--background)/0.8)_100%)] shadow-[0_18px_42px_-36px_hsl(var(--foreground)/0.28)]"
    >
      <AccordionTrigger className="px-5 py-4 text-left hover:bg-background/80 hover:no-underline data-[state=open]:bg-background/80">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-background/90 shadow-sm">
            <Icon className={`h-4 w-4 ${iconClassName ?? "text-primary"}`} />
          </span>
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="border-t border-border/60 px-5 pb-5 pt-4">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
