# Control Console Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the desktop app into a dark-first control console with new shell/navigation/theme structure while preserving all existing feature behavior and outcomes.

**Architecture:** Introduce a new shell-level navigation model in root `src/` that separates product context, domain navigation, and local views. Keep feature logic inside existing workspace packages, but recompose those screens into the new `产品 / Runtime / Extensions / 控制中心` structure and unify the visual system around `claw-studio`-style zinc surfaces and primary scale tokens.

**Tech Stack:** React, TypeScript, Vite, Tauri, Tailwind CSS, React Query, Framer Motion, Vitest

---

## Chunk 1: Shell Navigation Model

### Task 1: Replace flat view state with product/domain/sub-view schema

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/shell/navigation.ts`
- Test: `tests/integration/App.test.tsx`
- Test: `tests/shell/AppContent.test.tsx`

- [ ] **Step 1: Write failing tests for new shell state transitions**

Add tests that prove:
- product switching changes active product context without losing the active domain
- domain switching restores the last valid sub-view per domain
- unsupported sub-views fall back to the nearest valid destination

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/integration/App.test.tsx tests/shell/AppContent.test.tsx`
Expected: FAIL with assertions around missing domain-based navigation behavior

- [ ] **Step 3: Implement navigation schema and state memory**

Define:
- `Domain = "products" | "runtime" | "extensions" | "control-center"`
- per-domain sub-view config
- product compatibility rules
- state persistence for active product/domain and last sub-view per domain

Update `src/App.tsx` to use:
- `activeProduct`
- `activeDomain`
- `activeSubView`

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/integration/App.test.tsx tests/shell/AppContent.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/shell/navigation.ts tests/integration/App.test.tsx tests/shell/AppContent.test.tsx
git commit -m "feat: introduce control console navigation schema"
```

### Task 2: Rebuild sidebar into product context switcher plus domain navigation

**Files:**
- Modify: `src/shell/AppSidebar.tsx`
- Modify: `src/shell/AppSwitcher.tsx`
- Modify: `src/index.css`
- Test: `tests/shell/AppSidebar.test.tsx`

- [ ] **Step 1: Write failing sidebar tests for new structure**

Add tests that prove:
- product switcher and domain navigation are separate sections
- current product and current domain are both visible
- active states have correct semantics

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/shell/AppSidebar.test.tsx`
Expected: FAIL with missing domain navigation/UI semantics

- [ ] **Step 3: Implement new sidebar composition**

Rebuild sidebar to include:
- brand/status block
- `Products` switcher
- domain nav (`产品`, `Runtime`, `Extensions`, `控制中心`)
- utility footer (`更新`, `帮助`, `关于`)

Preserve existing functional callbacks by remapping them to the new shell state.

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/shell/AppSidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/AppSidebar.tsx src/shell/AppSwitcher.tsx src/index.css tests/shell/AppSidebar.test.tsx
git commit -m "feat: rebuild sidebar as control console navigation"
```

## Chunk 2: Context Toolbar and Domain Composition

### Task 3: Redesign top toolbar as context-aware control strip

**Files:**
- Modify: `src/shell/AppHeader.tsx`
- Modify: `src/shell/navigation.ts`
- Test: `tests/shell/AppHeader.test.tsx`

- [ ] **Step 1: Write failing tests for domain-aware toolbar**

Add tests covering:
- toolbar title/description changes by domain
- domain actions remain bound to the same underlying features
- toolbar reflects current product context

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/shell/AppHeader.test.tsx`
Expected: FAIL with outdated title/action expectations

- [ ] **Step 3: Implement context toolbar**

Rebuild header around:
- current domain metadata
- active product badge
- runtime summary badges
- domain-specific CTA area

Do not change the underlying action handlers.

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/shell/AppHeader.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/AppHeader.tsx src/shell/navigation.ts tests/shell/AppHeader.test.tsx
git commit -m "feat: add context-aware control toolbar"
```

### Task 4: Remap AppContent to the four-domain shell

**Files:**
- Modify: `src/shell/AppContent.tsx`
- Modify: `src/App.tsx`
- Test: `tests/shell/AppContent.test.tsx`

- [ ] **Step 1: Write failing tests for new domain-to-screen mapping**

Cover:
- `产品` maps to Providers/Sessions/Workspace
- `Runtime` maps to Proxy/Takeover/Failover/Usage/Diagnostics
- `Extensions` maps to Prompts/Skills/MCP
- `控制中心` maps to the rebuilt settings center

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/shell/AppContent.test.tsx`
Expected: FAIL with mismatched content routing

