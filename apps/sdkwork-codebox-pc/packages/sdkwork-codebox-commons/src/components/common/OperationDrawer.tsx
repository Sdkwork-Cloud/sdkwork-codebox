import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface OperationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  eyebrow?: string;
  badge?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  sidebarClassName?: string;
  testId?: string;
}

export function OperationDrawer({
  open,
  onOpenChange,
  title,
  description,
  eyebrow,
  badge,
  sidebar,
  footer,
  children,
  bodyClassName,
  sidebarClassName,
  testId,
}: OperationDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="drawer-right"
        zIndex="alert"
        overlayClassName="bg-[hsl(var(--background)/0.58)] backdrop-blur-sm"
        className="border-border/70 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.985)_0%,hsl(var(--surface-3)/0.95)_100%)] p-0"
      >
        <div
          data-testid={testId}
          className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_60%)]" />

          <header className="relative border-b border-border/65 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.97)_0%,hsl(var(--surface-3)/0.92)_100%)] px-5 py-4 xl:px-6">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                {eyebrow ? (
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    {eyebrow}
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-[1.45rem] font-semibold tracking-tight text-foreground">
                    {title}
                  </h2>
                  {badge ? badge : null}
                </div>
                {description ? (
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-10 w-10 rounded-2xl border border-border/60 bg-background/72 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <div
              data-testid="operation-drawer-body"
              className={cn(
                "scroll-overlay min-h-0 flex-1 overflow-y-auto px-4 py-4 xl:px-5",
                bodyClassName,
              )}
            >
              {children}
            </div>

            {sidebar ? (
              <aside
                className={cn(
                  "hidden w-[320px] flex-shrink-0 border-l border-border/60 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.92)_0%,hsl(var(--background)/0.84)_100%)] xl:flex xl:min-h-0 xl:flex-col",
                  sidebarClassName,
                )}
              >
                <div className="scroll-overlay min-h-0 flex-1 overflow-y-auto p-5">
                  {sidebar}
                </div>
              </aside>
            ) : null}
          </div>

          {footer ? (
            <div className="relative border-t border-border/65 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.95)_0%,hsl(var(--surface-3)/0.91)_100%)] px-5 py-3.5 xl:px-6">
              <div className="flex flex-wrap items-center justify-end gap-3">
                {footer}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
