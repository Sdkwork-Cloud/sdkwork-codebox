import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "@/shell/AppSidebar";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      (options?.defaultValue as string) ?? key,
  }),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => <span data-testid="provider-icon" />,
}));

vi.mock("@/shell/UpdateBadge", () => ({
  UpdateBadge: ({ onClick }: any) => (
    <button onClick={onClick}>update-badge</button>
  ),
}));

function createProps(
  overrides: Partial<React.ComponentProps<typeof AppSidebar>> = {},
) {
  const props: React.ComponentProps<typeof AppSidebar> = {
    activeApp: "claude" as const,
    activeDomain: "products" as const,
    isCurrentAppTakeoverActive: true,
    isProxyRunning: true,
    onOpenControlCenter: vi.fn(),
    setActiveApp: vi.fn(),
    visibleApps: {
      claude: true,
      codex: true,
      gemini: true,
      opencode: true,
      openclaw: true,
    },
    ...overrides,
  };

  return props;
}

describe("AppSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product navigation with settings and update entrypoints", () => {
    const props = createProps();
    render(<AppSidebar {...props} />);

    expect(screen.getByText("CodeBox")).toBeInTheDocument();
    expect(screen.getByText("apps.claude")).toBeInTheDocument();
    expect(screen.getByText("apps.codex")).toBeInTheDocument();
    expect(screen.getByText("apps.openclaw")).toBeInTheDocument();
    expect(screen.queryByText("Products")).not.toBeInTheDocument();
    expect(screen.queryByText("工作域")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByText("apps.codex")[0]);
    expect(props.setActiveApp).toHaveBeenCalledWith("codex");

    fireEvent.click(screen.getByText("设置"));
    expect(props.onOpenControlCenter).toHaveBeenCalledWith("appearance");

    fireEvent.click(screen.getByText("update-badge"));
    expect(props.onOpenControlCenter).toHaveBeenCalledWith("about");

    const updateButton = screen.getByText("update-badge").closest("button");
    const settingsButton = screen.getByText("设置").closest("button");
    const allButtons = screen.getAllByRole("button");

    expect(updateButton).not.toBeNull();
    expect(settingsButton).not.toBeNull();
    expect(allButtons.indexOf(updateButton!)).toBeLessThan(
      allButtons.indexOf(settingsButton!),
    );
    expect(screen.getByText("主题、目录与同步设置")).toHaveClass("break-words");
  });

  it("reopens the remembered control-center view from the settings entry", () => {
    const props = createProps({
      controlCenterEntryView: "directories" as any,
    } as any);

    render(<AppSidebar {...props} />);

    fireEvent.click(screen.getByText("设置"));
    expect(props.onOpenControlCenter).toHaveBeenCalledWith("directories");
  });

  it("keeps status copy visible while settings is active", () => {
    const props = createProps({
      activeApp: "openclaw",
      activeDomain: "control-center",
      isCurrentAppTakeoverActive: false,
      isProxyRunning: false,
    });

    render(<AppSidebar {...props} />);

    expect(screen.getByText("代理待机")).toBeInTheDocument();
    expect(screen.getByText("apps.openclaw")).toBeInTheDocument();
  });
});
