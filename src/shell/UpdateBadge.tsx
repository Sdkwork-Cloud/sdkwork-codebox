import { ArrowUpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdate } from "@/contexts/UpdateContext";
import { Button } from "@/components/ui/button";

interface UpdateBadgeProps {
  appearance?: "icon" | "row";
  className?: string;
  onClick?: () => void;
}

export function UpdateBadge({
  appearance = "icon",
  className = "",
  onClick,
}: UpdateBadgeProps) {
  const { hasUpdate, updateInfo } = useUpdate();
  const { t } = useTranslation();
  const isActive = hasUpdate && updateInfo;
  const title = isActive
    ? t("settings.updateAvailable", {
        version: updateInfo?.availableVersion ?? "",
      })
    : t("settings.checkForUpdates");

  if (!isActive) {
    return null;
  }

  if (appearance === "row") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        className={`h-auto w-full justify-between rounded-[20px] border-primary/20 bg-primary/10 px-4 py-3 text-left text-primary hover:bg-primary/12 ${className}`}
      >
        <span className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-background/90">
            <ArrowUpCircle className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-medium text-foreground">
              {t("settings.updateAvailable", {
                version: updateInfo?.availableVersion ?? "",
              })}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {t("settings.checkForUpdates")}
            </span>
          </span>
        </span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`
        relative h-8 w-8 rounded-full
        ${isActive ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted/60"}
        ${className}
      `}
    >
      <ArrowUpCircle className="h-5 w-5" />
    </Button>
  );
}
