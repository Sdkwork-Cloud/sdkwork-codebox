# Codebox Local Conventions

- Scope: repository-root execution rules for `sdkwork-codebox` that narrow, but do not replace, SDKWork standards.
- Related: `AGENTS.md`, `component.spec.json`, `../ARCHITECT.md`, `../sdkwork-specs/COMPONENT_SPEC.md`, `../sdkwork-specs/FRONTEND_CODE_SPEC.md`, and `../sdkwork-specs/TEST_SPEC.md`.

Read this document only when a task changes desktop shell composition, a workspace package, Tauri host integration, local build or test workflow, or contribution material. Global SDKWork standards remain authoritative; `component.spec.json` remains the machine-readable component contract.

## 1. Package And Desktop Ownership

This repository is a `pnpm` workspace desktop application built with React, Vite, and Tauri.

- Keep root `src/` limited to application shell, startup, and layout composition.
- Put reusable implementation in `packages/`:
  - `packages/sdkwork-codebox-commons` (`@sdkwork/codebox-commons`) owns shared UI, hooks, and utilities.
  - `packages/sdkwork-codebox-core` (`@sdkwork/codebox-core`) owns API clients, query helpers, and platform/runtime code.
  - `packages/sdkwork-codebox-*` (`@sdkwork/codebox-*`) own business modules such as provider, settings, proxy, usage, and workspace.
- `src-tauri/` owns Rust host integration and native packaging.
- `tests/` contains Vitest suites for components, hooks, integration, shell, and utilities.
- `assets/` and `docs/` own screenshots, partner assets, manuals, and release notes.

Do not move reusable business logic back into root `src/`. For detailed composition decisions, read [`ARCHITECT.md`](../ARCHITECT.md) when the task crosses a package or shell boundary.

## 2. Dependency And Composition Boundary

Respect the dependency direction:

```text
types -> commons/i18n -> core -> business modules -> app shell
```

Packages MUST NOT depend on root `src/`. When a task changes composition only, prefer `src/App.tsx` and `src/shell/*` over package-internal changes.

## 3. Local Build And Test Routing

Choose the narrowest command that covers the affected surface:

| Task | Command |
| --- | --- |
| Run the Tauri desktop application | `pnpm dev` |
| Run the Vite renderer only | `pnpm dev:browser:local` |
| Build the desktop application | `pnpm build` |
| Build workspace packages | `pnpm build:packages` |
| Check root TypeScript | `pnpm typecheck` |
| Check workspace packages | `pnpm typecheck:packages` |
| Run unit tests | `pnpm test:unit` |
| Watch unit tests | `pnpm test:unit:watch` |
| Apply or verify formatting | `pnpm format` or `pnpm format:check` |

Run targeted suites before `pnpm test:unit` when a focused test is available.

## 4. TypeScript, React, And Test Conventions

- Use strict TypeScript, 2-space indentation, and ES modules.
- Prefer functional React components. Keep shell-only UI in `src/shell`.
- Package names follow `@sdkwork/codebox-<module>`.
- Keep filenames and exported symbols descriptive, such as `ProviderList.tsx`, `useShellEffects.ts`, and `openclawKeys.ts`.
- Format changed TypeScript, React, CSS, and JSON through the repository Prettier scripts before submission.
- Tests use Vitest, `@testing-library/react`, `jsdom`, and `msw`. Place a test with its concern under `tests/` and use `*.test.ts` or `*.test.tsx` names.
- Cover shell navigation, provider workflows, and integration flows when a change affects layout or state wiring.
- Exclude `backup/**` from ad hoc Vitest commands.

## 5. Contribution Expectations

Use scoped, imperative Conventional Commit subjects, such as `feat: add authHeader field`, `fix: rename OpenCode API format label`, or `chore: bump version`.

Pull requests include a concise summary, a linked issue when applicable, test results, and screenshots or recordings for UI changes.
