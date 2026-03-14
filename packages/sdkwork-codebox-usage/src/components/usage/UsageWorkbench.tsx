import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface UsagePanelProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function UsagePanel({
  title,
  description,
  eyebrow,
  actions,
  children,
  className,
  bodyClassName,
}: UsagePanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[26px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.96)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_24px_58px_-38px_hsl(var(--shadow-color)/0.92)]",
        className,
      )}
    >
      <header className="border-b border-border/60 bg-background/45 px-5 py-4 xl:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? (
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {eyebrow}
              </div>
            ) : null}
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </header>

      <div className={cn("p-5 xl:p-6", bodyClassName)}>{children}</div>
    </section>
  );
}

interface UsagePillProps {
  icon?: ElementType;
  label: string;
  value?: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}

const TONE_CLASSNAME: Record<
  NonNullable<UsagePillProps["tone"]>,
  string
> = {
  neutral: "border-border/60 bg-background/72 text-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
};

export function UsagePill({
  icon: Icon,
  label,
  value,
  tone = "neutral",
  className,
}: UsagePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        TONE_CLASSNAME[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      <span>{label}</span>
      {value !== undefined ? (
        <span className="font-semibold text-foreground">{value}</span>
      ) : null}
    </span>
  );
}

interface UsageEmptyStateProps {
  title: string;
  description: string;
  icon?: ElementType;
  className?: string;
}

export function UsageEmptyState({
  title,
  description,
  icon: Icon,
  className,
}: UsageEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-[22px] border border-dashed border-border/60 bg-background/40 px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? (
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/70 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <h4 className="mt-4 text-base font-semibold text-foreground">{title}</h4>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
