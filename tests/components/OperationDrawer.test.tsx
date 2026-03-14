import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OperationDrawer } from "@/components/common/OperationDrawer";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogContent: ({
    children,
    className,
    variant,
    overlayClassName,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
    overlayClassName?: string;
  }) => (
    <div
      data-testid="dialog-content"
      data-class={className}
      data-variant={variant}
      data-overlay={overlayClassName}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));

describe("OperationDrawer", () => {
  it("keeps the drawer viewport stable while compacting inner paddings", () => {
    render(
      <OperationDrawer
        open
        onOpenChange={vi.fn()}
        title="Edit Provider"
        description="workspace"
        testId="operation-drawer"
      >
        <div>body</div>
      </OperationDrawer>,
    );

    const dialogContent = screen.getByTestId("dialog-content");
    expect(dialogContent).toHaveAttribute("data-variant", "drawer-right");
    expect(dialogContent.getAttribute("data-class")).not.toContain("left-2");
    expect(dialogContent.getAttribute("data-class")).not.toContain(
      "max-w-none",
    );

    expect(screen.getByTestId("operation-drawer")).toHaveClass("w-full");
    expect(screen.getByTestId("operation-drawer-body")).toHaveClass("px-4");
    expect(screen.getByTestId("operation-drawer-body")).toHaveClass("py-4");
  });
});
