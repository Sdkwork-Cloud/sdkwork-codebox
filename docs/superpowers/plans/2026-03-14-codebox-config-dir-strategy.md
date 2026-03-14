# CodeBox Config Directory Strategy Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move CodeBox's default app config storage to platform-native `sdkwork/codebox` directories, while preserving functionality through legacy-path migration and consistent UI/test behavior.

**Architecture:** Centralize default directory resolution in Rust, expose the resolved default app config directory to the frontend, and make migration from legacy `~/.codebox` idempotent. Keep override behavior intact, but stop hardcoding default paths in the renderer and docs.

**Tech Stack:** Rust, Tauri, React, Vitest

---

## Chunk 1: Runtime Path Strategy

### Task 1: Define the new platform-aware default directory

**Files:**
- Modify: `src-tauri/src/config.rs`
- Test: `src-tauri/src/config.rs`

- [ ] Add helper functions for platform-aware default app config directories under `sdkwork/codebox`
- [ ] Add tests for default-path derivation and legacy-path candidates
- [ ] Run targeted Rust tests after the helper changes

### Task 2: Migrate legacy `~/.codebox` data safely

**Files:**
- Modify: `src-tauri/src/config.rs`
- Test: `src-tauri/src/config.rs`

- [ ] Add idempotent legacy migration logic that prefers rename and falls back safely
- [ ] Add tests for migration from legacy path to new path and non-destructive fallback
- [ ] Run targeted Rust tests after migration changes

## Chunk 2: Runtime Integration

### Task 3: Update all CodeBox-local storage callers

**Files:**
- Modify: `src-tauri/src/settings.rs`
- Modify: `src-tauri/src/panic_hook.rs`
- Modify: `src-tauri/src/services/env_manager.rs`
- Modify: `src-tauri/src/app_config.rs`
- Modify: `src-tauri/src/database/mod.rs`

- [ ] Switch local settings, backup, log, and messaging references to the new default directory helpers
- [ ] Keep custom override behavior unchanged for syncable app data
- [ ] Re-run targeted Rust tests covering config load and database initialization

### Task 4: Expose the default app config directory to the frontend

**Files:**
- Modify: `src-tauri/src/commands/settings.rs`
- Modify: `packages/sdkwork-codebox-core/src/lib/api/settings.ts`

- [ ] Add a command/API for reading the default CodeBox config directory without overrides
- [ ] Ensure the frontend can reset to the actual backend-derived default path
- [ ] Add tests for the new command wiring where applicable

## Chunk 3: Frontend and Tests

### Task 5: Remove renderer-side hardcoded `.codebox` defaults

**Files:**
- Modify: `packages/sdkwork-codebox-settings/src/hooks/useDirectorySettings.ts`
- Test: `tests/hooks/useDirectorySettings.test.tsx`
- Test: `tests/integration/SettingsDialog.test.tsx`
- Modify: `tests/msw/handlers.ts`
- Modify: `tests/msw/state.ts`

- [ ] Switch the app config default loader to the backend API
- [ ] Update hook and integration tests to assert the new default directory
- [ ] Verify reset/browse flows still work with override and default states

### Task 6: Update packaging and docs for the new default path

**Files:**
- Modify: `.gitignore`
- Modify: `flatpak/com.codebox.desktop.yml`
- Modify: `flatpak/README.md`
- Modify: `README.md`
- Modify: `README_ZH.md`
- Modify: `README_JA.md`

- [ ] Update Linux packaging guidance and permissions for the new default path
- [ ] Update top-level documentation to show platform-specific config directories
- [ ] Verify there are no stale `.codebox` references in active app/runtime docs except legacy migration notes