- [ ] **Step 3: Implement domain composition**

Use existing package screens where possible:
- providers/session/workspace screens in product domain
- proxy/usage/log/model-test screens in runtime domain
- prompt/skills/mcp screens in extensions domain
- settings screens in control-center domain

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/shell/AppContent.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/AppContent.tsx src/App.tsx tests/shell/AppContent.test.tsx
git commit -m "feat: compose app content by control domains"
```

## Chunk 3: Theme System and Design Tokens

### Task 5: Replace current warm shell tokens with claw-studio-aligned dark console tokens

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.cjs`
- Modify: `packages/sdkwork-codebox-commons/src/components/theme-provider.tsx`
- Test: `tests/components/SettingsDialog.test.tsx`

- [ ] **Step 1: Write failing tests for theme controls and settings expectations**

Cover:
- default dark-first mode
- palette options aligned with the new token model
- theme settings still render and apply instantly where expected

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/components/SettingsDialog.test.tsx`
Expected: FAIL with stale theme option structure or default assumptions

- [ ] **Step 3: Implement tokenized dark-first design system**

Introduce:
- zinc-based neutral surfaces
- `primary-50..950` palette tokens
- semantic surface/text/border/status tokens
- default `tech-blue` dark-first shell styling

Keep native window theme sync behavior intact.

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/components/SettingsDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.css tailwind.config.cjs packages/sdkwork-codebox-commons/src/components/theme-provider.tsx tests/components/SettingsDialog.test.tsx
git commit -m "feat: adopt claw-studio dark console theme system"
```

### Task 6: Make theme settings first-class application settings

**Files:**
- Modify: `packages/sdkwork-codebox-types/src/index.ts`
- Modify: `packages/sdkwork-codebox-core/src/lib/schemas/settings.ts`
- Modify: `packages/sdkwork-codebox-settings/src/hooks/useSettingsForm.ts`
- Modify: `packages/sdkwork-codebox-settings/src/hooks/useSettings.ts`
- Modify: `src-tauri/src/settings.rs`
- Modify: `tests/hooks/useSettingsForm.test.tsx`
- Modify: `tests/hooks/useSettings.test.tsx`

- [ ] **Step 1: Write failing tests for persisted theme settings**

Cover:
- theme mode, palette, density, and motion preference entering settings form state
- save payload includes new fields
- defaults remain safe when older settings files omit the fields

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/hooks/useSettingsForm.test.tsx tests/hooks/useSettings.test.tsx`
Expected: FAIL with missing settings fields

- [ ] **Step 3: Implement settings model migration**

Add and normalize:
- `themeMode`
- `themePalette`
- `uiDensity`
- `motionPreference`

Preserve backward compatibility at the data-file level while making the new shell rely on a single settings source of truth.

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/hooks/useSettingsForm.test.tsx tests/hooks/useSettings.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/sdkwork-codebox-types/src/index.ts packages/sdkwork-codebox-core/src/lib/schemas/settings.ts packages/sdkwork-codebox-settings/src/hooks/useSettingsForm.ts packages/sdkwork-codebox-settings/src/hooks/useSettings.ts src-tauri/src/settings.rs tests/hooks/useSettingsForm.test.tsx tests/hooks/useSettings.test.tsx
git commit -m "feat: persist control console theme preferences"
```

## Chunk 4: Control Center Redesign

### Task 7: Rebuild control center to focus on system settings only

**Files:**
- Modify: `packages/sdkwork-codebox-settings/src/components/settings/SettingsPage.tsx`
- Modify: `packages/sdkwork-codebox-settings/src/components/settings/ThemeSettings.tsx`
- Modify: `packages/sdkwork-codebox-settings/src/components/settings/AppVisibilitySettings.tsx`
- Modify: `tests/components/SettingsDialog.test.tsx`
- Modify: `tests/integration/SettingsDialog.test.tsx`

- [ ] **Step 1: Write failing tests for the new control center grouping**

