import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkspaceFilesPanel from "@/components/workspace/WorkspaceFilesPanel";

const { workspaceApiMock } = vi.hoisted(() => ({
  workspaceApiMock: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    listDailyMemoryFiles: vi.fn(),
    readDailyMemoryFile: vi.fn(),
    writeDailyMemoryFile: vi.fn(),
    deleteDailyMemoryFile: vi.fn(),
    searchDailyMemoryFiles: vi.fn(),
    openDirectory: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/api/workspace", () => ({
  workspaceApi: workspaceApiMock,
}));

vi.mock("@/components/MarkdownEditor", () => ({
  default: ({ value, onChange, placeholder }: any) => (
    <textarea
      aria-label="workspace-editor"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: React.forwardRef(
    ({ value, onChange, placeholder, ...props }: any, ref) => (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    ),
  ),
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <div>
        <button onClick={() => onConfirm()}>confirm-delete</button>
        <button onClick={() => onCancel()}>cancel-delete</button>
      </div>
    ) : null,
}));

describe("WorkspaceFilesPanel", () => {
  const flushAsync = async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-14T09:00:00Z"));
    vi.clearAllMocks();
    workspaceApiMock.readFile.mockImplementation(async (filename: string) =>
      filename === "AGENTS.md" ? "# agents" : null,
    );
    workspaceApiMock.writeFile.mockResolvedValue(undefined);
    workspaceApiMock.listDailyMemoryFiles.mockResolvedValue([
      {
        filename: "2026-03-14.md",
        date: "2026-03-14",
        sizeBytes: 120,
        modifiedAt: Date.now(),
        preview: "daily-preview",
      },
    ]);
    workspaceApiMock.readDailyMemoryFile.mockResolvedValue("# daily memory");
    workspaceApiMock.writeDailyMemoryFile.mockResolvedValue(undefined);
    workspaceApiMock.deleteDailyMemoryFile.mockResolvedValue(undefined);
    workspaceApiMock.searchDailyMemoryFiles.mockResolvedValue([]);
    workspaceApiMock.openDirectory.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders explorer folders and opens files into managed editor tabs", async () => {
    render(<WorkspaceFilesPanel />);
    await flushAsync();

    expect(screen.getByText("Workspace 文件")).toBeInTheDocument();
    expect(screen.getByText("Daily Memory")).toBeInTheDocument();

    fireEvent.click(screen.getByText("AGENTS.md"));
    await flushAsync();

    expect(screen.getByDisplayValue("# agents")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "AGENTS.md" })).toBeInTheDocument();

    fireEvent.click(screen.getByText("2026-03-14"));
    await flushAsync();

    expect(screen.getByDisplayValue("# daily memory")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "2026-03-14.md" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "AGENTS.md" }));
    expect(screen.getByDisplayValue("# agents")).toBeInTheDocument();
  });

  it("supports folder switching, saving, creating and deleting daily memory files", async () => {
    render(<WorkspaceFilesPanel />);
    await flushAsync();

    fireEvent.click(screen.getByText("Daily Memory"));
    expect(screen.getByText("记忆目录")).toBeInTheDocument();

    fireEvent.click(screen.getByText("新建今日记忆"));
    await flushAsync();

    expect(
      screen.getByRole("tab", { name: "2026-03-14.md" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("workspace-editor"), {
      target: { value: "# new note" },
    });
    fireEvent.click(screen.getByText("common.save"));
    await flushAsync();

    expect(workspaceApiMock.writeDailyMemoryFile).toHaveBeenCalledWith(
      "2026-03-14.md",
      "# new note",
    );

    fireEvent.click(screen.getByText("删除当前文件"));
    fireEvent.click(screen.getByText("confirm-delete"));
    await flushAsync();

    expect(workspaceApiMock.deleteDailyMemoryFile).toHaveBeenCalledWith(
      "2026-03-14.md",
    );
  });

  it("supports keyboard shortcuts for workspace search and saving the active tab", async () => {
    render(<WorkspaceFilesPanel />);
    await flushAsync();

    fireEvent.click(screen.getByText("AGENTS.md"));
    await flushAsync();

    fireEvent.keyDown(window, { key: "p", metaKey: true });
    expect(
      screen.getByPlaceholderText("搜索文件、记忆或日期"),
    ).toHaveFocus();

    fireEvent.change(screen.getByLabelText("workspace-editor"), {
      target: { value: "# updated agents" },
    });

    fireEvent.keyDown(window, { key: "s", metaKey: true });
    await flushAsync();

    expect(workspaceApiMock.writeFile).toHaveBeenCalledWith(
      "AGENTS.md",
      "# updated agents",
    );
  });
});
