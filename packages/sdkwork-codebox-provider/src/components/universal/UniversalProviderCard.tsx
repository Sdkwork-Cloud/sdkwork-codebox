import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Edit2, Globe, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderIcon } from "@/components/ProviderIcon";
import { cn } from "@/lib/utils";
import type { UniversalProvider } from "@/types";

interface UniversalProviderCardProps {
  provider: UniversalProvider;
  onEdit: (provider: UniversalProvider) => void;
  onDelete: (id: string) => void;
  onSync: (id: string) => void;
}

const APP_VISUALS = {
  claude: {
    label: "Claude",
    className:
      "border-[hsl(var(--primary)/0.18)] bg-[hsl(var(--primary)/0.1)] text-primary",
  },
  codex: {
    label: "Codex",
    className:
      "border-[hsl(var(--shell-glow-secondary)/0.18)] bg-[hsl(var(--shell-glow-secondary)/0.1)] text-[hsl(var(--shell-glow-secondary))]",
  },
  gemini: {
    label: "Gemini",
    className:
      "border-amber-500/18 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
} as const;

export function UniversalProviderCard({
  provider,
  onEdit,
  onDelete,
  onSync,
}: UniversalProviderCardProps) {
  const { t } = useTranslation();

  const enabledApps = useMemo(
    () =>
      (Object.entries(provider.apps) as Array<
        [keyof typeof APP_VISUALS, boolean]
      >).filter(([, enabled]) => enabled),
    [provider.apps],
  );

  const configuredModelCount = useMemo(
    () =>
      Object.values(provider.models || {}).filter(
        (value) => value && Object.keys(value).length > 0,
      ).length,
    [provider.models],
  );

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)] p-5 shadow-[0_24px_58px_-38px_hsl(var(--shadow-color)/0.92)] transition-colors hover:border-border">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_68%)]" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-border/60 bg-background/72">
            <ProviderIcon
              icon={provider.icon}
              name={provider.name}
              size={22}
              color={provider.iconColor}
            />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">
              {provider.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {provider.providerType}
              </span>
              <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-2.5 py-1 text-[11px] font-medium text-foreground">
                {t("universalProvider.enabledApps", {
                  defaultValue: "应用",
                })}
                : {enabledApps.length}
              </span>
              <span className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-2.5 py-1 text-[11px] font-medium text-foreground">
                {t("universalProvider.modelConfig", {
                  defaultValue: "模型",
                })}
                : {configuredModelCount}
              </span>
            </div>
          </div>
        </div>

        <div
          data-testid="universal-provider-card-actions"
          className="flex shrink-0 items-center gap-1.5"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-border/60 bg-background/72"
            onClick={() => onSync(provider.id)}
            title={t("universalProvider.sync", { defaultValue: "同步到应用" })}
            aria-label={t("universalProvider.sync", {
              defaultValue: "同步到应用",
            })}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-border/60 bg-background/72"
            onClick={() => onEdit(provider)}
            title={t("common.edit", { defaultValue: "编辑" })}
            aria-label={t("common.edit", { defaultValue: "编辑" })}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-destructive/20 bg-destructive/10 text-destructive hover:text-destructive"
            onClick={() => onDelete(provider.id)}
            title={t("common.delete", { defaultValue: "删除" })}
            aria-label={t("common.delete", { defaultValue: "删除" })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative mt-5 space-y-4">
        <div className="rounded-[18px] border border-border/55 bg-background/48 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            {t("universalProvider.baseUrl", { defaultValue: "API 地址" })}
          </div>
          <div className="mt-2 truncate text-sm text-foreground" title={provider.baseUrl}>
            {provider.baseUrl || "-"}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {enabledApps.length > 0 ? (
            enabledApps.map(([appId]) => (
              <span
                key={appId}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
                  APP_VISUALS[appId].className,
                )}
              >
                {APP_VISUALS[appId].label}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("universalProvider.noAppsEnabled", {
                defaultValue: "未启用任何应用",
              })}
            </span>
          )}
        </div>

        {provider.notes ? (
          <div className="rounded-[18px] border border-border/55 bg-background/42 px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("universalProvider.notes", { defaultValue: "备注" })}
            </div>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {provider.notes}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