Cover:
- vertical left tabs and right content panel
- control-center sections limited to true settings domains
- runtime-heavy content no longer rendered inside settings

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/components/SettingsDialog.test.tsx tests/integration/SettingsDialog.test.tsx`
Expected: FAIL with outdated tab and content assumptions

- [ ] **Step 3: Implement focused control center**

Group control-center sections into:
- `外观`
- `通用`
- `数据与同步`
- `目录`
- `高级`
- `关于`

Move runtime-oriented panels out of the control center and keep all settings behaviors intact.

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/components/SettingsDialog.test.tsx tests/integration/SettingsDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/sdkwork-codebox-settings/src/components/settings/SettingsPage.tsx packages/sdkwork-codebox-settings/src/components/settings/ThemeSettings.tsx packages/sdkwork-codebox-settings/src/components/settings/AppVisibilitySettings.tsx tests/components/SettingsDialog.test.tsx tests/integration/SettingsDialog.test.tsx
git commit -m "feat: focus control center on system settings"
```

## Chunk 5: Runtime and Extensions Recomposition

### Task 8: Consolidate runtime features under the Runtime domain

**Files:**
- Modify: `src/shell/AppContent.tsx`
- Modify: `src/shell/AppHeader.tsx`
- Modify: `packages/sdkwork-codebox-settings/src/components/settings/ProxyTabContent.tsx`
- Modify: `packages/sdkwork-codebox-settings/src/components/settings/LogConfigPanel.tsx`
- Modify: `packages/sdkwork-codebox-usage/src/components/usage/UsageDashboard.tsx`
- Test: `tests/integration/App.test.tsx`

- [ ] **Step 1: Write failing tests for runtime domain access**

Cover:
- `Proxy`, `Takeover`, `Failover`, `Usage`, and `Diagnostics` all remain reachable
- their actions still call the same underlying feature flows

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/integration/App.test.tsx`
Expected: FAIL with new runtime navigation expectations

- [ ] **Step 3: Recompose runtime pages**

Keep existing components but present them under the new runtime domain shell and toolbar structure.

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/integration/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/AppContent.tsx src/shell/AppHeader.tsx packages/sdkwork-codebox-settings/src/components/settings/ProxyTabContent.tsx packages/sdkwork-codebox-settings/src/components/settings/LogConfigPanel.tsx packages/sdkwork-codebox-usage/src/components/usage/UsageDashboard.tsx tests/integration/App.test.tsx
git commit -m "feat: move runtime capabilities into runtime domain"
```

### Task 9: Consolidate extension features under the Extensions domain

**Files:**
- Modify: `src/shell/AppContent.tsx`
- Modify: `src/shell/AppHeader.tsx`
- Modify: `src/shell/navigation.ts`
- Test: `tests/integration/App.test.tsx`

- [ ] **Step 1: Write failing tests for extensions domain access**

Cover:
- `Prompts`, `Skills`, and `MCP` remain reachable
- discovery/import actions remain bound to the same screens

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/integration/App.test.tsx`
Expected: FAIL with new extensions navigation expectations

- [ ] **Step 3: Recompose extensions pages**

Keep existing prompt, skills, and MCP components, but place them under the new extensions domain.

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/integration/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shell/AppContent.tsx src/shell/AppHeader.tsx src/shell/navigation.ts tests/integration/App.test.tsx
git commit -m "feat: move extension capabilities into extensions domain"
```

## Chunk 6: Final Interaction Polish

### Task 10: Normalize state feedback, page chrome, and critical interactions

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/shell/AppSidebar.tsx`
- Modify: `src/shell/AppHeader.tsx`
- Modify: `src/shell/useShellEffects.ts`
- Modify: `src/index.css`
- Test: `tests/hooks/useShellEffects.test.tsx`
- Test: `tests/integration/App.test.tsx`

- [ ] **Step 1: Write failing tests for the final interaction rules**

Cover:
- `Cmd/Ctrl + ,` opens `控制中心`
- product switching is visually and logically consistent
- domain switching preserves context
- escape/back behavior still works

- [ ] **Step 2: Run targeted tests to confirm red state**

Run: `pnpm test:unit -- tests/hooks/useShellEffects.test.tsx tests/integration/App.test.tsx`
Expected: FAIL with outdated shell behavior assumptions

- [ ] **Step 3: Implement final interaction polish**

Unify:
- keyboard shortcuts
- active-state feedback
- save-state display
- runtime badges and health placement
- motion timing

- [ ] **Step 4: Run targeted tests to confirm green state**

Run: `pnpm test:unit -- tests/hooks/useShellEffects.test.tsx tests/integration/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Run broad verification**

Run: `pnpm test:unit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/shell/AppSidebar.tsx src/shell/AppHeader.tsx src/shell/useShellEffects.ts src/index.css tests/hooks/useShellEffects.test.tsx tests/integration/App.test.tsx
git commit -m "feat: finalize control console interactions and feedback"
```
