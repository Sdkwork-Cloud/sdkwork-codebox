import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Layers3, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { universalProvidersApi } from "@/lib/api";
import type { UniversalProvider, UniversalProvidersMap } from "@/types";
import type { UniversalProviderPreset } from "@/config/universalProviderPresets";
import { UniversalProviderCard } from "./UniversalProviderCard";
import { UniversalProviderFormModal } from "./UniversalProviderFormModal";

interface UniversalProviderPanelProps {
  initialPreset?: UniversalProviderPreset | null;
  onInitialPresetHandled?: () => void;
}

function MetricPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "accent" | "success";
}) {
  return (
    <span
      className={
        tone === "accent"
          ? "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
          : tone === "success"
            ? "inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
            : "inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/72 px-3 py-1.5 text-xs font-medium text-foreground"
      }
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </span>
  );
}

export function UniversalProviderPanel({
  initialPreset,
  onInitialPresetHandled,
}: UniversalProviderPanelProps = {}) {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<UniversalProvidersMap>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<UniversalProvider | null>(null);
  const [createPreset, setCreatePreset] =
    useState<UniversalProviderPreset | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });
  const [syncConfirm, setSyncConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({ open: false, id: "", name: "" });

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await universalProvidersApi.getAll();
      setProviders(data);
    } catch (error) {
      console.error("Failed to load universal providers:", error);
      toast.error(
        t("universalProvider.loadError", {
          defaultValue: "加载统一供应商失败",
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  useEffect(() => {
    if (!initialPreset) {
      return;
    }

    setEditingProvider(null);
    setCreatePreset(initialPreset);
    setIsFormOpen(true);
    onInitialPresetHandled?.();
  }, [initialPreset, onInitialPresetHandled]);

  const providerList = useMemo(() => Object.values(providers), [providers]);
  const enabledAppCoverage = useMemo(
    () =>
      providerList.reduce((count, provider) => {
        return (
          count +
          Number(provider.apps.claude) +
          Number(provider.apps.codex) +
          Number(provider.apps.gemini)
        );
      }, 0),
    [providerList],
  );

  const handleCreate = useCallback((preset?: UniversalProviderPreset | null) => {
    setEditingProvider(null);
    setCreatePreset(preset ?? null);
    setIsFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setEditingProvider(null);
    setCreatePreset(null);
  }, []);

  const handleSave = useCallback(
    async (provider: UniversalProvider) => {
      try {
        await universalProvidersApi.upsert(provider);

        if (!editingProvider) {
          await universalProvidersApi.sync(provider.id);
        }

        toast.success(
          editingProvider
            ? t("universalProvider.updated", {
                defaultValue: "统一供应商已更新",
              })
            : t("universalProvider.addedAndSynced", {
                defaultValue: "统一供应商已添加并同步",
              }),
        );
        await loadProviders();
        handleFormClose();
      } catch (error) {
        console.error("Failed to save universal provider:", error);
        toast.error(
          t("universalProvider.saveError", {
            defaultValue: "保存统一供应商失败",
          }),
        );
      }
    },
    [editingProvider, handleFormClose, loadProviders, t],
  );

  const handleSaveAndSync = useCallback(
    async (provider: UniversalProvider) => {
      try {
        await universalProvidersApi.upsert(provider);
        await universalProvidersApi.sync(provider.id);
        toast.success(
          t("universalProvider.savedAndSynced", {
            defaultValue: "已保存并同步到所有应用",
          }),
        );
        await loadProviders();
        handleFormClose();
      } catch (error) {
        console.error("Failed to save and sync universal provider:", error);
        toast.error(
          t("universalProvider.saveAndSyncError", {
            defaultValue: "保存并同步失败",
          }),
        );
      }
    },
    [handleFormClose, loadProviders, t],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm.id) {
      return;
    }

    try {
      await universalProvidersApi.delete(deleteConfirm.id);
      toast.success(
        t("universalProvider.deleted", {
          defaultValue: "统一供应商已删除",
        }),
      );
      await loadProviders();
    } catch (error) {
      console.error("Failed to delete universal provider:", error);
      toast.error(
        t("universalProvider.deleteError", {
          defaultValue: "删除统一供应商失败",
        }),
      );
    } finally {
      setDeleteConfirm({ open: false, id: "", name: "" });
    }
  }, [deleteConfirm.id, loadProviders, t]);

  const handleSync = useCallback(async () => {
    if (!syncConfirm.id) {
      return;
    }

    try {
      await universalProvidersApi.sync(syncConfirm.id);
      toast.success(
        t("universalProvider.synced", {
          defaultValue: "已同步到所有应用",
        }),
      );
    } catch (error) {
      console.error("Failed to sync universal provider:", error);
      toast.error(
        t("universalProvider.syncError", {
          defaultValue: "同步统一供应商失败",
        }),
      );
    } finally {
      setSyncConfirm({ open: false, id: "", name: "" });
    }
  }, [syncConfirm.id, t]);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[26px] border border-border/60 bg-[linear-gradient(135deg,hsl(var(--panel-surface)/0.98)_0%,hsl(var(--surface-3)/0.95)_58%,hsl(var(--background)/0.88)_100%)] shadow-[0_26px_62px_-38px_hsl(var(--shadow-color)/0.92)]">
        <div className="pointer-events-none absolute hidden" />
        <div className="relative flex flex-col gap-5 px-6 py-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {t("universalProvider.workbenchEyebrow", {
                defaultValue: "Cross-App Gateway",
              })}
            </div>
            <div>
              <h2 className="text-[1.4rem] font-semibold tracking-tight text-foreground">
                {t("universalProvider.title", { defaultValue: "统一供应商" })}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {t("universalProvider.description", {
                  defaultValue:
                    "统一供应商可以同时管理 Claude、Codex 和 Gemini 的共享接入配置。保存后按需同步，避免三处重复维护。",
                })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <MetricPill
                label={t("universalProvider.providerCount", {
                  defaultValue: "统一供应商数",
                })}
                value={providerList.length}
                tone="accent"
              />
              <MetricPill
                label={t("universalProvider.enabledApps", {
                  defaultValue: "应用映射",
                })}
                value={enabledAppCoverage}
              />
              <MetricPill
                label={t("universalProvider.syncScope", {
                  defaultValue: "同步范围",
                })}
                value="Claude / Codex / Gemini"
                tone="success"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void loadProviders()}
              disabled={loading}
              className="gap-2 border-border/60 bg-background/72"
            >
              <RefreshCw className="h-4 w-4" />
              {t("common.refresh", { defaultValue: "刷新" })}
            </Button>
            <Button onClick={() => handleCreate()} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("universalProvider.add", { defaultValue: "添加统一供应商" })}
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : providerList.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border/60 bg-background/35 px-6 py-12 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-[20px] border border-border/60 bg-background/72 text-muted-foreground">
            <Layers3 className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            {t("universalProvider.empty", {
              defaultValue: "还没有统一供应商",
            })}
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {t("universalProvider.emptyHint", {
              defaultValue:
                "创建一个统一供应商后，就可以在 Claude、Codex 和 Gemini 之间共享同一套网关配置。",
            })}
          </p>
          <Button onClick={() => handleCreate()} className="mt-5 gap-2">
            <Plus className="h-4 w-4" />
            {t("universalProvider.add", { defaultValue: "添加统一供应商" })}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {providerList.map((provider) => (
            <UniversalProviderCard
              key={provider.id}
              provider={provider}
              onEdit={(selectedProvider) => {
                setEditingProvider(selectedProvider);
                setCreatePreset(null);
                setIsFormOpen(true);
              }}
              onDelete={(id) => {
                const providerToDelete = providers[id];
                setDeleteConfirm({
                  open: true,
                  id,
                  name: providerToDelete?.name || id,
                });
              }}
              onSync={(id) => {
                const providerToSync = providers[id];
                setSyncConfirm({
                  open: true,
                  id,
                  name: providerToSync?.name || id,
                });
              }}
            />
          ))}
        </div>
      )}

      <UniversalProviderFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSave}
        onSaveAndSync={handleSaveAndSync}
        editingProvider={editingProvider}
        initialPreset={createPreset}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        title={t("universalProvider.deleteConfirmTitle", {
          defaultValue: "删除统一供应商",
        })}
        message={t("universalProvider.deleteConfirmDescription", {
          defaultValue: `确定要删除 "${deleteConfirm.name}" 吗？这将同时删除它在各应用中生成的供应商配置。`,
          name: deleteConfirm.name,
        })}
        confirmText={t("common.delete", { defaultValue: "删除" })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, id: "", name: "" })}
      />

      <ConfirmDialog
        isOpen={syncConfirm.open}
        title={t("universalProvider.syncConfirmTitle", {
          defaultValue: "同步统一供应商",
        })}
        message={t("universalProvider.syncConfirmDescription", {
          defaultValue: `同步 "${syncConfirm.name}" 将会覆盖 Claude、Codex 和 Gemini 中关联的供应商配置。确定要继续吗？`,
          name: syncConfirm.name,
        })}
        confirmText={t("universalProvider.syncConfirm", {
          defaultValue: "同步",
        })}
        onConfirm={handleSync}
        onCancel={() => setSyncConfirm({ open: false, id: "", name: "" })}
      />
    </div>
  );
}
