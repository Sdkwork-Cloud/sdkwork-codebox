import { Download, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AppId } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ProviderEmptyStateProps {
  appId: AppId;
  onCreate?: () => void;
  onImport?: () => void;
}

export function ProviderEmptyState({
  appId,
  onCreate,
  onImport,
}: ProviderEmptyStateProps) {
  const { t } = useTranslation();
  const showSnippetHint =
    appId === "claude" || appId === "codex" || appId === "gemini";

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center">
      <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-[28px] border border-dashed border-border/80 bg-background/65 px-8 py-14 text-center shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)] backdrop-blur-sm">
        <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-muted/80 shadow-inner">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{t("provider.noProviders")}</h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {t("provider.noProvidersDescription")}
        </p>
        {showSnippetHint && (
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("provider.noProvidersDescriptionSnippet")}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {onImport && (
            <Button onClick={onImport} className="min-w-40">
              <Download className="mr-2 h-4 w-4" />
              {t("provider.importCurrent")}
            </Button>
          )}
          {onCreate && (
            <Button
              variant={onImport ? "outline" : "default"}
              onClick={onCreate}
              className="min-w-40"
            >
              {t("provider.addProvider")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
