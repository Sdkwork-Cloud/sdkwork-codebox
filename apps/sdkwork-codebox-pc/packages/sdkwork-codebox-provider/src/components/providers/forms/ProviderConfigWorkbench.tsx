import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ProviderConfigWorkbenchTab {
  value: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  content: ReactNode;
}

interface ProviderConfigWorkbenchProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: ProviderConfigWorkbenchTab[];
  railHeader?: ReactNode;
}

export function ProviderConfigWorkbench({
  value,
  onValueChange,
  tabs,
  railHeader,
}: ProviderConfigWorkbenchProps) {
  const { t } = useTranslation();

  return (
    <Tabs
      data-testid="provider-config-workbench"
      value={value}
      onValueChange={onValueChange}
      className="grid gap-4 xl:grid-cols-[172px_minmax(0,1fr)]"
    >
      <aside className="min-w-0 xl:sticky xl:top-1 xl:self-start">
        <section className="overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.95)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_18px_38px_-34px_hsl(var(--foreground)/0.24)]">
          <header className="border-b border-border/60 bg-background/55 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("provider.configFiles", {
                defaultValue: "配置文件",
              })}
            </h3>
          </header>

          {railHeader ? (
            <div className="border-b border-border/60 px-4 py-3">
              {railHeader}
            </div>
          ) : null}

          <div className="p-2.5">
            <TabsList className="flex w-full flex-col items-stretch gap-2 bg-transparent p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="h-auto min-w-0 justify-start rounded-[16px] border border-border/60 bg-background/62 px-3 py-2.5 text-left whitespace-normal data-[state=active]:border-primary/24 data-[state=active]:bg-[linear-gradient(180deg,hsl(var(--primary)/0.14)_0%,hsl(var(--panel-surface)/0.92)_100%)] data-[state=active]:text-foreground data-[state=inactive]:text-foreground data-[state=inactive]:hover:bg-background/80"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs font-semibold text-foreground">
                      {tab.title}
                    </span>
                    {tab.description ? (
                      <span
                        aria-hidden="true"
                        className="mt-1 block text-[11px] leading-5 text-muted-foreground"
                      >
                        {tab.description}
                      </span>
                    ) : null}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </section>
      </aside>

      <div className="min-w-0">
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            <section className="overflow-hidden rounded-[22px] border border-border/60 bg-[linear-gradient(180deg,hsl(var(--panel-surface)/0.95)_0%,hsl(var(--background)/0.84)_100%)] shadow-[0_18px_38px_-34px_hsl(var(--foreground)/0.24)]">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/55 px-4 py-3">
                <div className="min-w-0">
                  <div className="inline-flex items-center rounded-full border border-border/60 bg-background/72 px-3 py-1 font-mono text-xs font-semibold text-foreground">
                    {tab.title}
                  </div>
                  {tab.description ? (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {tab.description}
                    </p>
                  ) : null}
                </div>
                {tab.actions ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {tab.actions}
                  </div>
                ) : null}
              </header>

              <div className="p-4 xl:p-5">{tab.content}</div>
            </section>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
