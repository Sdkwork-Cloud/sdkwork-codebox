import {
  Activity,
  Brain,
  CalendarDays,
  Circle,
  FileCode,
  FolderOpen,
  FolderTree,
  Heart,
  IdCard,
  Plus,
  Power,
  Rocket,
  Save,
  Search,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import MarkdownEditor from "@/components/MarkdownEditor";
import {
  workspaceApi,
  type DailyMemorySearchResult,
} from "@/lib/api/workspace";
import { cn } from "@/lib/utils";

interface WorkspaceFile {
  filename: string;
  icon: LucideIcon;
  descKey: string;
}

type ExplorerFolder = "workspace" | "memory";
type EditorTabKind = "workspace" | "memory";

interface EditorTabState {
  id: string;
  kind: EditorTabKind;
  filename: string;
  content: string;
  savedContent: string;
  isLoading: boolean;
}

const WORKSPACE_FILES: WorkspaceFile[] = [
  { filename: "AGENTS.md", icon: FileCode, descKey: "workspace.files.agents" },
  { filename: "SOUL.md", icon: Heart, descKey: "workspace.files.soul" },
  { filename: "USER.md", icon: User, descKey: "workspace.files.user" },
  {
    filename: "IDENTITY.md",
    icon: IdCard,
    descKey: "workspace.files.identity",
  },
  { filename: "TOOLS.md", icon: Wrench, descKey: "workspace.files.tools" },
  { filename: "MEMORY.md", icon: Brain, descKey: "workspace.files.memory" },
  {
    filename: "HEARTBEAT.md",
    icon: Activity,
    descKey: "workspace.files.heartbeat",
  },
  {
    filename: "BOOTSTRAP.md",
    icon: Rocket,
    descKey: "workspace.files.bootstrap",
  },
  { filename: "BOOT.md", icon: Power, descKey: "workspace.files.boot" },
];

function getTodayFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}.md`;
}

function createTabId(kind: EditorTabKind, filename: string) {
  return `${kind}:${filename}`;
}

function stripMarkdownExtension(filename: string) {
  return filename.replace(/\.md$/i, "");
}

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function isSearchResult(
  value:
    | DailyMemorySearchResult
    | {
        filename: string;
        date: string;
        preview: string;
        modifiedAt: number;
      },
): value is DailyMemorySearchResult {
  return "matchCount" in value;
}

const WorkspaceFilesPanel: React.FC = () => {
  const { t } = useTranslation();
  const [fileExists, setFileExists] = useState<Record<string, boolean>>({});
  const [dailyMemoryFiles, setDailyMemoryFiles] = useState<
    Array<{
      filename: string;
      date: string;
      preview: string;
      modifiedAt: number;
    }>
  >([]);
  const [memorySearchResults, setMemorySearchResults] = useState<
    DailyMemorySearchResult[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingMemory, setIsSearchingMemory] = useState(false);
  const [activeFolder, setActiveFolder] = useState<ExplorerFolder>("workspace");
  const [openTabs, setOpenTabs] = useState<EditorTabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const activeTab = useMemo(
    () => openTabs.find((tab) => tab.id === activeTabId) ?? null,
    [activeTabId, openTabs],
  );

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const refreshWorkspaceInventory = async () => {
    const results = await Promise.all(
      WORKSPACE_FILES.map(async (file) => {
        try {
          const content = await workspaceApi.readFile(file.filename);
          return [file.filename, content !== null] as const;
        } catch {
          return [file.filename, false] as const;
        }
      }),
    );

    setFileExists(Object.fromEntries(results));
  };

  const refreshDailyMemoryFiles = async () => {
    try {
      const files = await workspaceApi.listDailyMemoryFiles();
      setDailyMemoryFiles(
        [...files]
          .sort((left, right) => right.date.localeCompare(left.date))
          .map((file) => ({
            filename: file.filename,
            date: file.date,
            preview: file.preview,
            modifiedAt: file.modifiedAt,
          })),
      );
    } catch (error) {
      console.error("Failed to load daily memory files:", error);
      toast.error(t("workspace.dailyMemory.loadFailed"));
    }
  };

  useEffect(() => {
    void refreshWorkspaceInventory();
    void refreshDailyMemoryFiles();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setMemorySearchResults((previous) =>
        previous.length === 0 ? previous : [],
      );
      setIsSearchingMemory((previous) => (previous ? false : previous));
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearchingMemory(true);
      try {
        const results = await workspaceApi.searchDailyMemoryFiles(query);
        setMemorySearchResults(results);
      } catch (error) {
        console.error("Failed to search daily memory files:", error);
        toast.error(t("workspace.dailyMemory.searchFailed"));
      } finally {
        setIsSearchingMemory(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchQuery, t]);

  const workspaceItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return WORKSPACE_FILES;
    }

    return WORKSPACE_FILES.filter((file) => {
      const description = t(file.descKey, { defaultValue: file.filename });
      return (
        file.filename.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, t]);

  const memoryItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return dailyMemoryFiles;
    }

    return memorySearchResults;
  }, [dailyMemoryFiles, memorySearchResults, searchQuery]);

  const openTab = async (kind: EditorTabKind, filename: string) => {
    const tabId = createTabId(kind, filename);
    const existing = openTabs.find((tab) => tab.id === tabId);

    setActiveFolder(kind);

    if (existing) {
      setActiveTabId(tabId);
      return;
    }

    setOpenTabs((previous) => [
      ...previous,
      {
        id: tabId,
        kind,
        filename,
        content: "",
        savedContent: "",
        isLoading: true,
      },
    ]);
    setActiveTabId(tabId);

    try {
      const content =
        kind === "workspace"
          ? await workspaceApi.readFile(filename)
          : await workspaceApi.readDailyMemoryFile(filename);

      setOpenTabs((previous) =>
        previous.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                content: content ?? "",
                savedContent: content ?? "",
                isLoading: false,
              }
            : tab,
        ),
      );
    } catch (error) {
      console.error("Failed to open workspace tab:", error);
      toast.error(
        kind === "workspace"
          ? t("workspace.loadFailed")
          : t("workspace.dailyMemory.loadFailed"),
      );
      setOpenTabs((previous) => previous.filter((tab) => tab.id !== tabId));
      setActiveTabId((current) => (current === tabId ? null : current));
    }
  };

  const handleCreateTodayMemory = async () => {
    const filename = getTodayFilename();
    const existingFile = dailyMemoryFiles.find(
      (file) => file.filename === filename,
    );
    const tabId = createTabId("memory", filename);

    setActiveFolder("memory");

    if (openTabs.some((tab) => tab.id === tabId)) {
      setActiveTabId(tabId);
      return;
    }

    if (existingFile) {
      await openTab("memory", filename);
      return;
    }

    setOpenTabs((previous) => [
      ...previous,
      {
        id: tabId,
        kind: "memory",
        filename,
        content: "",
        savedContent: "",
        isLoading: false,
      },
    ]);
    setActiveTabId(tabId);
  };

  const closeTab = (tabId: string) => {
    setOpenTabs((previous) => {
      const index = previous.findIndex((tab) => tab.id === tabId);
      if (index === -1) {
        return previous;
      }

      const nextTabs = previous.filter((tab) => tab.id !== tabId);
      setActiveTabId((current) => {
        if (current !== tabId) {
          return current;
        }

        const fallback = nextTabs[index] ?? nextTabs[index - 1] ?? null;
        return fallback?.id ?? null;
      });

      return nextTabs;
    });
  };

  const handleSaveCurrentFile = async () => {
    if (!activeTab || activeTab.isLoading) {
      return;
    }

    try {
      if (activeTab.kind === "workspace") {
        await workspaceApi.writeFile(activeTab.filename, activeTab.content);
        await refreshWorkspaceInventory();
      } else {
        await workspaceApi.writeDailyMemoryFile(
          activeTab.filename,
          activeTab.content,
        );
        await refreshDailyMemoryFiles();
      }

      setOpenTabs((previous) =>
        previous.map((tab) =>
          tab.id === activeTab.id ? { ...tab, savedContent: tab.content } : tab,
        ),
      );
      toast.success(t("workspace.saveSuccess"));
    } catch (error) {
      console.error("Failed to save workspace tab:", error);
      toast.error(t("workspace.saveFailed"));
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isModifierPressed = event.metaKey || event.ctrlKey;

      if (!isModifierPressed) {
        return;
      }

      if (key === "p") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (key === "s" && activeTab && !activeTab.isLoading) {
        event.preventDefault();
        void handleSaveCurrentFile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, handleSaveCurrentFile]);

  const handleDeleteCurrentFile = async () => {
    if (!deleteTargetId) {
      return;
    }

    const targetTab = openTabs.find((tab) => tab.id === deleteTargetId);
    if (!targetTab || targetTab.kind !== "memory") {
      setDeleteTargetId(null);
      return;
    }

    try {
      await workspaceApi.deleteDailyMemoryFile(targetTab.filename);
      toast.success(t("workspace.dailyMemory.deleteSuccess"));
      closeTab(targetTab.id);
      await refreshDailyMemoryFiles();
    } catch (error) {
      console.error("Failed to delete daily memory file:", error);
      toast.error(t("workspace.dailyMemory.deleteFailed"));
    } finally {
      setDeleteTargetId(null);
    }
  };

  const renderExplorerFile = (file: WorkspaceFile) => {
    const Icon = file.icon;
    const tabId = createTabId("workspace", file.filename);
    const isActive = activeTabId === tabId;
    const exists = fileExists[file.filename];

    return (
      <button
        key={file.filename}
        type="button"
        onClick={() => void openTab("workspace", file.filename)}
        className={cn(
          "group flex w-full items-start gap-3 rounded-[20px] border px-3 py-3 text-left transition-all duration-200",
          isActive
            ? "border-primary/24 bg-primary/10 shadow-[0_18px_42px_-30px_hsl(var(--primary)/0.48)]"
            : "border-transparent bg-background/38 hover:border-border/60 hover:bg-background/56",
        )}
      >
        <span
          className={cn(
            "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
            isActive
              ? "border-primary/20 bg-primary/12 text-primary"
              : "border-border/70 bg-background/72 text-muted-foreground group-hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {file.filename}
            </span>
            {exists ? (
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </span>
          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
            {t(file.descKey)}
          </span>
        </span>
      </button>
    );
  };

  const renderMemoryFile = (
    file:
      | DailyMemorySearchResult
      | {
          filename: string;
          date: string;
          preview: string;
          modifiedAt: number;
        },
  ) => {
    const tabId = createTabId("memory", file.filename);
    const isActive = activeTabId === tabId;
    const preview = isSearchResult(file) ? file.snippet : file.preview;

    return (
      <button
        key={file.filename}
        type="button"
        onClick={() => void openTab("memory", file.filename)}
        className={cn(
          "group flex w-full items-start gap-3 rounded-[20px] border px-3 py-3 text-left transition-all duration-200",
          isActive
            ? "border-primary/24 bg-primary/10 shadow-[0_18px_42px_-30px_hsl(var(--primary)/0.48)]"
            : "border-transparent bg-background/38 hover:border-border/60 hover:bg-background/56",
        )}
      >
        <span
          className={cn(
            "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
            isActive
              ? "border-primary/20 bg-primary/12 text-primary"
              : "border-border/70 bg-background/72 text-muted-foreground group-hover:text-foreground",
          )}
        >
          <CalendarDays className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold text-foreground">
              {file.date}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatDateTime(file.modifiedAt)}
            </span>
          </span>
          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
            {preview || t("workspace.dailyMemory.empty")}
          </span>
          {isSearchResult(file) && (
            <span className="mt-2 inline-flex rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground">
              {t("workspace.dailyMemory.matchCount", {
                count: file.matchCount,
              })}
            </span>
          )}
        </span>
      </button>
    );
  };

  const renderFolderOverview = () => {
    if (activeFolder === "memory") {
      return (
        <div className="flex h-full flex-col">
          <div className="border-b border-border/65 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  记忆目录
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  浏览 Daily Memory 文件，支持多标签打开、编辑和删除当前记忆。
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => workspaceApi.openDirectory("memory")}
                  className="rounded-2xl border-border/70 bg-background/80"
                >
                  <FolderOpen className="h-4 w-4" />
                  打开目录
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleCreateTodayMemory()}
                  className="rounded-2xl"
                >
                  <Plus className="h-4 w-4" />
                  新建今日记忆
                </Button>
              </div>
            </div>
          </div>

          <div className="grid flex-1 gap-4 p-6 xl:grid-cols-2">
            <div className="rounded-[24px] border border-border/70 bg-background/46 p-5">
              <div className="text-sm font-semibold text-foreground">
                当前目录
              </div>
              <div className="mt-2 text-xs leading-6 text-muted-foreground">
                ~/.openclaw/workspace/memory/
              </div>
              <div className="mt-4 text-xs leading-6 text-muted-foreground">
                适合按天记录工作轨迹、上下文摘要和长期记忆补充。
              </div>
            </div>

            <div className="rounded-[24px] border border-border/70 bg-background/46 p-5">
              <div className="text-sm font-semibold text-foreground">
                操作建议
              </div>
              <div className="mt-2 text-xs leading-6 text-muted-foreground">
                左侧选择具体日期会在右侧打开编辑标签，多个记忆文件可以并行切换。
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/65 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                工作区目录
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                左侧文件资源树承载 OpenClaw
                的核心上下文文件，点击即可在右侧编辑器中打开。
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => workspaceApi.openDirectory("workspace")}
              className="rounded-2xl border-border/70 bg-background/80"
            >
              <FolderOpen className="h-4 w-4" />
              打开目录
            </Button>
          </div>
        </div>

        <div className="grid flex-1 gap-4 p-6 xl:grid-cols-2">
          <div className="rounded-[24px] border border-border/70 bg-background/46 p-5">
            <div className="text-sm font-semibold text-foreground">
              当前目录
            </div>
            <div className="mt-2 text-xs leading-6 text-muted-foreground">
              ~/.openclaw/workspace/
            </div>
            <div className="mt-4 text-xs leading-6 text-muted-foreground">
              这些文件决定 Agent
              行为、记忆、人格和启动流程，是产品工作域的核心配置面板。
            </div>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-background/46 p-5">
            <div className="text-sm font-semibold text-foreground">
              操作建议
            </div>
            <div className="mt-2 text-xs leading-6 text-muted-foreground">
              保持 AGENTS、MEMORY、TOOLS
              等文件拆分清晰，可以让工作流更可控、更易追踪。
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col px-8 pb-8 pt-6">
        <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="relative flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.98)_0%,hsl(var(--surface-3)/0.92)_100%)] shadow-[0_24px_70px_-42px_hsl(var(--shadow-color)/0.9)]">
            <div className="border-b border-border/65 px-4 py-4">
              <div className="flex items-center gap-2 rounded-[18px] border border-border/70 bg-background/62 px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("workspace.search", {
                    defaultValue: "搜索文件、记忆或日期",
                  })}
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <span className="hidden rounded-full border border-border/60 bg-background/72 px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
                  Ctrl/Cmd+P
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="space-y-3">
                <section className="rounded-[24px] border border-border/65 bg-background/36 p-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFolder("workspace");
                        setActiveTabId(null);
                      }}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3 py-2.5 text-left transition-colors",
                        activeFolder === "workspace" && !activeTab
                          ? "bg-primary/10 text-foreground"
                          : "hover:bg-background/58",
                      )}
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/70 text-muted-foreground">
                        <FolderTree className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          Workspace 文件
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {WORKSPACE_FILES.length} files
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => workspaceApi.openDirectory("workspace")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/72 text-muted-foreground transition-colors hover:text-foreground"
                      title={t("workspace.openDirectory")}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-1">
                    {workspaceItems.map(renderExplorerFile)}
                  </div>
                </section>

                <section className="rounded-[24px] border border-border/65 bg-background/36 p-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFolder("memory");
                        setActiveTabId(null);
                      }}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3 py-2.5 text-left transition-colors",
                        activeFolder === "memory" && !activeTab
                          ? "bg-primary/10 text-foreground"
                          : "hover:bg-background/58",
                      )}
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background/70 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          Daily Memory
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {searchQuery.trim()
                            ? `${memoryItems.length} results`
                            : `${dailyMemoryFiles.length} files`}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => workspaceApi.openDirectory("memory")}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-background/72 text-muted-foreground transition-colors hover:text-foreground"
                      title={t("workspace.openDirectory")}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-2 space-y-1">
                    {isSearchingMemory ? (
                      <div className="rounded-[18px] border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
                        {t("workspace.dailyMemory.searching")}
                      </div>
                    ) : memoryItems.length > 0 ? (
                      memoryItems.map(renderMemoryFile)
                    ) : (
                      <div className="rounded-[18px] border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
                        {searchQuery.trim()
                          ? t("workspace.dailyMemory.noSearchResults")
                          : t("workspace.dailyMemory.empty")}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </aside>

          <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-border/70 bg-[linear-gradient(180deg,hsl(var(--surface-2)/0.96)_0%,hsl(var(--surface-3)/0.9)_100%)] shadow-[0_28px_80px_-48px_hsl(var(--shadow-color)/0.92)]">
            <div className="border-b border-border/65 bg-background/28 px-3 py-3">
              <div
                className="flex items-center gap-2 overflow-x-auto"
                role="tablist"
                aria-label={t("workspace.title", { defaultValue: "Workspace" })}
              >
                {openTabs.length === 0 ? (
                  <span className="px-3 text-sm text-muted-foreground">
                    {t("workspace.manage", { defaultValue: "Workspace" })}
                  </span>
                ) : (
                  openTabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    const isDirty = tab.content !== tab.savedContent;

                    return (
                      <div
                        key={tab.id}
                        className={cn(
                          "group inline-flex items-center gap-2 rounded-[18px] border pr-2 transition-all duration-200",
                          isActive
                            ? "border-primary/24 bg-primary/10 text-foreground"
                            : "border-border/70 bg-background/62 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => {
                            setActiveFolder(tab.kind);
                            setActiveTabId(tab.id);
                          }}
                          className="inline-flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm font-medium"
                        >
                          {tab.kind === "workspace" ? (
                            <FileCode className="h-3.5 w-3.5" />
                          ) : (
                            <CalendarDays className="h-3.5 w-3.5" />
                          )}
                          <span>{tab.filename}</span>
                          {isDirty && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => closeTab(tab.id)}
                          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-background/72 hover:text-foreground"
                          title={t("common.close", { defaultValue: "关闭" })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {activeTab ? (
              <>
                <div className="border-b border-border/65 px-6 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-base font-semibold text-foreground">
                          {activeTab.filename}
                        </span>
                        {activeTab.content !== activeTab.savedContent && (
                          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">
                            未保存
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {activeTab.kind === "workspace"
                          ? "~/.openclaw/workspace/"
                          : "~/.openclaw/workspace/memory/"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {activeTab.kind === "memory" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteTargetId(activeTab.id)}
                          className="rounded-2xl border-border/70 bg-background/80 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          删除当前文件
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={() => void handleSaveCurrentFile()}
                        disabled={activeTab.isLoading}
                        className="rounded-2xl"
                        title="Ctrl/Cmd+S"
                      >
                        <Save className="h-4 w-4" />
                        {t("common.save")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col p-4">
                  {activeTab.isLoading ? (
                    <div className="flex flex-1 items-center justify-center rounded-[24px] border border-dashed border-border/70 bg-background/34 text-sm text-muted-foreground">
                      {t("prompts.loading")}
                    </div>
                  ) : (
                    <div className="flex min-h-0 flex-1 rounded-[24px] border border-border/70 bg-background/42 p-3">
                      <MarkdownEditor
                        value={activeTab.content}
                        onChange={(value) => {
                          setOpenTabs((previous) =>
                            previous.map((tab) =>
                              tab.id === activeTab.id
                                ? { ...tab, content: value }
                                : tab,
                            ),
                          );
                        }}
                        darkMode={isDarkMode}
                        placeholder={`# ${stripMarkdownExtension(activeTab.filename)}\n\n`}
                        className="h-full flex-1 border-border/60"
                        minHeight="520px"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              renderFolderOverview()
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title={t("workspace.dailyMemory.confirmDeleteTitle")}
        message={t("workspace.dailyMemory.confirmDeleteMessage", {
          date: deleteTargetId
            ? stripMarkdownExtension(deleteTargetId.replace(/^memory:/, ""))
            : "",
        })}
        onConfirm={() => void handleDeleteCurrentFile()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  );
};

export default WorkspaceFilesPanel;
