# Debug Console Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a temporary Windows debug launch path that exposes backend console output and frontend white-screen diagnostics without changing the default release UX.

**Architecture:** Keep the existing release binary unchanged, and add two opt-in debugging paths: a console-enabled Rust binary variant and a script/env-driven debug launch mode. Frontend diagnostics stay dormant unless explicitly enabled, so production behavior remains the same while white-screen investigation gets actionable logs.

**Tech Stack:** Rust, Tauri 2, React, Vite, pnpm, Vitest/Cargo tests

---

### Task 1: Document the Rust debug binary switch

**Files:**
- Modify: `src-tauri/src/main.rs`
- Test: `src-tauri/src/lib.rs`

**Step 1: Write the failing test**

Add a focused Rust unit test in `src-tauri/src/lib.rs` for a helper that parses a debug-console environment flag:

```rust
#[test]
fn debug_console_flag_is_enabled_for_truthy_values() {
    assert!(debug_console_enabled_from_env_value(Some("1")));
    assert!(debug_console_enabled_from_env_value(Some("true")));
    assert!(!debug_console_enabled_from_env_value(Some("0")));
    assert!(!debug_console_enabled_from_env_value(None));
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test debug_console_flag_is_enabled_for_truthy_values --lib`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Create a tiny helper in `src-tauri/src/lib.rs` that treats `1`, `true`, `yes`, and `on` as enabled. Expose a `pub fn debug_console_enabled()` wrapper that reads `CODEBOX_DEBUG_CONSOLE`.

**Step 4: Run test to verify it passes**

Run: `cargo test debug_console_flag_is_enabled_for_truthy_values --lib`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/lib.rs src-tauri/src/main.rs
git commit -m "feat: add debug console flag helper"
```

### Task 2: Add a console-enabled Windows binary path

**Files:**
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/Cargo.toml`
- Test: `src-tauri/src/lib.rs`

**Step 1: Write the failing test**

Add a second unit test in `src-tauri/src/lib.rs` for a helper that decides whether the process should suppress the Windows console:

```rust
#[test]
fn release_console_is_suppressed_only_when_debug_flag_is_disabled() {
    assert!(should_hide_windows_console(false, false));
    assert!(!should_hide_windows_console(false, true));
    assert!(!should_hide_windows_console(true, false));
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test release_console_is_suppressed_only_when_debug_flag_is_disabled --lib`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Replace the unconditional release-only subsystem attribute in `src-tauri/src/main.rs` with a conditional strategy:
- Keep the normal target using `windows_subsystem = "windows"`.
- Add a dedicated Cargo feature or bin cfg for a debug-console variant that does not set the subsystem to `windows`.
- Make the variant names explicit so the build output is easy to distinguish.

Keep this change scoped to Windows behavior only.

**Step 4: Run test to verify it passes**

Run: `cargo test release_console_is_suppressed_only_when_debug_flag_is_disabled --lib`
Expected: PASS.

**Step 5: Commit**

```bash
git add src-tauri/src/main.rs src-tauri/Cargo.toml src-tauri/src/lib.rs
git commit -m "feat: add windows debug console binary variant"
```

### Task 3: Add pnpm scripts for the debug paths

**Files:**
- Modify: `package.json`
- Optionally create: `scripts/run-debug-console.ps1`
- Test: none

**Step 1: Write the failing test**

No automated test is needed for package script registration. Use a command-level verification instead.

**Step 2: Run verification to confirm the scripts are missing**

Run: `pnpm run`
Expected: there is no `build:debug-console` or `run:debug-console`.

**Step 3: Write minimal implementation**

Add scripts that cover both requested debugging paths:
- `build:debug-console`: build the console-enabled Windows variant.
- `run:debug-console`: launch the app with `CODEBOX_DEBUG_CONSOLE=1` and frontend debug env enabled.

If a PowerShell script is clearer than an inline command, add `scripts/run-debug-console.ps1` and keep the package script thin.

**Step 4: Run verification to confirm the scripts exist**

Run: `pnpm run`
Expected: both new scripts are listed.

**Step 5: Commit**

```bash
git add package.json scripts/run-debug-console.ps1
git commit -m "feat: add debug console launch scripts"
```

### Task 4: Add frontend white-screen diagnostics behind an env flag

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/vite-env.d.ts`
- Test: `tests/shell` or `tests/utils`

**Step 1: Write the failing test**

Add a focused frontend test that verifies a debug-only error hook logs uncaught errors when enabled:

```ts
test("installs white-screen diagnostics when debug env is enabled", () => {
  const addEventListener = vi.spyOn(window, "addEventListener");

  installDebugDiagnostics({ enabled: true });

  expect(addEventListener).toHaveBeenCalledWith("error", expect.any(Function));
  expect(addEventListener).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/.../debugDiagnostics.test.ts`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Extract a tiny helper from `src/main.tsx` that:
- checks `import.meta.env.VITE_DEBUG_DIAGNOSTICS`
- attaches `error` and `unhandledrejection` listeners only when enabled
- prints structured console output for uncaught frontend failures

Do not add any user-facing UI yet. Console output is enough for this temporary debugging mode.

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run tests/.../debugDiagnostics.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/main.tsx src/vite-env.d.ts tests/.../debugDiagnostics.test.ts
git commit -m "feat: add frontend debug diagnostics"
```

### Task 5: Verify the end-to-end debug paths

**Files:**
- Verify: `package.json`
- Verify: `src-tauri/target/...`

**Step 1: Build the normal desktop app**

Run: `pnpm build`
Expected: the normal release build still succeeds.

**Step 2: Build the console-enabled variant**

Run: `pnpm run build:debug-console`
Expected: a distinct console-enabled binary is produced successfully.

**Step 3: Reproduce launch with debug output**

Run: `pnpm run run:debug-console`
Expected: backend logs stay visible in the console, and frontend uncaught errors print there instead of silently yielding a blank window.

**Step 4: Smoke-check default behavior**

Run the normal packaged app or `src-tauri/target/release/codebox.exe`
Expected: it still launches without an extra console window.

**Step 5: Commit**

```bash
git add package.json src-tauri/src/main.rs src-tauri/src/lib.rs src/main.tsx src/vite-env.d.ts tests
git commit -m "feat: add temporary white-screen debug console mode"
```
